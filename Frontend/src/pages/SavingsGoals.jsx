import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../Components/SideBar";
import { FaBullseye, FaPlus, FaPiggyBank } from "react-icons/fa";

const SavingsGoals = () => {
  const [families, setFamilies] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create goal form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // Contribute
  const [contributingGoalId, setContributingGoalId] = useState(null);
  const [contribution, setContribution] = useState("");

  useEffect(() => {
    api.get("/families")
      .then(res => {
        setFamilies(res.data);
        if (res.data.length > 0) setSelectedFamilyId(res.data[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedFamilyId) fetchGoals();
  }, [selectedFamilyId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/savings-goals?familyId=${selectedFamilyId}`);
      setGoals(res.data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await api.post("/savings-goals", {
        familyId: selectedFamilyId,
        title,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline || undefined,
      });
      setTitle(""); setTargetAmount(""); setDeadline("");
      setShowForm(false);
      fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleContribute = async (goalId) => {
    const amount = parseFloat(contribution);
    if (!amount || amount <= 0) return;
    try {
      await api.put(`/savings-goals/${goalId}/contribute`, { amount });
      setContributingGoalId(null);
      setContribution("");
      fetchGoals();
    } catch (error) {
      console.error("Error contributing:", error);
    }
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm("Delete this savings goal?")) return;
    try {
      await api.delete(`/savings-goals/${goalId}`);
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 ml-64 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Savings Goals</h1>
            <p className="text-gray-500 text-sm mt-1">Track your family savings targets</p>
          </div>
          <div className="flex gap-3">
            {families.length > 1 && (
              <select
                className="border p-2 rounded text-sm"
                value={selectedFamilyId}
                onChange={(e) => setSelectedFamilyId(e.target.value)}
              >
                {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <FaPlus /> New Goal
            </button>
          </div>
        </div>

        {/* No family warning */}
        {families.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-700">
            You need to create or join a family before setting savings goals.
          </div>
        )}

        {/* Create Goal Form */}
        {showForm && selectedFamilyId && (
          <form onSubmit={handleCreateGoal} className="bg-white p-6 rounded shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">New Savings Goal</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 md:col-span-1">
                <label className="block text-sm text-gray-700 mb-1">Goal Title</label>
                <input type="text" className="w-full border p-2 rounded" placeholder="e.g., Emergency Fund"
                  value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Target Amount (TND)</label>
                <input type="number" min="1" step="0.01" className="w-full border p-2 rounded"
                  placeholder="e.g., 5000" value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Deadline (optional)</label>
                <input type="date" className="w-full border p-2 rounded"
                  value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                Create Goal
              </button>
              <button type="button" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Goals Grid */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : goals.length === 0 && selectedFamilyId ? (
          <div className="bg-white p-12 rounded shadow-md text-center text-gray-500">
            <FaPiggyBank className="text-5xl mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No savings goals yet</p>
            <p className="text-sm mt-1">Create your first goal to start saving together.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {goals.map(goal => {
              const current = Number(goal.currentAmount);
              const target = Number(goal.targetAmount);
              const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
              const achieved = current >= target;

              return (
                <div key={goal.id} className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${achieved ? "border-green-500" : "border-indigo-500"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{goal.title}</h3>
                      {goal.deadline && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {achieved && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Achieved!
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">TND {current.toFixed(2)}</span>
                      <span className="font-semibold text-indigo-600">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${achieved ? "bg-green-500" : "bg-indigo-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Saved</span>
                      <span>Target: TND {target.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Remaining */}
                  {!achieved && (
                    <p className="text-sm text-gray-500 mb-4">
                      TND {Math.max(0, target - current).toFixed(2)} remaining
                    </p>
                  )}

                  {/* Contribute */}
                  {!achieved && (
                    contributingGoalId === goal.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number" min="0.01" step="0.01"
                          className="flex-1 border p-1.5 rounded text-sm"
                          placeholder="Amount (TND)"
                          value={contribution}
                          onChange={(e) => setContribution(e.target.value)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleContribute(goal.id)}
                          className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setContributingGoalId(null); setContribution(""); }}
                          className="bg-gray-200 px-3 py-1.5 rounded text-sm hover:bg-gray-300"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setContributingGoalId(goal.id)}
                        className="w-full text-sm bg-indigo-50 text-indigo-700 py-2 rounded hover:bg-indigo-100 transition-colors"
                      >
                        + Add Contribution
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="mt-2 w-full text-xs text-gray-300 hover:text-red-400 transition-colors"
                  >
                    Delete goal
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGoals;
