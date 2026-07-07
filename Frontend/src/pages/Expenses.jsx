import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../Components/SideBar";

const CATEGORIES = ["Food", "Transport", "Education", "Healthcare", "Rent", "Bills", "Entertainment", "Clothing", "Groceries", "Subscriptions", "Travelling", "Family Events", "Charity", "Other"];

const Expenses = () => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("");

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenses, setExpenses] = useState([]);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchExpenses();
    fetchTotal();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get("/expenses");
      setExpenses(res.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const fetchTotal = async () => {
    try {
      const res = await api.get("/expenses/total");
      setTotalExpenses(res.data?.totalExpenses || 0);
    } catch (error) {
      console.error("Error fetching total expenses:", error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post("/expenses", {
        title, amount: parseFloat(amount), category, date, reference,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
      });
      setTitle(""); setAmount(""); setDate(""); setCategory("");
      setReference(""); setIsRecurring(false); setRecurrenceType("");
      fetchExpenses();
      fetchTotal();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
      fetchTotal();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const openEdit = (exp) => {
    setEditingExpense(exp);
    setEditForm({
      title: exp.title,
      amount: exp.amount,
      date: exp.date?.substring(0, 10),
      category: exp.category || "",
      reference: exp.reference || "",
      is_recurring: exp.is_recurring || false,
      recurrence_type: exp.recurrence_type || "",
    });
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/expenses/${editingExpense.id}`, editForm);
      setEditingExpense(null);
      fetchExpenses();
      fetchTotal();
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    if (filterCategory && exp.category !== filterCategory) return false;
    if (filterFrom && exp.date?.substring(0, 10) < filterFrom) return false;
    if (filterTo && exp.date?.substring(0, 10) > filterTo) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FEFBF6" }}>
      <Sidebar />
      <div className="flex-1 p-8 ml-64 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Spending List 🛒</h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">Track every family purchase</p>
          </div>
          <div className="px-6 py-3 rounded-[24px] font-bold text-rose-500 bg-rose-50 text-sm">
            Total: TND {Number(totalExpenses).toFixed(2)}
          </div>
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="bg-white p-6 rounded-[24px] mb-6"
          style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">Add a New Expense</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-sm font-semibold text-slate-600">Title</label>
              <input type="text" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300" placeholder="e.g., Dentist"
                value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold text-slate-600">Amount (TND)</label>
              <input type="number" min="0.01" step="0.01" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                placeholder="e.g., 300" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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
            <label className="block mb-1 text-sm font-semibold text-slate-600">Reference (optional)</label>
            <input type="text" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300" placeholder="Notes..."
              value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600">
              <input type="checkbox" checked={isRecurring} onChange={(e) => {
                setIsRecurring(e.target.checked);
                if (!e.target.checked) setRecurrenceType("");
              }} />
              Recurring expense
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
            style={{ backgroundColor: "#EF4444" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#DC2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#EF4444"; }}>
            + Add Expense
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

        {/* Expenses List */}
        <div className="bg-white p-6 rounded-[24px]" style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">
            Expenses
            {filteredExpenses.length !== expenses.length && (
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({filteredExpenses.length} of {expenses.length})
              </span>
            )}
          </h2>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-slate-400 font-medium text-sm">No expenses found.</p>
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
                    <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider p-3">Reference</th>
                    <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider p-3">Recurring</th>
                    <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider p-3 rounded-r-[12px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-[#F5EFE7] hover:bg-[#FEFBF6] transition-colors">
                      <td className="p-3 text-sm font-semibold text-slate-800">{exp.title}</td>
                      <td className="p-3 text-right text-sm font-bold text-rose-500">TND {Number(exp.amount).toFixed(2)}</td>
                      <td className="p-3 text-center text-sm text-slate-500">{exp.date?.substring(0, 10)}</td>
                      <td className="p-3 text-center">
                        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#F5EFE7", color: "#6B7280" }}>
                          {exp.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="p-3 text-center text-sm text-slate-400">{exp.reference || "--"}</td>
                      <td className="p-3 text-center">
                        {exp.is_recurring ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full capitalize" style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                            {exp.recurrence_type || "Yes"}
                          </span>
                        ) : <span className="text-slate-300">--</span>}
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button className="text-xs font-bold py-1.5 px-3 rounded-[10px] text-white transition-all"
                          style={{ backgroundColor: "#818CF8" }}
                          onClick={() => openEdit(exp)}>Edit</button>
                        <button className="text-xs font-bold py-1.5 px-3 rounded-[10px] text-white transition-all"
                          style={{ backgroundColor: "#EF4444" }}
                          onClick={() => handleDeleteExpense(exp.id)}>Delete</button>
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
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-[24px] shadow-2xl w-1/2 max-h-screen overflow-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-5">Edit Expense ✏️</h2>
            <form onSubmit={handleEditExpense}>
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
                <label className="block mb-1 text-sm font-semibold text-slate-600">Reference</label>
                <input type="text" className="w-full border border-[#E8DFD2] p-2.5 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                  value={editForm.reference}
                  onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} />
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
                  onClick={() => setEditingExpense(null)}>
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

export default Expenses;
