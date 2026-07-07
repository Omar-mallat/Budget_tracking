import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AuthForm() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const response = await axios.post('http://localhost:5000/auth/login', { email, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        await axios.post('http://localhost:5000/auth/register', { name, email, password });
        setName('');
        setEmail('');
        setPassword('');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FEFBF6" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
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
          <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">
            {isLogin ? "Welcome back! 👋" : "Join the family! 🏠"}
          </h2>
          <p className="text-sm text-slate-400 font-medium text-center mb-6">
            {isLogin ? "Sign in to your family account" : "Create your family budget account"}
          </p>

          {/* Toggle */}
          <div className="flex bg-[#F5EFE7] p-1 rounded-[16px] mb-6">
            <button
              className="flex-1 py-2.5 rounded-[14px] text-sm font-bold transition-all"
              style={isLogin
                ? { backgroundColor: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(79,70,229,0.1)" }
                : { color: "#A89F91" }}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className="flex-1 py-2.5 rounded-[14px] text-sm font-bold transition-all"
              style={!isLogin
                ? { backgroundColor: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(79,70,229,0.1)" }
                : { color: "#A89F91" }}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Hidden dummy fields to block browser autofill */}
            <input type="text" style={{ display: "none" }} />
            <input type="password" style={{ display: "none" }} />
            {!isLogin && (
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-slate-600">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="off"
                  className="w-full border border-[#E8DFD2] p-3 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
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
                placeholder="Password"
                autoComplete="new-password"
                className="w-full border border-[#E8DFD2] p-3 rounded-[14px] text-sm bg-[#FEFBF6] focus:outline-none focus:border-indigo-300"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-[12px] text-sm font-medium text-rose-500" style={{ backgroundColor: "#FEF2F2" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 text-white rounded-[14px] font-bold text-sm mt-2 transition-all"
              style={{ backgroundColor: "#4F46E5" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 font-medium mt-6">
          Manage your family finances together 🌟
        </p>
      </div>
    </div>
  );
}

export default AuthForm;
