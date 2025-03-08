const router = require('express').Router();
const pool =require('../db');

//Retrieve all incomes  from database For a  specific user
router.get("/incomes/:userId",async(req,res)=>{
    const {userId} = req.params;
    try{
        const Incomes = await pool.query("SELECT * FROM income WHERE user_id=$1",[userId]);
        res.json(Incomes.rows);
        console.log(Incomes.rows)
    }catch(error){
        console.error(error);
        res.status(500).json({error:"server error"});
    }
});
//Retrieve The total incomes
router.get("/totalInc/:userId", async (req, res) => {
  const {userId} = req.params;

  try {
      const totalIncomes = await pool.query(
          "SELECT COALESCE(SUM(amount), 0) AS totalIncome FROM income WHERE user_id =$1",
          [userId]
      );

      res.json(totalIncomes.rows[0]);
  } catch (error) {
      console.error("Error fetching total expenses:", error);
      res.status(500).json({ message: "Server error" });
  }
});
//Create a new income
router.post("/incomes", async (req, res) => {
    try {
      const { user_id,amount,source,date,title,category} = req.body;
  
      if (!user_id || !title || !amount || !category || !date) {
        return res.status(400).json({ error: "All required fields must be provided" });
      }
  
      // Ensure amount is a float
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        return res.status(400).json({ error: "Invalid amount format" });
      }
      const parsedDate = new Date(date);
if (isNaN(parsedDate.getTime())) {
  return res.status(400).json({ error: "Invalid date format. Please provide a valid date." });
}
  
      // Ensure date is in YYYY-MM-DD format
      const formattedDate = parsedDate.toISOString().split("T")[0];
  
      const query = `
        INSERT INTO income (user_id,amount,source,date,title,category) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      
      const values = [user_id,parsedAmount,source,formattedDate,title,category];
  
      const result = await pool.query(query, values);
  
      res.status(201).json({ message: "income added successfully", income: result.rows[0] });
    } catch (error) {
      console.error("Error adding income:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  //Delete an income
  router.delete("/:incomeId",async(req,res)=>{
    const{incomeId} = req.params;
    try {
      const IncomeDeletion = await pool.query(
        "DELETE FROM income where id = $1 RETURNING *",
        [incomeId]
      );
      if(IncomeDeletion.rows.length===0){
        return res.status(404).json({message:"income not found"});
      }
      res.json({message:" Income deleted successfully",income:IncomeDeletion.rows[0]})
    } catch (error) {
      console.error("Error deleting expense:",error);
      res.status(500).json({error:"server error"})
    }
  })
  
module.exports = router;
