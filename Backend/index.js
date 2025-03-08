const express =require("express");
const router = require("./Auth/auth");
const cors = require('cors');
const dashboardRouter = require('./routes/dashboard');
const expensesRouter = require('./routes/expenses');
const incomesRouter = require('./routes/incomes');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
//Routes
app.use("/auth",router);
app.use('/dashboard',dashboardRouter);
app.use('/expenses',expensesRouter);
app.use('/incomes',incomesRouter);
// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
