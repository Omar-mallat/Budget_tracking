import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../Components/SideBar";

const Expenses = () => {
  const userId = 1;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenses,setExpenses]=useState([]);
  useEffect(() => {
    fetchTotalExpenses();
    fetchExpenses();
  }, []);
  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/expenses/expenses/${userId}`);
      setExpenses(res.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };


  const fetchTotalExpenses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/expenses/total/${userId}`);
      setTotalExpenses(res.data?.totalexpenses || 0);
    } catch (error) {
      console.error("Error fetching total expenses:", error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount || !date || !category) {
      alert("All fields are required");
      return;
    }
    try {
      await axios.post("http://localhost:5000/expenses/expenses", {
        user_id: userId,
        title,
        amount: parseFloat(amount),
        category,
        date,
        reference,
      });
      setTitle(""); setAmount(""); setDate(""); setCategory(""); setReference("");
      fetchTotalExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await axios.delete(`http://localhost:5000/expenses/${expenseId}`);
      // Refresh expenses list and total after deletion
      fetchExpenses();
      fetchTotalExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar (Fixed Like Dashboard) */}
      <Sidebar />

      {/* Main Content - Same as Dashboard */}
      <div className="w-4/5 p-6 bg-gray-50 ml-64 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Expenses</h1>
          <h2 className="text-xl font-semibold text-red-500">
            Total Expenses: TND {totalExpenses}
          </h2>
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="bg-white p-4 rounded shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-2">Add a New Expense</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-gray-700">Expense Title</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="e.g., Dentist Appointment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Expense Amount</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                placeholder="e.g., 300"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Category</label>
              <select
                className="w-full border p-2 rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Option</option>
                <option value="Education">Education</option>
                <option value="Groceries">Groceries</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Travelling">Travelling</option>
                <option value="Clothing">Clothing</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-700">Add a Reference</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="Optional notes..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-red-400 text-white py-2 px-4 rounded hover:bg-red-500"
          >
            + Add Expense
          </button>
        </form>
        {/* Expenses List */}
        <div className="bg-white p-4 rounded shadow-md">
  <h2 className="text-lg font-semibold mb-2">Recent Expenses</h2>

  {expenses && expenses.length === 0 ? (
    <p>No expenses yet.</p>
  ) : (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Title</th>
          <th className="border p-2 text-right">Amount</th>
          <th className="border p-2">Date</th>
          <th className="border p-2">Category</th>
          <th className="border p-2">Reference</th>
          <th className="border p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {expenses?.map((exp) => (
          <tr key={exp.id}>
            <td className="border p-2">{exp.title}</td>
            <td className="border p-2 text-right">{exp.amount}</td>
            <td className="border p-2 text-center">{exp.date?.substring(0, 10) || "N/A"}</td>
            <td className="border p-2 text-center">{exp.category || "Uncategorized"}</td>
            <td className="border p-2 text-center">{exp.reference || "--"}</td>
            <td className="border p-2 text-center">
              <button
                className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
                onClick={() => handleDeleteExpense(exp.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

      </div>
  
      </div>
    
  );
}

export default Expenses;
