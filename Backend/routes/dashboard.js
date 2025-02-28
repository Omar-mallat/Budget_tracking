const router = require('express').Router();
const pool =require('../db');
// Get financial summary for a user
router.get("/summary/:userId",async(req,res)=>{
    const {userId} = req.params;
    try{
        const incomeResult = await pool.query("SELECT COALESCE(SUM(amount),0) AS total_income FROM income WHERE user_id=$1",[userId]);
        const expenseResult = await pool.query(
            "SELECT COALESCE (SUM(amount),0) AS total_expenses FROM expenses WHERE user_id=$1",[userId]
        );
        const totalIncome = incomeResult.rows[0].total_income;
        const totalExpenses = expenseResult.rows[0].total_expenses
        const totalBalance = totalIncome-totalExpenses;
        res.json({totalIncome,totalExpenses,totalBalance});
    }catch(error){
        console.error(error);
        res.status(500).json({error:"server error"});
    }
})
// Get recent transactions for a user
router.get("/transaction/:userId",async(req,res)=>{
    const {userId} = req.params;
    try{
        const incomeTransaction = await pool.query(
            "SELECT id,amount,'income' AS type,source AS description,date FROM income WHERE user_id=$1 ORDER BY date DESC LIMIT 5",
            [userId]
        );
        const expenseTransaction = await pool.query("SELECT id,amount,'expense' AS type,category AS description,date FROM expenses WHERE user_id=$1 ORDER BY date DESC LIMIT 5",
            [userId]);
         const transactions = [...expenseTransaction.rows,...incomeTransaction.rows].sort((a,b)=>new Date(b.date)- new Date(a.date)
        );
        res.json(transactions);   
    }catch(error){
        console.error("error fetching transactions",error);
        res.status(500).json({error:"server error"});
    }
})
module.exports = router