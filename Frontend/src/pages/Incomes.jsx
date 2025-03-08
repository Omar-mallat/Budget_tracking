import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../Components/SideBar";

const Income = () => {
  const userId = 1;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [totalIncome, setTotalIncome] = useState(0);
  const [Income,setIncome]=useState([])
  useEffect(() => {
    fetchTotalIncome();
    fetchIncomes();
  }, []);

  const fetchTotalIncome = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/incomes/totalInc/${userId}`);
      setTotalIncome(res.data?.totalincome || 0);
    } catch (error) {
      console.error("Error fetching total income:", error);
    }
  };
  const fetchIncomes = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/incomes/incomes/${userId}`);
      setIncome(res.data);
    } catch (error) {
      console.error("Error fetching incomes:", error);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!title || !amount || !date || !category) {
      alert("All fields are required");
      return;
    }
    try {
      await axios.post("http://localhost:5000/incomes/incomes", {
        user_id: userId,
        amount,
        source: parseFloat(amount),
        date,
        title,
        category,
      });
      setTitle(""); setAmount(""); setDate(""); setCategory(""); setSource("");
      fetchTotalIncome();
      fetchIncomes();
    } catch (error) {
      console.error("Error adding income:", error);
    }
  };
  
  const handleDeleteExpense = async (incomeId) => {
    try {
      await axios.delete(`http://localhost:5000/incomes/${incomeId}`);
      // Refreshincomes list and total income after deletion
     fetchTotalIncome();
     fetchIncomes();
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar (Same as Dashboard & Expenses) */}
      <Sidebar />

      {/* Main Content */}
      <div className="w-4/5 p-6 bg-gray-50 ml-64 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Incomes</h1>
          <h2 className="text-xl font-semibold text-green-500">
            Total Income: TND {totalIncome}
          </h2>
        </div>

        {/* Add Income Form */}
        <form onSubmit={handleAddIncome} className="bg-white p-4 rounded shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-2">Add a New Income</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-gray-700">Income Title</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="e.g., Salary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Income Amount</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                placeholder="e.g., 1500"
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
                <option value="Salary">Salary</option>
                <option value="Freelancing">Freelancing</option>
                <option value="Investments">Investments</option>
                <option value="Business">Business</option>
                <option value="Gifts">Gifts</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-700">Add the source</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="Optional notes..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-green-400 text-white py-2 px-4 rounded hover:bg-green-500"
          >
            + Add Income
          </button>
        </form>
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-lg font-semibold mb-2">Recent Incomes</h2>
          {Income.length === 0 ? (
            <p className="text-gray-500">No income records found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Title</th>
                  <th className="border border-gray-300 px-4 py-2">Amount</th>
                  <th className="border border-gray-300 px-4 py-2">Date</th>
                  <th className="border border-gray-300 px-4 py-2">Category</th>
                  <th className="border border-gray-300 px-4 py-2">Reference</th>
                  <th className="border border-gray-300 px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {Income.map((income) => (
                  <tr key={income.id} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">{income.title}</td>
                    <td className="border border-gray-300 px-4 py-2 text-green-600">
                      TND {income.amount}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{income.date}</td>
                    <td className="border border-gray-300 px-4 py-2">{income.category}</td>
                    <td className="border border-gray-300 px-4 py-2">{income.source || "-"}</td>
                    <td className="border p-2 text-center">
              <button
                className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
                onClick={() => handleDeleteExpense(income.id)}
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

export default Income;
