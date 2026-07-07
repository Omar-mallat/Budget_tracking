const router = require('express').Router();
const prisma = require('../db');

// GET /budgets/status — current month spending vs limits (legacy per-user)
router.get("/status", async (req, res) => {
  const userId = req.user.userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    const [limits, monthlyExpenses] = await Promise.all([
      prisma.budgetLimit.findMany({ where: { user_id: userId } }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { user_id: userId, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    const result = limits.map(limit => {
      const match = monthlyExpenses.find(e => e.category === limit.category);
      const spent = Number(match?._sum.amount ?? 0);
      const monthly_limit = Number(limit.monthly_limit);
      const percentage = monthly_limit > 0 ? Math.round((spent / monthly_limit) * 100) : 0;
      return { id: limit.id, category: limit.category, monthly_limit, spent, percentage };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching budget status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /budgets — all budget limits for current user
router.get("/", async (req, res) => {
  const userId = req.user.userId;
  try {
    const limits = await prisma.budgetLimit.findMany({ where: { user_id: userId } });
    res.json(limits);
  } catch (error) {
    console.error("Error fetching budget limits:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /budgets — create or update a budget limit (upsert by user+category)
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
    const limit = await prisma.budgetLimit.upsert({
      where: { user_id_category: { user_id: userId, category } },
      update: { monthly_limit: parsedLimit },
      create: { user_id: userId, category, monthly_limit: parsedLimit },
    });
    res.status(201).json({ message: "Budget limit saved", limit });
  } catch (error) {
    console.error("Error saving budget limit:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /budgets/:id — remove a budget limit (owner check)
router.delete("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  try {
    const existing = await prisma.budgetLimit.findFirst({ where: { id, user_id: userId } });
    if (!existing) return res.status(404).json({ message: "Budget limit not found" });

    await prisma.budgetLimit.delete({ where: { id } });
    res.json({ message: "Budget limit deleted" });
  } catch (error) {
    console.error("Error deleting budget limit:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
