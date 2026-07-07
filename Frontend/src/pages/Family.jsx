import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../Components/SideBar";

const ROLE_COLORS = {
  ADMIN: { bg: "#FEF3C7", text: "#D97706" },
  MEMBER: { bg: "#EEF2FF", text: "#4F46E5" },
  CHILD: { bg: "#ECFDF5", text: "#059669" },
};

const ROLE_EMOJI = { ADMIN: "👑", MEMBER: "👤", CHILD: "⭐" };

const MEMBER_AVATAR_COLORS = ["#A8D5FF", "#FFB366", "#B8E6B8", "#FFD966", "#C084FC", "#F9A8D4"];

const Family = () => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newFamilyName, setNewFamilyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => { fetchFamilies(); }, []);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/families");
      setFamilies(res.data);
      if (res.data.length > 0 && !selectedFamily) setSelectedFamily(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSelected = async () => {
    const res = await api.get("/families");
    setFamilies(res.data);
    setSelectedFamily(res.data.find(f => f.id === selectedFamily?.id) || res.data[0]);
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    try {
      const res = await api.post("/families", { name: newFamilyName });
      setNewFamilyName("");
      setShowCreateForm(false);
      await fetchFamilies();
      setSelectedFamily(res.data.family);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setInviting(true);
    try {
      await api.post(`/families/${selectedFamily.id}/invite`, { email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      setInviteSuccess(`✅ ${inviteEmail} has been added to the family!`);
      await refreshSelected();
    } catch (err) {
      setInviteError(err.response?.data?.error || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from the family?")) return;
    try {
      await api.delete(`/families/${selectedFamily.id}/members/${memberId}`);
      await refreshSelected();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api.put(`/families/${selectedFamily.id}/members/${memberId}/role`, { role: newRole });
      await refreshSelected();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = selectedFamily?.myRole === "ADMIN";

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FEFBF6" }}>
      <Sidebar />

      <div className="flex-1 ml-64 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Family 👨‍👩‍👧‍👦</h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">Manage your family workspace</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 text-white px-6 py-3 rounded-[24px] font-bold text-sm shadow-lg transition-all"
            style={{ backgroundColor: "#4F46E5" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}
          >
            <span>+</span> Create Family
          </button>
        </div>

        {/* Create Family Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateFamily}
            className="bg-white p-6 rounded-[24px] mb-6"
            style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
            <h2 className="text-base font-bold text-slate-800 mb-4">New Family Workspace 🏠</h2>
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 border border-[#E8DFD2] p-3 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                placeholder="e.g., The Mallat Family"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                required
              />
              <button type="submit"
                className="text-white px-6 py-3 rounded-[14px] font-bold text-sm"
                style={{ backgroundColor: "#4F46E5" }}>
                Create
              </button>
              <button type="button"
                className="px-6 py-3 rounded-[14px] font-bold text-sm text-slate-500"
                style={{ backgroundColor: "#F5EFE7" }}
                onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3 animate-pulse">👨‍👩‍👧‍👦</div>
            <p className="text-slate-400 font-medium">Loading families...</p>
          </div>
        ) : families.length === 0 ? (
          <div className="bg-white rounded-[28px] p-16 text-center"
            style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
            <div className="text-6xl mb-4">🏠</div>
            <p className="text-lg font-bold text-slate-800 mb-2">No family workspace yet</p>
            <p className="text-sm text-slate-400 font-medium mb-6">
              Create a family to start managing finances together.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-white px-8 py-3 rounded-[24px] font-bold text-sm"
              style={{ backgroundColor: "#4F46E5" }}>
              Create Your Family
            </button>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Family List */}
            <div className="w-60 flex-shrink-0 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3">
                Your Families
              </p>
              {families.map(f => (
                <button key={f.id} onClick={() => setSelectedFamily(f)}
                  className="w-full text-left px-5 py-4 rounded-[20px] border-2 transition-all"
                  style={selectedFamily?.id === f.id
                    ? { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" }
                    : { borderColor: "#E8DFD2", backgroundColor: "#fff" }
                  }>
                  <div className="font-bold text-sm"
                    style={{ color: selectedFamily?.id === f.id ? "#4F46E5" : "#1E293B" }}>
                    {f.name}
                  </div>
                  <div className="text-xs mt-0.5 font-medium" style={{ color: "#A89F91" }}>
                    {f.members?.length} member{f.members?.length !== 1 ? "s" : ""} · {f.myRole}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Family Detail */}
            {selectedFamily && (
              <div className="flex-1 space-y-6">
                {/* Member List */}
                <div className="bg-white rounded-[24px] p-7"
                  style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{selectedFamily.name}</h2>
                      <p className="text-xs font-medium mt-0.5" style={{ color: "#A89F91" }}>
                        {selectedFamily.members?.length} member{selectedFamily.members?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: ROLE_COLORS[selectedFamily.myRole]?.bg,
                        color: ROLE_COLORS[selectedFamily.myRole]?.text
                      }}>
                      {ROLE_EMOJI[selectedFamily.myRole]} You are {selectedFamily.myRole}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedFamily.members?.map((member, i) => {
                      const isMe = member.user.id === currentUser.id;
                      const avatarColor = MEMBER_AVATAR_COLORS[i % MEMBER_AVATAR_COLORS.length];
                      return (
                        <div key={member.id}
                          className="flex items-center justify-between p-4 rounded-[18px] border-2 border-transparent transition-all"
                          style={{ backgroundColor: "#F8FAFC" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.borderColor = "#E0E7FF"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F8FAFC"; e.currentTarget.style.borderColor = "transparent"; }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm"
                              style={{ backgroundColor: avatarColor }}>
                              {member.user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-800">
                                {member.user.name}
                                {isMe && (
                                  <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-medium mt-0.5" style={{ color: "#A89F91" }}>
                                {member.user.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isAdmin && !isMe ? (
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                className="text-xs font-bold border border-[#E8DFD2] rounded-[10px] px-3 py-1.5 bg-[#FEFBF6]"
                                style={{ color: ROLE_COLORS[member.role]?.text }}
                              >
                                <option value="ADMIN">👑 Admin</option>
                                <option value="MEMBER">👤 Member</option>
                                <option value="CHILD">⭐ Child</option>
                              </select>
                            ) : (
                              <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                                style={{
                                  backgroundColor: ROLE_COLORS[member.role]?.bg,
                                  color: ROLE_COLORS[member.role]?.text
                                }}>
                                {ROLE_EMOJI[member.role]} {member.role}
                              </span>
                            )}

                            {isAdmin && !isMe && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-slate-300 hover:text-rose-400 hover:bg-rose-50"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invite Form — admins only */}
                {isAdmin && (
                  <div className="bg-white rounded-[24px] p-7"
                    style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.15)" }}>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">
                      Invite a Family Member ✉️
                    </h2>
                    <p className="text-sm font-medium mb-5" style={{ color: "#A89F91" }}>
                      They need to have an account first. Enter their registered email below.
                    </p>

                    <form onSubmit={handleInvite}>
                      <div className="flex gap-3 flex-wrap">
                        <input
                          type="email"
                          className="flex-1 min-w-48 border border-[#E8DFD2] p-3 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                          placeholder="Enter their email address"
                          value={inviteEmail}
                          onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); setInviteSuccess(""); }}
                          required
                        />
                        <select
                          className="border border-[#E8DFD2] p-3 rounded-[14px] text-sm font-semibold bg-[#FEFBF6]"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                        >
                          <option value="MEMBER">👤 Member</option>
                          <option value="ADMIN">👑 Admin</option>
                          <option value="CHILD">⭐ Child</option>
                        </select>
                        <button
                          type="submit"
                          disabled={inviting}
                          className="text-white px-6 py-3 rounded-[14px] font-bold text-sm transition-all disabled:opacity-60"
                          style={{ backgroundColor: "#4F46E5" }}
                          onMouseEnter={(e) => { if (!inviting) e.currentTarget.style.backgroundColor = "#4338CA"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}
                        >
                          {inviting ? "Sending..." : "Send Invite"}
                        </button>
                      </div>

                      {inviteError && (
                        <div className="mt-3 p-3 rounded-[12px] text-sm font-medium text-rose-500"
                          style={{ backgroundColor: "#FEF2F2" }}>
                          {inviteError}
                        </div>
                      )}
                      {inviteSuccess && (
                        <div className="mt-3 p-3 rounded-[12px] text-sm font-medium text-emerald-600"
                          style={{ backgroundColor: "#ECFDF5" }}>
                          {inviteSuccess}
                        </div>
                      )}
                    </form>

                    {/* Role guide */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {[
                        { role: "ADMIN", desc: "Full access — can invite, remove members and manage everything" },
                        { role: "MEMBER", desc: "Can add transactions and view all family finances" },
                        { role: "CHILD", desc: "View-only access to family finances" },
                      ].map(({ role, desc }) => (
                        <div key={role} className="p-4 rounded-[16px]"
                          style={{ backgroundColor: ROLE_COLORS[role].bg }}>
                          <p className="text-xs font-bold mb-1" style={{ color: ROLE_COLORS[role].text }}>
                            {ROLE_EMOJI[role]} {role}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Family;
