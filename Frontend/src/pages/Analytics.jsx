import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../Components/SideBar";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#6366f1", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];

const Analytics = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6"); // months to show

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(period));
      const from = monthsAgo.toISOString().substring(0, 10);

      const [txRes, summaryRes] = await Promise.all([
        api.get(`/expenses?from=${from}`).catch(() => ({ data: [] })),
        api.get("/dashboard/summary"),
      ]);

      setSummary(summaryRes.data);

      // Build monthly breakdown from legacy expenses + incomes
      const [incRes, expRes] = await Promise.all([
        api.get("/incomes"),
        api.get("/expenses"),
      ]);

      const monthMap = {};
      incRes.data.forEach(inc => {
        const m = inc.date?.substring(0, 7);
        if (!m) return;
        if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expenses: 0 };
        monthMap[m].income += Number(inc.amount);
      });
      expRes.data.forEach(exp => {
        const m = exp.date?.substring(0, 7);
        if (!m) return;
        if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expenses: 0 };
        monthMap[m].expenses += Number(exp.amount);
      });

      const sorted = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
      const recent = sorted.slice(-parseInt(period));
      setMonthlyData(recent.map(d => ({
        ...d,
        savings: Math.max(0, d.income - d.expenses),
        month: new Date(d.month + "-01").toLocaleString("default", { month: "short", year: "2-digit" }),
      })));

      // Category breakdown from expenses
      const catMap = {};
      expRes.data.forEach(exp => {
        const cat = exp.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + Number(exp.amount);
      });
      setCategoryData(
        Object.entries(catMap)
          .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
          .sort((a, b) => b.value - a.value)
      );
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = categoryData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 ml-64 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Financial insights and trends</p>
          </div>
          <select
            className="border p-2 rounded text-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </select>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-green-600">TND {Number(summary.totalIncome).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">TND {Number(summary.totalExpenses).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
              TND {Number(summary.totalBalance ?? summary.balance ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading charts...</p>
        ) : (
          <div className="space-y-8">
            {/* Monthly Income vs Expenses Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Monthly Income vs Expenses</h2>
              {monthlyData.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `TND ${Number(v).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Savings Trend Line Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Monthly Savings Trend</h2>
              {monthlyData.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `TND ${Number(v).toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="savings" name="Savings" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Expense Distribution</h2>
                {categoryData.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No expense data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `TND ${Number(v).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Category Table */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Top Expense Categories</h2>
                {categoryData.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No expense data</p>
                ) : (
                  <div className="space-y-3">
                    {categoryData.slice(0, 8).map((cat, i) => {
                      const pct = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0;
                      return (
                        <div key={cat.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                              {cat.name}
                            </span>
                            <span className="font-medium text-gray-800">
                              TND {cat.value.toFixed(2)}
                              <span className="text-gray-400 ml-1 text-xs">({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
