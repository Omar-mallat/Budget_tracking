import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";

const NAV_ITEMS = [
  { path: "/dashboard",      label: "Family Hub",       emoji: "🏠" },
  { path: "/incomes",        label: "Family Allowance", emoji: "💰" },
  { path: "/expenses",       label: "Spending List",    emoji: "🛒" },
  { path: "/savings",        label: "Our Goals",        emoji: "🎯" },
  { path: "/budgets",        label: "Budget Limits",    emoji: "💳" },
  { path: "/family",         label: "Family",           emoji: "👨‍👩‍👧‍👦" },
  { path: "/analytics",      label: "Analytics",        emoji: "📊" },
];

const MEMBER_COLORS = ["#A8D5FF", "#FFB366", "#B8E6B8", "#FFD966"];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get("/notifications/unread-count")
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const initials = (user.name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="fixed top-0 left-0 w-64 h-screen flex flex-col z-50"
      style={{ backgroundColor: "#F5EFE7", borderRight: "1px solid #E8DFD2" }}>

      {/* Logo */}
      <div className="p-8 flex items-center space-x-3 mb-2">
        <div className="w-12 h-12 rounded-[18px] flex items-center justify-center text-2xl shadow-sm"
          style={{ backgroundColor: "#FFB366" }}>
          🐷
        </div>
        <span className="text-2xl font-bold tracking-tight" style={{ color: "#4F46E5" }}>
          BudgetTrack
        </span>
      </div>

      {/* Family Team */}
      <div className="px-6 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 ml-2"
          style={{ color: "#A89F91" }}>
          Our Family Team
        </p>
        <div className="flex -space-x-2 items-center ml-2">
          <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-white text-sm shadow-sm"
            style={{ backgroundColor: "#A8D5FF", borderColor: "#F5EFE7" }}
            title={user.name || "You"}>
            {initials}
          </div>
          {MEMBER_COLORS.slice(1).map((color, i) => (
            <div key={i} className="w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-white text-xs shadow-sm"
              style={{ backgroundColor: color, borderColor: "#F5EFE7" }}>
              {["M", "K1", "K2"][i]}
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-4 flex items-center justify-center text-slate-500"
            style={{ backgroundColor: "#E8DFD2", borderColor: "#F5EFE7" }}>
            <span className="text-xs font-bold">+</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, emoji }) => {
          const active = location.pathname === path;
          return (
            <a key={path} href={path}
              className="flex items-center space-x-3 px-5 py-3.5 rounded-[24px] transition-all font-semibold text-sm"
              style={active
                ? { backgroundColor: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(79,70,229,0.1)" }
                : { color: "#6B7280" }
              }
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.5)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span>{label}</span>
            </a>
          );
        })}

        {/* Notifications with badge */}
        <a href="/notifications"
          className="flex items-center space-x-3 px-5 py-3.5 rounded-[24px] transition-all font-semibold text-sm"
          style={location.pathname === "/notifications"
            ? { backgroundColor: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(79,70,229,0.1)" }
            : { color: "#6B7280" }
          }
          onMouseEnter={(e) => { if (location.pathname !== "/notifications") e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.5)"; }}
          onMouseLeave={(e) => { if (location.pathname !== "/notifications") e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <span className="text-lg leading-none">🔔</span>
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </a>
      </nav>

      {/* Sign Out */}
      <div className="p-4">
        <button onClick={handleSignOut}
          className="flex items-center space-x-3 px-5 py-3.5 rounded-[24px] w-full text-sm font-semibold transition-all"
          style={{ color: "#A89F91" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#A89F91"; }}
        >
          <span className="text-lg">🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
