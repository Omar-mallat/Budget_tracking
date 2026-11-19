import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await api.get(`/invitations/${token}`);
        setInvite(res.data);
      } catch (err) {
        setLoadError(err.response?.data?.error || 'This invitation link is invalid.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/invitations/${token}/accept`, { name, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FEFBF6" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-[20px] flex items-center justify-center text-3xl shadow-sm"
            style={{ backgroundColor: "#FFB366" }}>
            🐷
          </div>
          <span className="text-3xl font-bold tracking-tight" style={{ color: "#4F46E5" }}>
            BudgetTrack
          </span>
        </div>

        <div className="bg-white p-8 rounded-[28px]" style={{ boxShadow: "0 10px 25px -5px rgba(184,166,142,0.2)" }}>
          {loading ? (
            <p className="text-center text-slate-400 font-medium py-8">Loading invitation...</p>
          ) : loadError ? (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">Invitation not valid ⚠️</h2>
              <p className="text-sm text-rose-500 font-medium text-center mb-6">{loadError}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 text-white rounded-[14px] font-bold text-sm"
                style={{ backgroundColor: "#4F46E5" }}
              >
                Go to Login
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">You're invited! 🏠</h2>
              <p className="text-sm text-slate-400 font-medium text-center mb-6">
                Join <strong>{invite.familyName}</strong> as a <strong>{invite.role}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-slate-600">Email</label>
                  <input
                    type="email"
                    value={invite.email}
                    disabled
                    className="w-full border border-[#E8DFD2] p-3 rounded-[14px] text-sm bg-[#F5EFE7] text-slate-400"
                  />
                </div>
                {invite.accountExists ? (
                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-slate-600">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      autoComplete="current-password"
                      className="w-full border border-[#E8DFD2] p-3 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block mb-1.5 text-sm font-semibold text-slate-600">Your Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        autoComplete="off"
                        className="w-full border border-[#E8DFD2] p-3 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm font-semibold text-slate-600">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        className="w-full border border-[#E8DFD2] p-3 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                        required
                        minLength={8}
                      />
                    </div>
                  </>
                )}

                {submitError && (
                  <div className="p-3 rounded-[12px] text-sm font-medium text-rose-500" style={{ backgroundColor: "#FEF2F2" }}>
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-white rounded-[14px] font-bold text-sm mt-2 transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#4F46E5" }}
                >
                  {submitting
                    ? (invite.accountExists ? "Joining..." : "Creating account...")
                    : (invite.accountExists ? "Log In & Join" : "Create Account & Join")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AcceptInvite;
