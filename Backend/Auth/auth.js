const router = require('express').Router();
const bcrypt = require('bcrypt');
const JWT = require("jsonwebtoken");
const prisma = require('../db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });

    const token = JWT.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log("New user registered:", newUser.email);

    res.status(201).json({ message: "Registered successfully!", token, user: newUser });
  } catch (err) {
    console.error("Error in /register:", err.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = JWT.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Error in /login:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

// PUT /auth/push-token — save or clear Expo push token for the current user
const authenticateToken = require('../middleware/auth');

router.put('/push-token', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { token } = req.body;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { pushToken: token ?? null },
    });
    res.json({ message: 'Push token saved' });
  } catch (err) {
    console.error('Error saving push token:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
