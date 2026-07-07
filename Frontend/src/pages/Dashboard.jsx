import Sidebar from "../Components/SideBar";
import api from "../api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORY_EMOJI = {
  Food: "🍔", Groceries: "🛒", Transport: "🚗", Education: "📚",
  Healthcare: "🏥", Rent: "🏠", Bills: "📄", Entertainment: "🎬",
  Clothing: "👗", Subscriptions: "📱", Travelling: "✈️",
  "Family Events": "🎉", Charity: "❤️", Salary: "💼",
  Freelancing: "💻", Investments: "📈", Business: "🏢",
  Gifts: "🎁", Other: "💡",
};

const CATEGORY_BG = {
  Food: "#FEF3C7", Groceries: "#F3F4F6", Transport: "#EFF6FF",
  Education: "#EDE9FE", Healthcare: "#FEF2F2", Rent: "#ECFDF5",
  Bills: "#FFF7ED", Entertainment: "#FAF5FF", Salary: "#EEF2FF",
  Freelancing: "#EEF2FF", Investments: "#ECFDF5", Other: "#F5F3FF",
};

const Dashboard = () => {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, totalBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    api.get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => {});

    api.get("/dashboard/transactions")
      .then((res) => setTransactions(res.data))
      .catch(() => {});

    api.get("/budgets/status")
      .then((res) => setBudgets(res.data || []))
      .catch(() => {});
  }, []);

  const fmt = (n) => `TND ${Number(n).toFixed(2)}`;

  const recent = transactions.slice(0, 5);

  const BUDGET_COLORS = ["#34D399", "#818CF8", "#FB923C", "#C084FC"];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FEFBF6" }}>
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-auto">
        {/* Header */}
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Hello, {user.name || "Family"}! 👋
            </h1>
            <p className="text-slate-500 mt-1 font-medium text-base">
              Ready to grow our savings together today?
            </p>
          </div>
          <button
            onClick={() => navigate("/expenses")}
            className="hidden md:flex items-center gap-2 text-white px-6 py-3 rounded-[24px] font-bold text-sm shadow-lg transition-all"
            style={{ backgroundColor: "#4F46E5" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}
          >
            <span className="text-base">+</span>
            Log a Purchase
          </button>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-7 rounded-[24px] border-b-4 flex items-center justify-between hover:scale-[1.02] transition-transform"
            style={{ borderBottomColor: "#B8E6B8", boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
            <div>
              <p className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-widest">Together We Earned</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{fmt(summary.totalIncome)}</h3>
              <div className="mt-2 flex items-center gap-1 text-emerald-500 text-[10px] font-bold bg-emerald-50 w-fit px-2 py-1 rounded-full uppercase">
                ❤️ Great Job!
              </div>
            </div>
            <div className="w-14 h-14 rounded-[18px] bg-emerald-50 flex items-center justify-center text-3xl">
              💸
            </div>
          </div>

          <div className="bg-white p-7 rounded-[24px] border-b-4 flex items-center justify-between hover:scale-[1.02] transition-transform"
            style={{ borderBottomColor: "#FFB366", boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
            <div>
              <p className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-widest">Together We Spent</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{fmt(summary.totalExpenses)}</h3>
              <div className="mt-2 flex items-center gap-1 text-amber-500 text-[10px] font-bold bg-amber-50 w-fit px-2 py-1 rounded-full uppercase">
                ℹ️ Keep an eye
              </div>
            </div>
            <div className="w-14 h-14 rounded-[18px] bg-amber-50 flex items-center justify-center text-3xl">
              🛍️
            </div>
          </div>

          <div className="bg-white p-7 rounded-[24px] border-b-4 flex items-center justify-between hover:scale-[1.02] transition-transform"
            style={{ borderBottomColor: "#A8D5FF", boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
            <div>
              <p className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-widest">For Our Dreams</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{fmt(summary.totalBalance)}</h3>
              <div className="mt-2 flex items-center gap-1 text-indigo-500 text-[10px] font-bold bg-indigo-50 w-fit px-2 py-1 rounded-full uppercase">
                ⭐ Savings Rock!
              </div>
            </div>
            <div className="w-14 h-14 rounded-[18px] bg-indigo-50 flex items-center justify-center text-3xl">
              🌟
            </div>
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Income vs Expense breakdown */}
          <div className="lg:col-span-2 bg-white p-7 rounded-[24px]"
            style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                👨‍👩‍👧‍👦 Financial Overview
              </h2>
              <span className="text-xs font-bold px-4 py-2 rounded-full"
                style={{ color: "#4F46E5", backgroundColor: "#EEF2FF" }}>
                All Time
              </span>
            </div>

            <div className="space-y-7">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: "#A8D5FF" }}>
                      {(user.name || "U")[0].toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Total Income</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{fmt(summary.totalIncome)}</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#F8FAFC" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: "80%", backgroundColor: "#A8D5FF" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: "#FFB366" }}>
                      💳
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Total Expenses</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{fmt(summary.totalExpenses)}</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#F8FAFC" }}>
                  {summary.totalIncome > 0 && (
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (summary.totalExpenses / summary.totalIncome) * 100).toFixed(0)}%`,
                        backgroundColor: "#FFB366"
                      }} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: "#B8E6B8" }}>
                      🌟
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Net Savings</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{fmt(summary.totalBalance)}</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#F8FAFC" }}>
                  {summary.totalIncome > 0 && (
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, (summary.totalBalance / summary.totalIncome) * 100)).toFixed(0)}%`,
                        backgroundColor: "#B8E6B8"
                      }} />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-[20px] border-2 border-dashed text-center"
              style={{ backgroundColor: "#EEF2FF", borderColor: "#C7D2FE" }}>
              <p className="font-bold mb-1" style={{ color: "#4F46E5" }}>Team Tip! 💡</p>
              <p className="text-sm font-medium italic" style={{ color: "#818CF8" }}>
                {summary.totalBalance > 0
                  ? `Great savings! You've set aside ${fmt(summary.totalBalance)} so far.`
                  : "Start tracking your income and expenses to see your savings grow!"}
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-7 rounded-[24px]"
            style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Family Logs</h2>
              <a href="/expenses" className="text-sm font-bold underline" style={{ color: "#4F46E5" }}>
                See All
              </a>
            </div>

            {recent.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-slate-400 text-sm font-medium">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((tx, i) => {
                  const isIncome = tx.type === "income";
                  const cat = tx.category || "Other";
                  const emoji = CATEGORY_EMOJI[cat] || "💡";
                  const bg = CATEGORY_BG[cat] || "#F9FAFB";
                  return (
                    <div key={tx.id || i}
                      className="flex items-center justify-between p-3 rounded-[18px] border-2 border-transparent transition-all"
                      style={{ backgroundColor: "#F8FAFC" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.borderColor = "#E0E7FF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F8FAFC"; e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl shadow-sm"
                          style={{ backgroundColor: bg }}>
                          {emoji}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{tx.title}</p>
                          <p className="text-[11px] font-bold" style={{ color: "#A89F91" }}>
                            {tx.date?.substring(0, 10)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${isIncome ? "text-emerald-500" : "text-rose-400"}`}>
                        {isIncome ? "+" : "-"}{fmt(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Budget Targets */}
        {budgets.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Our Shared Budget Targets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {budgets.slice(0, 4).map((b, i) => {
                const pct = b.monthly_limit > 0
                  ? Math.min(100, (b.spent / b.monthly_limit) * 100)
                  : 0;
                const color = BUDGET_COLORS[i % BUDGET_COLORS.length];
                const overWarn = pct >= 90 ? "🛑 Slow down!" : pct >= 70 ? "⚠️ Getting close!" : "✅ On track!";
                const warnColor = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";
                return (
                  <div key={b.id || i} className="bg-white p-5 rounded-[24px] border-t-8"
                    style={{ borderTopColor: color, boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-slate-800 text-sm">{b.category}</span>
                      <span className="text-xl">{CATEGORY_EMOJI[b.category] || "📦"}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full mb-2" style={{ backgroundColor: "#F8FAFC" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct.toFixed(0)}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: "#A89F91" }}>
                      TND {Number(b.spent || 0).toFixed(2)} of TND {Number(b.monthly_limit).toFixed(2)} used
                    </p>
                    <p className="mt-2 text-[10px] font-bold" style={{ color: warnColor }}>
                      {overWarn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
