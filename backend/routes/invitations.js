const router = require('express').Router();
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

// GET /invitations/:token — look up a pending invitation (public, for the accept-invite page)
router.get('/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { family: { select: { name: true } } },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(404).json({ error: "Invitation not found or already used" });
    }
    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({ error: "This invitation has expired" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });

    res.json({
      email: invitation.email,
      role: invitation.role,
      familyName: invitation.family.name,
      accountExists: !!existingUser,
    });
  } catch (error) {
    console.error("Error looking up invitation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /invitations/:token/accept — join the family; registers a new account, or
// verifies the password for an existing one (public)
router.post('/:token/accept', async (req, res) => {
  const { token } = req.params;
  const { name, password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const invitation = await prisma.invitation.findUnique({ where: { token } });

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(404).json({ error: "Invitation not found or already used" });
    }
    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({ error: "This invitation has expired" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });

    let user;

    if (existingUser) {
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password for this account" });
      }

      const alreadyMember = await prisma.familyMember.findFirst({
        where: { familyId: invitation.familyId, userId: existingUser.id },
      });

      await prisma.$transaction(async (tx) => {
        if (!alreadyMember) {
          await tx.familyMember.create({
            data: { familyId: invitation.familyId, userId: existingUser.id, role: invitation.role },
          });
        }
        await tx.invitation.update({ where: { id: invitation.id }, data: { status: 'ACCEPTED' } });
      });

      user = { id: existingUser.id, name: existingUser.name, email: existingUser.email };
    } else {
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { name, email: invitation.email, password: hashedPassword },
          select: { id: true, name: true, email: true },
        });

        await tx.familyMember.create({
          data: { familyId: invitation.familyId, userId: newUser.id, role: invitation.role },
        });

        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' },
        });

        return newUser;
      });
    }

    const jwt = JWT.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: "Joined family!", token: jwt, user });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
