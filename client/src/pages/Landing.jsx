import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 48px',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0,
        background: 'var(--surface)', backdropFilter: 'blur(12px)', zIndex: 100,
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💸</div>
          <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>Spendease <span style={{ color: 'var(--accent-2)' }}>Pro</span></span>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 6 : 10, alignItems: 'center' }}>
          <button
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border-2)',
              borderRadius: '50%',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', cursor: 'pointer', color: 'var(--text)',
              transition: 'transform 0.15s', flexShrink: 0,
            }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          {!isMobile && (
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          )}
          <button
            className="btn btn-primary"
            style={{ padding: isMobile ? '8px 14px' : '9px 18px', fontSize: isMobile ? '0.8rem' : '0.875rem' }}
            onClick={() => navigate('/register')}
          >
            {isMobile ? 'Start Free' : 'Get Started Free'}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: isMobile ? '60px 20px 50px' : '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <span className="badge badge-purple" style={{ marginBottom: 20, fontSize: '0.75rem' }}>✨ AI-Powered Finance Intelligence</span>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(1.8rem, 5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, maxWidth: 800, margin: '0 auto 20px' }}>
          Your Money,<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Intelligently Managed
          </span>
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: isMobile ? '0.95rem' : '1.1rem', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7, padding: isMobile ? '0 8px' : 0 }}>
          Track expenses, scan receipts with AI, set budgets, predict spending, and get personalized financial insights — all in one platform.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: isMobile ? '12px 24px' : '13px 32px', fontSize: isMobile ? '0.9rem' : '1rem' }} onClick={() => navigate('/register')}>
            🚀 Start for Free
          </button>
          <button className="btn btn-ghost" style={{ padding: isMobile ? '12px 24px' : '13px 32px', fontSize: isMobile ? '0.9rem' : '1rem' }} onClick={() => navigate('/login')}>
            Sign in →
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            padding: isMobile ? '18px 12px' : '28px 48px', textAlign: 'center',
            borderRight: isMobile ? (i % 2 === 0 ? '1px solid var(--border)' : 'none') : (i < STATS.length - 1 ? '1px solid var(--border)' : 'none'),
            borderBottom: isMobile && i < 2 ? '1px solid var(--border)' : 'none',
          }}>
            <p style={{ fontFamily: 'var(--font-d)', fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 700, color: 'var(--accent-2)' }}>{s.value}</p>
            <p style={{ color: 'var(--text-3)', fontSize: isMobile ? '0.7rem' : '0.8rem', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: isMobile ? '48px 16px' : '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 56 }}>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 700, marginBottom: 12 }}>Everything you need to master your finances</h2>
          <p style={{ color: 'var(--text-2)', maxWidth: 500, margin: '0 auto', fontSize: isMobile ? '0.85rem' : '1rem' }}>Built for individuals who want clarity, control, and intelligence over their money.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: isMobile ? 14 : 20 }}>
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
      <section style={{ textAlign: 'center', padding: isMobile ? '48px 20px' : '80px 24px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 700, marginBottom: 16 }}>Ready to take control of your finances?</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 32, fontSize: isMobile ? '0.85rem' : '1rem' }}>Join thousands of users who track smarter with Spendease Pro.</p>
        <button className="btn btn-primary" style={{ padding: isMobile ? '12px 28px' : '14px 40px', fontSize: isMobile ? '0.9rem' : '1rem' }} onClick={() => navigate('/register')}>
          Create Free Account →
        </button>
      </section>

      <footer style={{ textAlign: 'center', padding: '24px 16px', borderTop: '1px solid var(--border)', color: 'var(--text-3)', fontSize: '0.8rem' }}>
        © 2026 Spendease Pro · Built with MERN + AI
      </footer>
    </div>
  );
}
