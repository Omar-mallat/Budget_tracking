const router = require('express').Router();
const prisma = require('../db');
const { getPrimaryFamily, canModify } = require('../utils/family');

// All routes use req.user.userId from the JWT — never trust userId from URL params.
// If the user belongs to a family, expenses are shared with the whole family;
// otherwise they stay private to the user (personal mode).

router.get("/", async (req, res) => {
  const userId = req.user.userId;
  try {
    const membership = await getPrimaryFamily(userId);
    const expenses = await prisma.expense.findMany({
      where: membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null },
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(expenses.map(e => ({ ...e, canEdit: canModify(membership, e.user_id, userId) })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/total", async (req, res) => {
  const userId = req.user.userId;
  try {
    const membership = await getPrimaryFamily(userId);
    const result = await prisma.expense.aggregate({
      where: membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null },
      _sum: { amount: true },
    });
    res.json({ totalExpenses: result._sum.amount ?? 0 });
  } catch (error) {
    console.error("Error fetching total expenses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Checks the category's monthly budget limit if one is set, otherwise falls back
// to the available balance (total income - total expenses). Both are scoped to the
// family when the user belongs to one, or to the user personally otherwise.
async function checkAffordability(membership, userId, category, amount, date, excludeExpenseId = null) {
  const scopeWhere = membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null };

  const limit = membership
    ? await prisma.budgetLimit.findUnique({ where: { familyId_category: { familyId: membership.familyId, category } } })
    : await prisma.budgetLimit.findUnique({ where: { user_id_category: { user_id: userId, category } } });

  if (limit) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const agg = await prisma.expense.aggregate({
      where: {
        ...scopeWhere,
        category,
        date: { gte: startOfMonth, lte: endOfMonth },
        ...(excludeExpenseId ? { id: { not: excludeExpenseId } } : {}),
      },
      _sum: { amount: true },
    });
    const spent = Number(agg._sum.amount ?? 0);
    const monthlyLimit = Number(limit.monthly_limit);
    if (spent + amount > monthlyLimit) {
      return `This exceeds your monthly budget for ${category}: ${spent.toFixed(2)} already spent of ${monthlyLimit.toFixed(2)} TND limit`;
    }
    return null;
  }

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.income.aggregate({ where: scopeWhere, _sum: { amount: true } }),
    prisma.expense.aggregate({
      where: { ...scopeWhere, ...(excludeExpenseId ? { id: { not: excludeExpenseId } } : {}) },
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

router.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { title, amount, category, date, reference, is_recurring, recurrence_type } = req.body;

  if (!title || !amount || !category || !date) {
    return res.status(400).json({ error: "title, amount, category, and date are required" });
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
    const membership = await getPrimaryFamily(userId);
    const affordabilityError = await checkAffordability(membership, userId, category, parsedAmount, parsedDate);
    if (affordabilityError) return res.status(400).json({ error: affordabilityError });

    const expense = await prisma.expense.create({
      data: {
        user_id: userId,
        familyId: membership?.familyId ?? null,
        title,
        amount: parsedAmount,
        category,
        date: new Date(date),
        reference: reference ?? null,
        is_recurring: is_recurring ?? false,
        recurrence_type: recurrence_type || null,
      },
    });
    res.status(201).json({ message: "Expense added successfully", expense });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:expenseId", async (req, res) => {
  const userId = req.user.userId;
  const expenseId = parseInt(req.params.expenseId);
  const { title, amount, category, date, reference, is_recurring, recurrence_type } = req.body;

  if (!title || !amount || !category || !date) {
    return res.status(400).json({ error: "title, amount, category, and date are required" });
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
    const membership = await getPrimaryFamily(userId);
    const existing = await prisma.expense.findFirst({
      where: membership ? { id: expenseId, familyId: membership.familyId } : { id: expenseId, user_id: userId, familyId: null },
    });
    if (!existing) return res.status(404).json({ message: "Expense not found" });
    if (!canModify(membership, existing.user_id, userId)) {
      return res.status(403).json({ error: "Only the member who added this expense, or a family admin, can edit it" });
    }

    const affordabilityError = await checkAffordability(membership, userId, category, parsedAmount, parsedDate, expenseId);
    if (affordabilityError) return res.status(400).json({ error: affordabilityError });

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title,
        amount: parsedAmount,
        category,
        date: parsedDate,
        reference: reference ?? null,
        is_recurring: is_recurring ?? false,
        recurrence_type: recurrence_type || null,
      },
    });
    res.json({ message: "Expense updated successfully", expense });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:expenseId", async (req, res) => {
  const userId = req.user.userId;
  const expenseId = parseInt(req.params.expenseId);
  try {
    const membership = await getPrimaryFamily(userId);
    const existing = await prisma.expense.findFirst({
      where: membership ? { id: expenseId, familyId: membership.familyId } : { id: expenseId, user_id: userId, familyId: null },
    });
    if (!existing) return res.status(404).json({ message: "Expense not found" });
    if (!canModify(membership, existing.user_id, userId)) {
      return res.status(403).json({ error: "Only the member who added this expense, or a family admin, can delete it" });
    }

    await prisma.expense.delete({ where: { id: expenseId } });
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
