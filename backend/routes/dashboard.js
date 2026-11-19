const router = require('express').Router();
const prisma = require('../db');
const { getPrimaryFamily } = require('../utils/family');

router.get("/summary", async (req, res) => {
  const userId = req.user.userId;
  try {
    const membership = await getPrimaryFamily(userId);
    const scopeWhere = membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null };

    const [incomeResult, expenseResult] = await Promise.all([
      prisma.income.aggregate({ where: scopeWhere, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: scopeWhere, _sum: { amount: true } }),
    ]);

    const totalIncome = Number(incomeResult._sum.amount ?? 0);
    const totalExpenses = Number(expenseResult._sum.amount ?? 0);
    const totalBalance = totalIncome - totalExpenses;

    res.json({ totalIncome, totalExpenses, totalBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/transactions", async (req, res) => {
  const userId = req.user.userId;
  try {
    const membership = await getPrimaryFamily(userId);
    const scopeWhere = membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null };

    const [incomes, expenses] = await Promise.all([
      prisma.income.findMany({
        where: scopeWhere,
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, amount: true, title: true, category: true, source: true, date: true, user: { select: { id: true, name: true } } },
      }),
      prisma.expense.findMany({
        where: scopeWhere,
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, amount: true, title: true, category: true, date: true, user: { select: { id: true, name: true } } },
      }),
    ]);

    const transactions = [
      ...incomes.map(t => ({ id: t.id, amount: t.amount, type: 'income', title: t.title, category: t.category, date: t.date, addedBy: t.user?.name ?? null })),
      ...expenses.map(t => ({ id: t.id, amount: t.amount, type: 'expense', title: t.title, category: t.category, date: t.date, addedBy: t.user?.name ?? null })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
