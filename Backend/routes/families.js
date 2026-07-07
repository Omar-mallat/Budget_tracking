const router = require('express').Router();
const prisma = require('../db');
const { notifyUsers } = require('../utils/notify');

// POST /families — create a new family; creator becomes ADMIN member
router.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Family name is required" });
  }

  try {
    const family = await prisma.family.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    res.status(201).json({ message: "Family created", family });
  } catch (error) {
    console.error("Error creating family:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /families — all families the current user belongs to
router.get("/", async (req, res) => {
  const userId = req.user.userId;
  try {
    const memberships = await prisma.familyMember.findMany({
      where: { userId },
      include: {
        family: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
    });
    const families = memberships.map(m => ({ ...m.family, myRole: m.role }));
    res.json(families);
  } catch (error) {
    console.error("Error fetching families:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /families/:familyId — single family detail (members only)
router.get("/:familyId", async (req, res) => {
  const userId = req.user.userId;
  const familyId = parseInt(req.params.familyId);

  try {
    const membership = await prisma.familyMember.findFirst({ where: { familyId, userId } });
    if (!membership) return res.status(403).json({ error: "Access denied" });

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    res.json({ ...family, myRole: membership.role });
  } catch (error) {
    console.error("Error fetching family:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /families/:familyId/invite — ADMIN invites a user by email
router.post("/:familyId/invite", async (req, res) => {
  const userId = req.user.userId;
  const familyId = parseInt(req.params.familyId);
  const { email, role = 'MEMBER' } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!['ADMIN', 'MEMBER', 'CHILD'].includes(role)) {
    return res.status(400).json({ error: "Role must be ADMIN, MEMBER, or CHILD" });
  }

  try {
    const adminCheck = await prisma.familyMember.findFirst({
      where: { familyId, userId, role: 'ADMIN' },
    });
    if (!adminCheck) return res.status(403).json({ error: "Only admins can invite members" });

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) return res.status(404).json({ error: "No user found with that email" });

    const existing = await prisma.familyMember.findFirst({
      where: { familyId, userId: invitee.id },
    });
    if (existing) return res.status(409).json({ error: "User is already a member" });

    const member = await prisma.familyMember.create({
      data: { familyId, userId: invitee.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await notifyUsers([invitee.id], `👨‍👩‍👧 You have been added to a family workspace.`);

    res.status(201).json({ message: "Member added", member });
  } catch (error) {
    console.error("Error inviting member:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /families/:familyId/members/:memberId/role — ADMIN changes a member's role
router.put("/:familyId/members/:memberId/role", async (req, res) => {
  const userId = req.user.userId;
  const familyId = parseInt(req.params.familyId);
  const memberId = parseInt(req.params.memberId);
  const { role } = req.body;

  if (!['ADMIN', 'MEMBER', 'CHILD'].includes(role)) {
    return res.status(400).json({ error: "Role must be ADMIN, MEMBER, or CHILD" });
  }

  try {
    const adminCheck = await prisma.familyMember.findFirst({
      where: { familyId, userId, role: 'ADMIN' },
    });
    if (!adminCheck) return res.status(403).json({ error: "Only admins can change roles" });

    const updated = await prisma.familyMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ message: "Role updated", member: updated });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /families/:familyId/members/:memberId — ADMIN removes a member
router.delete("/:familyId/members/:memberId", async (req, res) => {
  const userId = req.user.userId;
  const familyId = parseInt(req.params.familyId);
  const memberId = parseInt(req.params.memberId);

  try {
    const adminCheck = await prisma.familyMember.findFirst({
      where: { familyId, userId, role: 'ADMIN' },
    });
    if (!adminCheck) return res.status(403).json({ error: "Only admins can remove members" });

    await prisma.familyMember.delete({ where: { id: memberId } });
    res.json({ message: "Member removed" });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
