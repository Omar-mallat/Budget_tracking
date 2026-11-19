import React from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { emoji: '💸', title: 'Track Together', desc: 'Log expenses and income as a family, all in one shared place.', bg: '#EEF2FF' },
  { emoji: '🎯', title: 'Set Budgets', desc: 'Create category budgets and see exactly where the month is heading.', bg: '#FFF7ED' },
  { emoji: '🌟', title: 'Savings Goals', desc: 'Save up for the things that matter — trips, gifts, dreams.', bg: '#ECFDF5' },
  { emoji: '📊', title: 'See the Big Picture', desc: 'Clear analytics that turn numbers into real family decisions.', bg: '#FAF5FF' },
];

function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#FEFBF6' }} className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[16px] flex items-center justify-center text-2xl shadow-sm"
            style={{ backgroundColor: '#FFB366' }}>
            🐷
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: '#4F46E5' }}>
            BudgetTrack
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 rounded-[14px] font-bold text-sm text-white transition-all"
          style={{ backgroundColor: '#4F46E5' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4338CA'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4F46E5'; }}
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <header className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
          ❤️ Built for families
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight mb-5">
          Manage your family finances,<br /> together. 👋
        </h1>
        <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto mb-10">
          Track spending, set budgets, and reach your savings goals as one team — all in one warm, simple place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-[16px] font-bold text-sm text-white shadow-lg transition-all"
            style={{ backgroundColor: '#4F46E5' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4338CA'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4F46E5'; }}
          >
            Get Started Free
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-[16px] font-bold text-sm text-slate-600 bg-white border transition-all"
            style={{ borderColor: '#E8DFD2' }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="bg-white p-7 rounded-[24px] hover:scale-[1.02] transition-transform"
              style={{ boxShadow: '0 10px 25px -5px rgba(184,166,142,0.15)' }}>
              <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-3xl mb-5"
                style={{ backgroundColor: f.bg }}>
                {f.emoji}
              </div>
              <h3 className="text-base font-extrabold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-[28px] px-10 py-14 text-center"
          style={{ backgroundColor: '#4F46E5', boxShadow: '0 10px 25px -5px rgba(79,70,229,0.3)' }}>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
            Ready to grow your savings together? 🌟
          </h2>
          <p className="text-indigo-100 font-medium mb-8">
            Create your free family account in seconds.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-[16px] font-bold text-sm bg-white transition-all"
            style={{ color: '#4F46E5' }}
          >
            Join the Family
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 font-medium pb-10">
        Manage your family finances together 🌟
      </footer>
    </div>
  );
}

export default Landing;
