const router = require('express').Router();
const prisma = require('../db');
const { getPrimaryFamily, canModify } = require('../utils/family');

// GET /budgets/status — current month spending vs limits (family-shared if the user belongs to one)
router.get("/status", async (req, res) => {
  const userId = req.user.userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    const membership = await getPrimaryFamily(userId);
    const scopeWhere = membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null };

    const [limits, monthlyExpenses] = await Promise.all([
      prisma.budgetLimit.findMany({ where: scopeWhere }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { ...scopeWhere, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    const result = limits.map(limit => {
      const match = monthlyExpenses.find(e => e.category === limit.category);
      const spent = Number(match?._sum.amount ?? 0);
      const monthly_limit = Number(limit.monthly_limit);
      const percentage = monthly_limit > 0 ? Math.round((spent / monthly_limit) * 100) : 0;
      return {
        id: limit.id,
        category: limit.category,
        monthly_limit,
        spent,
        percentage,
        canEdit: canModify(membership, limit.user_id, userId),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching budget status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /budgets — all budget limits for the current user's family (or personally, if no family)
router.get("/", async (req, res) => {
  const userId = req.user.userId;
  try {
    const membership = await getPrimaryFamily(userId);
    const limits = await prisma.budgetLimit.findMany({
      where: membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null },
    });
    res.json(limits);
  } catch (error) {
    console.error("Error fetching budget limits:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /budgets — create or update a budget limit (upsert by category, scoped to family or user)
router.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { category, monthly_limit } = req.body;

  if (!category || !monthly_limit) {
    return res.status(400).json({ error: "category and monthly_limit are required" });
  }

  const parsedLimit = parseFloat(monthly_limit);
  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    return res.status(400).json({ error: "monthly_limit must be a positive number" });
  }

  try {
    const membership = await getPrimaryFamily(userId);

    let limit;
    if (membership) {
      limit = await prisma.budgetLimit.upsert({
        where: { familyId_category: { familyId: membership.familyId, category } },
        update: { monthly_limit: parsedLimit },
        create: { user_id: userId, familyId: membership.familyId, category, monthly_limit: parsedLimit },
      });
    } else {
      limit = await prisma.budgetLimit.upsert({
        where: { user_id_category: { user_id: userId, category } },
        update: { monthly_limit: parsedLimit },
        create: { user_id: userId, category, monthly_limit: parsedLimit },
      });
    }
    res.status(201).json({ message: "Budget limit saved", limit });
  } catch (error) {
    console.error("Error saving budget limit:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /budgets/:id — remove a budget limit (creator or family admin only)
router.delete("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  try {
    const membership = await getPrimaryFamily(userId);
    const existing = await prisma.budgetLimit.findFirst({
      where: membership ? { id, familyId: membership.familyId } : { id, user_id: userId, familyId: null },
    });
    if (!existing) return res.status(404).json({ message: "Budget limit not found" });
    if (!canModify(membership, existing.user_id, userId)) {
      return res.status(403).json({ error: "Only the member who set this budget, or a family admin, can remove it" });
    }

    await prisma.budgetLimit.delete({ where: { id } });
    res.json({ message: "Budget limit deleted" });
  } catch (error) {
    console.error("Error deleting budget limit:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
