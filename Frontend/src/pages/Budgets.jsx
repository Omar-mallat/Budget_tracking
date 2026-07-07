import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../Components/SideBar";

const EXPENSE_CATEGORIES = ["Food", "Transport", "Education", "Healthcare", "Rent", "Bills", "Entertainment", "Clothing", "Groceries", "Subscriptions", "Travelling", "Family Events", "Charity", "Other"];

const statusColor = (percentage) => {
  if (percentage >= 100) return { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50 border-red-200" };
  if (percentage >= 80) return { bar: "bg-yellow-400", text: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" };
  return { bar: "bg-green-500", text: "text-green-600", bg: "bg-green-50 border-green-200" };
};

const Budgets = () => {
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetStatus();
  }, []);

  const fetchBudgetStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/budgets/status");
      setBudgetStatus(res.data);
    } catch (error) {
      console.error("Error fetching budget status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimit = async (e) => {
    e.preventDefault();
    if (!category || !monthlyLimit) return;
    try {
      await api.post("/budgets", { category, monthly_limit: parseFloat(monthlyLimit) });
      setCategory("");
      setMonthlyLimit("");
      fetchBudgetStatus();
    } catch (error) {
      console.error("Error saving budget limit:", error);
    }
  };

  const handleDeleteLimit = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgetStatus();
    } catch (error) {
      console.error("Error deleting budget limit:", error);
    }
  };

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const usedCategories = budgetStatus.map(b => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter(c => !usedCategories.includes(c));

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 ml-64 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Budget Limits</h1>
            <p className="text-gray-500 text-sm mt-1">Spending caps for {currentMonth}</p>
          </div>
        </div>

        {/* Set Budget Limit Form */}
        <form onSubmit={handleSaveLimit} className="bg-white p-4 rounded shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-3">Set a Budget Limit</h2>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block mb-1 text-gray-700 text-sm">Category</label>
              <select className="border p-2 rounded w-48" value={category}
                onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Select category</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                {usedCategories.length > 0 && (
                  <optgroup label="Update existing">
                    {usedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-700 text-sm">Monthly Limit (TND)</label>
              <input type="number" min="1" step="0.01" className="border p-2 rounded w-40"
                placeholder="e.g., 500" value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)} required />
            </div>
            <button type="submit"
              className="bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600">
              Save Limit
            </button>
          </div>
        </form>

        {/* Budget Status Cards */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : budgetStatus.length === 0 ? (
          <div className="bg-white p-8 rounded shadow-md text-center text-gray-500">
            <p className="text-lg font-medium mb-1">No budget limits set yet</p>
            <p className="text-sm">Use the form above to set monthly spending caps per category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {budgetStatus.map((item) => {
              const colors = statusColor(item.percentage);
              const clampedPct = Math.min(item.percentage, 100);
              return (
                <div key={item.id} className={`bg-white border rounded-lg p-4 shadow-sm ${colors.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-gray-800">{item.category}</span>
                      {item.percentage >= 100 && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Over budget</span>
                      )}
                      {item.percentage >= 80 && item.percentage < 100 && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Near limit</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${colors.text}`}>
                        TND {item.spent.toFixed(2)} / TND {item.monthly_limit.toFixed(2)}
                      </span>
                      <span className={`text-sm font-bold ${colors.text}`}>{item.percentage}%</span>
                      <button className="text-gray-400 hover:text-red-500 text-sm"
                        onClick={() => handleDeleteLimit(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${colors.bar}`}
                      style={{ width: `${clampedPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>TND 0</span>
                    <span>Remaining: TND {Math.max(0, item.monthly_limit - item.spent).toFixed(2)}</span>
                    <span>TND {item.monthly_limit.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Budgets;
