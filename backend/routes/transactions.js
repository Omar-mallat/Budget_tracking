const router = require('express').Router();
const prisma = require('../db');
const { notifyUsers } = require('../utils/notify');

// Helper: verify user is a member of the given family
async function assertFamilyMember(userId, familyId) {
  const m = await prisma.familyMember.findFirst({ where: { userId, familyId } });
  return !!m;
}

// GET /transactions — list transactions for a family or personal
// Query params: familyId, type (INCOME|EXPENSE), category, from, to, limit
router.get("/", async (req, res) => {
  const userId = req.user.userId;
  const { familyId, type, category, from, to, limit = 50 } = req.query;

  const where = {};

  if (familyId) {
    const fid = parseInt(familyId);
    const isMember = await assertFamilyMember(userId, fid);
    if (!isMember) return res.status(403).json({ error: "Access denied" });
    where.familyId = fid;
  } else {
    where.userId = userId;
    where.familyId = null;
  }

  if (type) where.type = type;
  if (category) where.category = category;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /transactions/summary — totals and monthly breakdown
router.get("/summary", async (req, res) => {
  const userId = req.user.userId;
  const { familyId } = req.query;

  const where = {};
  if (familyId) {
    const fid = parseInt(familyId);
    const isMember = await assertFamilyMember(userId, fid);
    if (!isMember) return res.status(403).json({ error: "Access denied" });
    where.familyId = fid;
  } else {
    where.userId = userId;
    where.familyId = null;
  }

  try {
    const [incomeAgg, expenseAgg, byCategory] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['category', 'type'],
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      byCategory: byCategory.map(b => ({
        category: b.category,
        amount: Number(b._sum.amount),
      })),
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Checks the category's monthly family budget if one is set, otherwise falls back
// to the overall balance (total income - total expenses) in the same scope
// (family-wide, or personal if no familyId). Returns an error string, or null if affordable.
async function checkAffordability(scope, category, amount, date, excludeTransactionId = null) {
  if (scope.familyId) {
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const budget = await prisma.budget.findFirst({
      where: { familyId: scope.familyId, month, category: { name: category } },
    });

    if (budget) {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const agg = await prisma.transaction.aggregate({
        where: {
          familyId: scope.familyId,
          type: 'EXPENSE',
          category,
          date: { gte: startOfMonth, lte: endOfMonth },
          ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {}),
        },
        _sum: { amount: true },
      });
      const spent = Number(agg._sum.amount ?? 0);
      const limit = Number(budget.limitAmount);
      if (spent + amount > limit) {
        return `This exceeds the family's monthly budget for ${category}: ${spent.toFixed(2)} already spent of ${limit.toFixed(2)} TND limit`;
      }
      return null;
    }
  }

  const where = scope.familyId ? { familyId: scope.familyId } : { userId: scope.userId, familyId: null };
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...where, type: 'INCOME' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: {
        ...where,
        type: 'EXPENSE',
        ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {}),
      },
      _sum: { amount: true },
    }),
  ]);
  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
  const available = totalIncome - totalExpenses;

  if (amount > available) {
    return `Insufficient balance: ${available.toFixed(2)} TND available, this expense is ${amount.toFixed(2)} TND`;
  }
  return null;
}

// POST /transactions — create a new transaction
router.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { familyId, type, amount, category, description, date, paymentMethod } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: "type, amount, category, and date are required" });
  }
  if (!['INCOME', 'EXPENSE'].includes(type)) {
    return res.status(400).json({ error: "type must be INCOME or EXPENSE" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  let fid = null;
  if (familyId) {
    fid = parseInt(familyId);
    const isMember = await assertFamilyMember(userId, fid);
    if (!isMember) return res.status(403).json({ error: "Access denied" });
  }

  try {
    if (type === 'EXPENSE') {
      const affordabilityError = await checkAffordability({ familyId: fid, userId }, category, parsedAmount, parsedDate);
      if (affordabilityError) return res.status(400).json({ error: affordabilityError });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        familyId: fid,
        type,
        amount: parsedAmount,
        category,
        description: description ?? null,
        date: parsedDate,
        paymentMethod: paymentMethod ?? null,
      },
    });

    // Auto-check budget alerts when an expense is created in a family context
    if (type === 'EXPENSE' && fid) {
      checkBudgetAlert(userId, fid, category, parsedDate);
    }

    res.status(201).json({ message: "Transaction created", transaction });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /transactions/:id
router.put("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  const { type, amount, category, description, date, paymentMethod } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: "type, amount, category, and date are required" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  try {
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Transaction not found" });

    if (type === 'EXPENSE') {
      const affordabilityError = await checkAffordability(
        { familyId: existing.familyId, userId },
        category,
        parsedAmount,
        parsedDate,
        id
      );
      if (affordabilityError) return res.status(400).json({ error: affordabilityError });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount: parsedAmount,
        category,
        description: description ?? null,
        date: parsedDate,
        paymentMethod: paymentMethod ?? null,
      },
    });
    res.json({ message: "Transaction updated", transaction });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /transactions/:id
router.delete("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  try {
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Transaction not found" });

    await prisma.transaction.delete({ where: { id } });
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Fire-and-forget budget alert check (no await — doesn't block the response)
async function checkBudgetAlert(userId, familyId, category, date) {
  try {
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const budget = await prisma.budget.findFirst({
      where: { familyId, month, category: { name: category } },
      include: { category: true },
    });
    if (!budget) return;

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const agg = await prisma.transaction.aggregate({
      where: { familyId, type: 'EXPENSE', category, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });

    const spent = Number(agg._sum.amount ?? 0);
    const limit = Number(budget.limitAmount);
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    const members = await prisma.familyMember.findMany({ where: { familyId } });
    const memberIds = members.map(m => m.userId);

    if (pct >= 100) {
      await notifyUsers(memberIds, `🚨 Budget exceeded: ${category} is at ${pct}% (${spent.toFixed(2)} / ${limit.toFixed(2)} TND)`);
    } else if (pct >= 80) {
      await notifyUsers(memberIds, `⚠️ Budget warning: ${category} has reached ${pct}% of the monthly limit`);
    }
  } catch (err) {
    console.error("Budget alert check failed:", err.message);
  }
}

module.exports = router;
