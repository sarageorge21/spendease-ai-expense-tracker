import React, { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../api/index';
import { fmt, healthScoreColor, healthScoreLabel } from '../utils/index';

const QUICK = [
  'How much did I spend this month?',
  'What is my top spending category?',
  'Give me savings advice',
  'Predict my next month spending',
  'What is my financial health score?',
  'How much am I saving?',
];

export default function AIAssistant() {
  const [insights, setInsights]     = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [messages, setMessages]     = useState([{ role: 'ai', text: "Hi! 👋 I'm your AI financial assistant. Ask me anything about your spending, income, or financial health!" }]);
  const [input, setInput]           = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading]       = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    Promise.all([aiAPI.insights(), aiAPI.predictions()])
      .then(([ir, pr]) => { setInsights(ir.data.data); setPredictions(pr.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (msg) => {
    const text = msg || input.trim();
    if (!text) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setChatLoading(true);
    try {
      const r = await aiAPI.chat(text, messages);
      setMessages(m => [...m, { role: 'ai', text: r.data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: "Sorry, I couldn't process that. Please try again." }]);
    } finally { setChatLoading(false); }
  };

  const scoreColor = insights ? healthScoreColor(insights.healthScore) : '#64748b';
  const scoreLabel = insights ? healthScoreLabel(insights.healthScore) : '';

  return (
    <div>
      <div className="page-header">
        <h1>AI Assistant 🤖</h1>
        <p>Personalized insights, predictions, and financial intelligence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Health Score */}
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #0f1628, #1a1040)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Financial Health Score</p>
          {loading ? <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto' }} /> : (
            <>
              <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
                <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--raised)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - (insights?.healthScore || 0) / 100)}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-d)', fontSize: '1.8rem', fontWeight: 700, color: scoreColor }}>{insights?.healthScore || 0}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>/100</span>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '1rem', color: scoreColor }}>{scoreLabel}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 4 }}>{insights?.personality}</p>
            </>
          )}
        </div>

        {/* Quick Insights */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>📊 This Month's Snapshot</h3>
          {loading ? <p style={{ color: 'var(--text-3)' }}>Loading…</p> : insights && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Total Spent', fmt(insights.thisMonthTotal), 'var(--red)'],
                ['Income', fmt(insights.incomeTotal), 'var(--green)'],
                ['Savings', fmt(insights.savings), insights.savings >= 0 ? 'var(--green)' : 'var(--red)'],
                ['Savings Rate', `${insights.savingsRate}%`, insights.savingsRate >= 20 ? 'var(--green)' : 'var(--yellow)'],
                ['Vs Last Month', `${insights.trend === 'up' ? '▲' : insights.trend === 'down' ? '▼' : '='} ${insights.trendPct}%`, insights.trend === 'down' ? 'var(--green)' : 'var(--red)'],
                ['Top Category', insights.topCategory?.name || '—', 'var(--accent-2)'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts + Suggestions */}
      {insights && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>🔔 Alerts</h3>
            {insights.alerts.length === 0 ? <p style={{ color: 'var(--green)', fontSize: '0.85rem' }}>✅ All clear! No alerts.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.alerts.map((a, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', background: a.type === 'success' ? 'rgba(16,185,129,0.08)' : a.type === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${a.type === 'success' ? 'rgba(16,185,129,0.2)' : a.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: '0.82rem', color: 'var(--text)' }}>
                    {a.message}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>💡 Suggestions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insights.suggestions.map((s, i) => (
                <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-2)', padding: '8px 0', borderBottom: i < insights.suggestions.length-1 ? '1px solid var(--border)' : 'none' }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Predictions */}
      {predictions && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>🔮 3-Month Spending Forecast</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            {predictions.forecast.map((f, i) => (
              <div key={i} style={{ flex: 1, minWidth: 140, background: 'var(--raised)', borderRadius: 'var(--r-md)', padding: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 6 }}>{f.month}</p>
                <p style={{ fontFamily: 'var(--font-d)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-2)' }}>{fmt(f.predicted)}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 4 }}>predicted</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Based on 3-month spending average of {fmt(predictions.avgMonthly)}/month</p>
        </div>
      )}

      {/* Chatbot */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 4, fontSize: '0.95rem' }}>💬 Ask Your AI Assistant</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 14 }}>Ask anything about your spending, savings, or financial habits.</p>

        {/* Quick prompts */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              style={{ padding: '5px 12px', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 20, fontSize: '0.72rem', color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent-2)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-2)'; }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ height: 320, overflow: 'auto', background: 'var(--bg-2, var(--bg))', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' ? 'var(--accent)' : 'var(--raised)',
                color: 'var(--text)', fontSize: '0.85rem', lineHeight: 1.6,
                border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {m.role === 'ai' && <span style={{ fontSize: 14, marginRight: 6 }}>🤖</span>}
                {m.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: 'flex' }}>
              <div style={{ background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', padding: '10px 16px', fontSize: 20 }}>
                <span style={{ animation: 'pulse 1s infinite' }}>●</span><span style={{ animation: 'pulse 1s 0.2s infinite' }}>●</span><span style={{ animation: 'pulse 1s 0.4s infinite' }}>●</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="Ask me anything about your finances…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={!input.trim() || chatLoading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
