const router = require('express').Router();
const bcrypt = require('bcrypt');
const JWT = require("jsonwebtoken");
const pool =require('../db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Register route
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if a user with the given email already exists
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userQuery.rows.length > 0) {
      return res.status(400).send("Email already exists!");
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert the new user into the database
    const insertQuery = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );
    const newUser = insertQuery.rows[0];
    
    // Generate a JWT token
    const token = JWT.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );
    
    console.log("New user added:", newUser);
    res.status(201).json({
      message: "Registered successfully!",
      token,
      user: newUser
    });
  } catch (err) {
    console.error("Error in /register:", err.message);
    res.status(500).send({ message: err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    } 
    const token = JWT.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET ||'default_secret_key',
      { expiresIn: '1h'}
    );


    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

module.exports = router;
