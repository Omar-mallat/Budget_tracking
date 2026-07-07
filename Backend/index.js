const express = require("express");
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRouter = require("./Auth/auth");
const authenticateToken = require('./middleware/auth');

// Existing routes (legacy — scoped to current user via JWT)
const dashboardRouter = require('./routes/dashboard');
const expensesRouter = require('./routes/expenses');
const incomesRouter = require('./routes/incomes');
const budgetsRouter = require('./routes/budgets');

// New family workspace routes
const familiesRouter = require('./routes/families');
const transactionsRouter = require('./routes/transactions');
const savingsGoalsRouter = require('./routes/savingsGoals');
const billsRouter = require('./routes/bills');
const notificationsRouter = require('./routes/notifications');
const receiptsRouter      = require('./routes/receipts');

const app = express();
const port = process.env.PORT || 5000;

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Public Routes ─────────────────────────────────────────────────────────────
app.use("/auth", authRouter);

// ─── Protected Routes (JWT required) ──────────────────────────────────────────
app.use('/dashboard',      authenticateToken, dashboardRouter);
app.use('/expenses',       authenticateToken, expensesRouter);
app.use('/incomes',        authenticateToken, incomesRouter);
app.use('/budgets',        authenticateToken, budgetsRouter);
app.use('/families',       authenticateToken, familiesRouter);
app.use('/transactions',   authenticateToken, transactionsRouter);
app.use('/savings-goals',  authenticateToken, savingsGoalsRouter);
app.use('/bills',          authenticateToken, billsRouter);
app.use('/notifications',  authenticateToken, notificationsRouter);
app.use('/receipts',       authenticateToken, receiptsRouter);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
