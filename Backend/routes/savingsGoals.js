const router = require('express').Router();
const prisma = require('../db');
const { notifyUsers } = require('../utils/notify');

async function assertFamilyMember(userId, familyId) {
  const m = await prisma.familyMember.findFirst({ where: { userId, familyId } });
  return !!m;
}

async function assertFamilyAdmin(userId, familyId) {
  const m = await prisma.familyMember.findFirst({ where: { userId, familyId, role: 'ADMIN' } });
  return !!m;
}

// GET /savings-goals?familyId=
router.get("/", async (req, res) => {
  const userId = req.user.userId;
  const { familyId } = req.query;
  if (!familyId) return res.status(400).json({ error: "familyId is required" });

  const fid = parseInt(familyId);
  const isMember = await assertFamilyMember(userId, fid);
  if (!isMember) return res.status(403).json({ error: "Access denied" });

  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { familyId: fid },
      orderBy: { createdAt: 'desc' },
    });
    res.json(goals);
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /savings-goals
router.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { familyId, title, targetAmount, currentAmount, deadline } = req.body;

  if (!familyId || !title || !targetAmount) {
    return res.status(400).json({ error: "familyId, title, and targetAmount are required" });
  }

  const fid = parseInt(familyId);
  const isMember = await assertFamilyMember(userId, fid);
  if (!isMember) return res.status(403).json({ error: "Access denied" });

  const parsedTarget = parseFloat(targetAmount);
  if (isNaN(parsedTarget) || parsedTarget <= 0) {
    return res.status(400).json({ error: "targetAmount must be a positive number" });
  }

  try {
    const goal = await prisma.savingsGoal.create({
      data: {
        familyId: fid,
        title: title.trim(),
        targetAmount: parsedTarget,
        currentAmount: parseFloat(currentAmount ?? 0),
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    res.status(201).json({ message: "Savings goal created", goal });
  } catch (error) {
    console.error("Error creating savings goal:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /savings-goals/:id/contribute — add funds to a goal
router.put("/:id/contribute", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  const { amount } = req.body;

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const goal = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const isMember = await assertFamilyMember(userId, goal.familyId);
    if (!isMember) return res.status(403).json({ error: "Access denied" });

    const newAmount = Number(goal.currentAmount) + parsedAmount;
    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: newAmount },
    });

    // Notify family if goal reached
    if (newAmount >= Number(goal.targetAmount)) {
      const members = await prisma.familyMember.findMany({ where: { familyId: goal.familyId } });
      await notifyUsers(
        members.map(m => m.userId),
        `🎉 Goal achieved: "${goal.title}" has reached its target of ${Number(goal.targetAmount).toFixed(2)} TND!`
      );
    }

    res.json({ message: "Contribution added", goal: updated });
  } catch (error) {
    console.error("Error contributing to goal:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /savings-goals/:id — update goal details
router.put("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  const { title, targetAmount, deadline } = req.body;

  try {
    const goal = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const isMember = await assertFamilyMember(userId, goal.familyId);
    if (!isMember) return res.status(403).json({ error: "Access denied" });

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        title: title?.trim() ?? goal.title,
        targetAmount: targetAmount ? parseFloat(targetAmount) : goal.targetAmount,
        deadline: deadline ? new Date(deadline) : goal.deadline,
      },
    });
    res.json({ message: "Goal updated", goal: updated });
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /savings-goals/:id — admin only
router.delete("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);

  try {
    const goal = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const isAdmin = await assertFamilyAdmin(userId, goal.familyId);
    if (!isAdmin) return res.status(403).json({ error: "Only admins can delete goals" });

    await prisma.savingsGoal.delete({ where: { id } });
    res.json({ message: "Goal deleted" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
