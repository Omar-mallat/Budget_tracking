const router = require('express').Router();
const pool =require('../db');

//Retrieve all expenses  from database For a  specific user
router.get("/expenses/:userId",async(req,res)=>{
    const {userId} = req.params;
    try{
        const Expenses = await pool.query("SELECT * FROM expenses WHERE user_id=$1",[userId]);
        res.json(Expenses.rows);
        console.log(Expenses.rows)
    }catch(error){
        console.error(error);
        res.status(500).json({error:"server error"});
    }
});
//Retrieve The total expenses 
router.get("/total/:userId", async (req, res) => {
  const {userId} = req.params;

  try {
      const totalExpenses = await pool.query(
          "SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses WHERE user_id =$1",
          [userId]
      );

      res.json(totalExpenses.rows[0]);
  } catch (error) {
      console.error("Error fetching total expenses:", error);
      res.status(500).json({ message: "Server error" });
  }
});
//Create a new expense
router.post("/expenses", async (req, res) => {
    try {
      const { user_id, title, amount, category, date, reference } = req.body;
  
      if (!user_id || !title || !amount || !category || !date) {
        return res.status(400).json({ error: "All required fields must be provided" });
      }
  
      // Ensure amount is a float
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        return res.status(400).json({ error: "Invalid amount format" });
      }
  
      // Ensure date is in YYYY-MM-DD format
      const formattedDate = new Date(date).toISOString().split("T")[0];
  
      const query = `
        INSERT INTO expenses (user_id, title, amount, category, date, reference) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      
      const values = [user_id, title, parsedAmount, category, formattedDate, reference];
  
      const result = await pool.query(query, values);
  
      res.status(201).json({ message: "Expense added successfully", expense: result.rows[0] });
    } catch (error) {
      console.error("Error adding expense:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  //Delete an expense
  router.delete("/:expenseId",async(req,res)=>{
    const{expenseId} = req.params;
    try {
      const ExpenseDeletion = await pool.query(
        "DELETE FROM expenses where id = $1 RETURNING *",
        [expenseId]
      );
      if(ExpenseDeletion.rows.length===0){
        return res.status(404).json({message:"Expense not found"});
      }
      res.json({message:"Expense deleted successfully",expense:ExpenseDeletion.rows[0]})
    } catch (error) {
      console.error("Error deleting expense:",error);
      res.status(500).json({error:"server error"})
    }
  })
  
module.exports = router;