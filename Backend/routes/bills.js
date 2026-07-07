const router = require('express').Router();
const prisma = require('../db');

async function assertFamilyMember(userId, familyId) {
  const m = await prisma.familyMember.findFirst({ where: { userId, familyId } });
  return !!m;
}

// GET /bills?familyId=
router.get("/", async (req, res) => {
  const userId = req.user.userId;
  const { familyId } = req.query;
  if (!familyId) return res.status(400).json({ error: "familyId is required" });

  const fid = parseInt(familyId);
  const isMember = await assertFamilyMember(userId, fid);
  if (!isMember) return res.status(403).json({ error: "Access denied" });

  try {
    const bills = await prisma.bill.findMany({
      where: { familyId: fid },
      orderBy: { dueDate: 'asc' },
    });
    res.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /bills
router.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { familyId, title, amount, dueDate } = req.body;

  if (!familyId || !title || !amount || !dueDate) {
    return res.status(400).json({ error: "familyId, title, amount, and dueDate are required" });
  }

  const fid = parseInt(familyId);
  const isMember = await assertFamilyMember(userId, fid);
  if (!isMember) return res.status(403).json({ error: "Access denied" });

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const parsedDate = new Date(dueDate);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: "Invalid dueDate format" });
  }

  try {
    const bill = await prisma.bill.create({
      data: { familyId: fid, title: title.trim(), amount: parsedAmount, dueDate: parsedDate },
    });
    res.status(201).json({ message: "Bill created", bill });
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /bills/:id/status — mark PAID or OVERDUE
router.put("/:id/status", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!['PENDING', 'PAID', 'OVERDUE'].includes(status)) {
    return res.status(400).json({ error: "status must be PENDING, PAID, or OVERDUE" });
  }

  try {
    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    const isMember = await assertFamilyMember(userId, bill.familyId);
    if (!isMember) return res.status(403).json({ error: "Access denied" });

    const updated = await prisma.bill.update({ where: { id }, data: { status } });
    res.json({ message: "Bill status updated", bill: updated });
  } catch (error) {
    console.error("Error updating bill status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /bills/:id
router.delete("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);

  try {
    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    const isMember = await assertFamilyMember(userId, bill.familyId);
    if (!isMember) return res.status(403).json({ error: "Access denied" });

    await prisma.bill.delete({ where: { id } });
    res.json({ message: "Bill deleted" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
