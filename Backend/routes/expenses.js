const router = require('express').Router();
const prisma = require('../db');

// All routes use req.user.userId from the JWT — never trust userId from URL params.

router.get("/", async (req, res) => {
  const userId = req.user.userId;
  try {
    const expenses = await prisma.expense.findMany({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/total", async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await prisma.expense.aggregate({
      where: { user_id: userId },
      _sum: { amount: true },
    });
    res.json({ totalExpenses: result._sum.amount ?? 0 });
  } catch (error) {
    console.error("Error fetching total expenses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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

  try {
    const expense = await prisma.expense.create({
      data: {
        user_id: userId,
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

  try {
    const existing = await prisma.expense.findFirst({ where: { id: expenseId, user_id: userId } });
    if (!existing) return res.status(404).json({ message: "Expense not found" });

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title,
        amount: parsedAmount,
        category,
        date: new Date(date),
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
    const existing = await prisma.expense.findFirst({ where: { id: expenseId, user_id: userId } });
    if (!existing) return res.status(404).json({ message: "Expense not found" });

    await prisma.expense.delete({ where: { id: expenseId } });
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
