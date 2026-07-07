const router = require('express').Router();
const prisma = require('../db');

router.get("/summary", async (req, res) => {
  const userId = req.user.userId;
  try {
    const [incomeResult, expenseResult] = await Promise.all([
      prisma.income.aggregate({ where: { user_id: userId }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { user_id: userId }, _sum: { amount: true } }),
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
    const [incomes, expenses] = await Promise.all([
      prisma.income.findMany({
        where: { user_id: userId },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, amount: true, title: true, source: true, date: true },
      }),
      prisma.expense.findMany({
        where: { user_id: userId },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, amount: true, title: true, category: true, date: true },
      }),
    ]);

    const transactions = [
      ...incomes.map(t => ({ id: t.id, amount: t.amount, type: 'income', description: t.title, date: t.date })),
      ...expenses.map(t => ({ id: t.id, amount: t.amount, type: 'expense', description: t.title, date: t.date })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
