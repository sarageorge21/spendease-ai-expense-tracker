import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const FEATURES = [
  { icon: '💸', title: 'Smart Expense Tracking', desc: 'Log, categorize, and search expenses with a single click. Full CRUD with real-time totals.' },
  { icon: '🤖', title: 'AI Financial Assistant', desc: 'Ask anything: "How much did I spend on food?" Get instant personalized answers.' },
  { icon: '📸', title: 'OCR Receipt Scanner', desc: 'Snap a photo of any receipt. Our AI extracts title, amount, date, and category automatically.' },
  { icon: '📊', title: 'Visual Analytics', desc: 'Monthly trends, category breakdowns, and comparison charts. See your money at a glance.' },
  { icon: '🎯', title: 'Smart Budgeting', desc: 'Set monthly and category budgets. Get AI-powered recommendations when you overspend.' },
  { icon: '🏆', title: 'Savings Goals', desc: 'Set goals like "Buy a MacBook" and track your progress with milestone celebrations.' },
  { icon: '🔮', title: 'Expense Predictions', desc: 'ML-powered forecasting predicts your next 3 months of spending based on your history.' },
  { icon: '📄', title: 'Export Reports', desc: 'Download CSV or PDF financial reports with charts, summaries, and spending insights.' },
];

const STATS = [
  { value: '₹2.4Cr', label: 'Tracked by users' },
  { value: '50K+', label: 'Expenses logged' },
  { value: '98%', label: 'Accuracy on OCR' },
  { value: '4.9★', label: 'User rating' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💸</div>
          <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '1.1rem' }}>Spendease <span style={{ color: 'var(--accent-2)' }}>Pro</span></span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border-2)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              cursor: 'pointer',
              color: 'var(--text)',
              transition: 'transform 0.15s',
            }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <span className="badge badge-purple" style={{ marginBottom: 20, fontSize: '0.75rem' }}>✨ AI-Powered Finance Intelligence</span>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, maxWidth: 800, margin: '0 auto 20px' }}>
          Your Money,<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Intelligently Managed
          </span>
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Track expenses, scan receipts with AI, set budgets, predict spending, and get personalized financial insights — all in one platform.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '13px 32px', fontSize: '1rem' }} onClick={() => navigate('/register')}>
            🚀 Start for Free
          </button>
          <button className="btn btn-ghost" style={{ padding: '13px 32px', fontSize: '1rem' }} onClick={() => navigate('/login')}>
            Sign in →
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ display: 'flex', justifyContent: 'center', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ padding: '28px 48px', textAlign: 'center', borderRight: i < STATS.length-1 ? '1px solid var(--border)' : 'none' }}>
            <p style={{ fontFamily: 'var(--font-d)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-2)' }}>{s.value}</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>Everything you need to master your finances</h2>
          <p style={{ color: 'var(--text-2)', maxWidth: 500, margin: '0 auto' }}>Built for individuals who want clarity, control, and intelligence over their money.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={{ transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 8, fontSize: '0.95rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '0.82rem', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>Ready to take control of your finances?</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 32 }}>Join thousands of users who track smarter with Spendease Pro.</p>
        <button className="btn btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }} onClick={() => navigate('/register')}>
          Create Free Account →
        </button>
      </section>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)', color: 'var(--text-3)', fontSize: '0.8rem' }}>
        © 2026 Spendease Pro · Built with MERN + AI
      </footer>
    </div>
  );
}
