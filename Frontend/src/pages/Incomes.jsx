import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../Components/SideBar";

const CATEGORIES = ["Salary", "Freelancing", "Investments", "Business", "Gifts", "Other"];

const Income = () => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("");

  const [totalIncome, setTotalIncome] = useState(0);
  const [incomes, setIncomes] = useState([]);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [editingIncome, setEditingIncome] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchIncomes();
    fetchTotal();
  }, []);

  const fetchIncomes = async () => {
    try {
      const res = await api.get("/incomes");
      setIncomes(res.data);
    } catch (error) {
      console.error("Error fetching incomes:", error);
    }
  };

  const fetchTotal = async () => {
    try {
      const res = await api.get("/incomes/total");
      setTotalIncome(res.data?.totalIncome || 0);
    } catch (error) {
      console.error("Error fetching total income:", error);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    try {
      await api.post("/incomes", {
        title, amount, source, date, category,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
      });
      setTitle(""); setAmount(""); setDate(""); setCategory("");
      setSource(""); setIsRecurring(false); setRecurrenceType("");
      fetchIncomes();
      fetchTotal();
    } catch (error) {
      console.error("Error adding income:", error);
    }
  };

  const handleDeleteIncome = async (id) => {
    try {
      await api.delete(`/incomes/${id}`);
      fetchIncomes();
      fetchTotal();
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  const openEdit = (inc) => {
    setEditingIncome(inc);
    setEditForm({
      title: inc.title,
      amount: inc.amount,
      date: inc.date?.substring(0, 10),
      category: inc.category || "",
      source: inc.source || "",
      is_recurring: inc.is_recurring || false,
      recurrence_type: inc.recurrence_type || "",
    });
  };

  const handleEditIncome = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/incomes/${editingIncome.id}`, editForm);
      setEditingIncome(null);
      fetchIncomes();
      fetchTotal();
    } catch (error) {
      console.error("Error updating income:", error);
    }
  };

  const filteredIncomes = incomes.filter(inc => {
    if (filterCategory && inc.category !== filterCategory) return false;
    if (filterFrom && inc.date?.substring(0, 10) < filterFrom) return false;
    if (filterTo && inc.date?.substring(0, 10) > filterTo) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FEFBF6" }}>
      <Sidebar />
      <div className="flex-1 p-8 ml-64 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Family Allowance 💰</h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">Track every income source</p>
          </div>
          <div className="px-6 py-3 rounded-[24px] font-bold text-emerald-500 bg-emerald-50 text-sm">
            Total: TND {Number(totalIncome).toFixed(2)}
          </div>
        </div>

        {/* Add Income Form */}
        <form onSubmit={handleAddIncome} className="bg-white p-6 rounded-[24px] mb-6"
          style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">Add a New Income</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-sm font-semibold text-slate-600">Title</label>
              <input type="text" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300" placeholder="e.g., Monthly Salary"
                value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold text-slate-600">Amount (TND)</label>
              <input type="number" min="0.01" step="0.01" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                placeholder="e.g., 1500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold text-slate-600">Date</label>
              <input type="date" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold text-slate-600">Category</label>
              <select className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300" value={category}
                onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold text-slate-600">Source (optional)</label>
            <input type="text" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300" placeholder="e.g., Company name"
              value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600">
              <input type="checkbox" checked={isRecurring} onChange={(e) => {
                setIsRecurring(e.target.checked);
                if (!e.target.checked) setRecurrenceType("");
              }} />
              Recurring income
            </label>
            {isRecurring && (
              <select className="border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6]" value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value)} required>
                <option value="">Select frequency</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>
          <button type="submit" className="text-white py-2.5 px-6 rounded-[14px] font-bold text-sm transition-all"
            style={{ backgroundColor: "#10B981" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#059669"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#10B981"; }}>
            + Add Income
          </button>
        </form>

        {/* Filters */}
        <div className="bg-white p-5 rounded-[24px] mb-4 flex gap-4 flex-wrap items-end"
          style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest w-full">Filter</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
            <select className="border border-[#E8DFD2] p-2 rounded-[12px] text-sm bg-[#FEFBF6]" value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
            <input type="date" className="border border-[#E8DFD2] p-2 rounded-[12px] text-sm bg-[#FEFBF6]"
              value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
            <input type="date" className="border border-[#E8DFD2] p-2 rounded-[12px] text-sm bg-[#FEFBF6]"
              value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
          <button className="text-sm font-semibold text-slate-400 hover:text-slate-600 underline"
            onClick={() => { setFilterCategory(""); setFilterFrom(""); setFilterTo(""); }}>
            Clear
          </button>
        </div>

        {/* Incomes List */}
        <div className="bg-white p-6 rounded-[24px]" style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">
            Incomes
            {filteredIncomes.length !== incomes.length && (
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({filteredIncomes.length} of {incomes.length})
              </span>
            )}
          </h2>
          {filteredIncomes.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-slate-400 font-medium text-sm">No income records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC" }}>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider p-3 rounded-l-[12px]">Title</th>
                    <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider p-3">Amount</th>
                    <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider p-3">Date</th>
                    <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider p-3">Category</th>
                    <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider p-3">Source</th>
                    <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider p-3">Recurring</th>
                    <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider p-3 rounded-r-[12px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.map((inc) => (
                    <tr key={inc.id} className="border-b border-[#F5EFE7] hover:bg-[#FEFBF6] transition-colors">
                      <td className="p-3 text-sm font-semibold text-slate-800">{inc.title}</td>
                      <td className="p-3 text-right text-sm font-bold text-emerald-500">TND {Number(inc.amount).toFixed(2)}</td>
                      <td className="p-3 text-center text-sm text-slate-500">{inc.date?.substring(0, 10)}</td>
                      <td className="p-3 text-center">
                        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#F5EFE7", color: "#6B7280" }}>
                          {inc.category}
                        </span>
                      </td>
                      <td className="p-3 text-center text-sm text-slate-400">{inc.source || "-"}</td>
                      <td className="p-3 text-center">
                        {inc.is_recurring ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full capitalize" style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                            {inc.recurrence_type || "Yes"}
                          </span>
                        ) : <span className="text-slate-300">--</span>}
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button className="text-xs font-bold py-1.5 px-3 rounded-[10px] text-white transition-all"
                          style={{ backgroundColor: "#818CF8" }}
                          onClick={() => openEdit(inc)}>Edit</button>
                        <button className="text-xs font-bold py-1.5 px-3 rounded-[10px] text-white transition-all"
                          style={{ backgroundColor: "#EF4444" }}
                          onClick={() => handleDeleteIncome(inc.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingIncome && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-[24px] shadow-2xl w-1/2 max-h-screen overflow-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-5">Edit Income ✏️</h2>
            <form onSubmit={handleEditIncome}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-600">Title</label>
                  <input type="text" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-600">Amount</label>
                  <input type="number" min="0.01" step="0.01" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-600">Date</label>
                  <input type="date" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} required />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-600">Category</label>
                  <select className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-semibold text-slate-600">Source</label>
                <input type="text" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} />
              </div>
              <div className="flex items-center gap-4 mb-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600">
                  <input type="checkbox" checked={editForm.is_recurring}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      is_recurring: e.target.checked,
                      recurrence_type: e.target.checked ? editForm.recurrence_type : ""
                    })} />
                  Recurring
                </label>
                {editForm.is_recurring && (
                  <select className="border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6]"
                    value={editForm.recurrence_type}
                    onChange={(e) => setEditForm({ ...editForm, recurrence_type: e.target.value })}>
                    <option value="">Select frequency</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>
              <div className="flex gap-3">
                <button type="submit" className="text-white py-2.5 px-6 rounded-[14px] font-bold text-sm"
                  style={{ backgroundColor: "#4F46E5" }}>
                  Save Changes
                </button>
                <button type="button" className="py-2.5 px-6 rounded-[14px] font-bold text-sm text-slate-500"
                  style={{ backgroundColor: "#F5EFE7" }}
                  onClick={() => setEditingIncome(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
