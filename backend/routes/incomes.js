const router = require('express').Router();
const prisma = require('../db');
const { getPrimaryFamily, canModify } = require('../utils/family');

router.get("/", async (req, res) => {
  const userId = req.user.userId;
  try {
    const membership = await getPrimaryFamily(userId);
    const incomes = await prisma.income.findMany({
      where: membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null },
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(incomes.map(i => ({ ...i, canEdit: canModify(membership, i.user_id, userId) })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/total", async (req, res) => {
  const userId = req.user.userId;
  try {
    const membership = await getPrimaryFamily(userId);
    const result = await prisma.income.aggregate({
      where: membership ? { familyId: membership.familyId } : { user_id: userId, familyId: null },
      _sum: { amount: true },
    });
    res.json({ totalIncome: result._sum.amount ?? 0 });
  } catch (error) {
    console.error("Error fetching total income:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { title, amount, category, source, date, is_recurring, recurrence_type } = req.body;

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
    const income = await prisma.income.create({
      data: {
        user_id: userId,
        familyId: membership?.familyId ?? null,
        title,
        amount: parsedAmount,
        category,
        source: source ?? null,
        date: parsedDate,
        is_recurring: is_recurring ?? false,
        recurrence_type: recurrence_type || null,
      },
    });
    res.status(201).json({ message: "Income added successfully", income });
  } catch (error) {
    console.error("Error adding income:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:incomeId", async (req, res) => {
  const userId = req.user.userId;
  const incomeId = parseInt(req.params.incomeId);
  const { title, amount, category, source, date, is_recurring, recurrence_type } = req.body;

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
    const existing = await prisma.income.findFirst({
      where: membership ? { id: incomeId, familyId: membership.familyId } : { id: incomeId, user_id: userId, familyId: null },
    });
    if (!existing) return res.status(404).json({ message: "Income not found" });
    if (!canModify(membership, existing.user_id, userId)) {
      return res.status(403).json({ error: "Only the member who added this income, or a family admin, can edit it" });
    }

    const income = await prisma.income.update({
      where: { id: incomeId },
      data: {
        title,
        amount: parsedAmount,
        category,
        source: source ?? null,
        date: parsedDate,
        is_recurring: is_recurring ?? false,
        recurrence_type: recurrence_type || null,
      },
    });
    res.json({ message: "Income updated successfully", income });
  } catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:incomeId", async (req, res) => {
  const userId = req.user.userId;
  const incomeId = parseInt(req.params.incomeId);
  try {
    const membership = await getPrimaryFamily(userId);
    const existing = await prisma.income.findFirst({
      where: membership ? { id: incomeId, familyId: membership.familyId } : { id: incomeId, user_id: userId, familyId: null },
    });
    if (!existing) return res.status(404).json({ message: "Income not found" });
    if (!canModify(membership, existing.user_id, userId)) {
      return res.status(403).json({ error: "Only the member who added this income, or a family admin, can delete it" });
    }

    await prisma.income.delete({ where: { id: incomeId } });
    res.json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
