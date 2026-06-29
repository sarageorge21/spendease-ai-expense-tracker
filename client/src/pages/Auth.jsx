import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 },
  card: { width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '36px 32px' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, justifyContent: 'center' },
  logoMark: { width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, var(--accent), #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  title: { fontFamily: 'var(--font-d)', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginBottom: 6 },
  sub: { color: 'var(--text-2)', fontSize: '0.85rem', textAlign: 'center', marginBottom: 28 },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 },
  group: { marginBottom: 16 },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: '0.82rem', marginBottom: 16 },
  link: { color: 'var(--accent-2)', fontWeight: 500 },
  bottom: { textAlign: 'center', marginTop: 20, color: 'var(--text-2)', fontSize: '0.82rem' },
};

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-up">
        <div style={s.logo}>
          <div style={s.logoMark}>💸</div>
          <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '1.1rem' }}>Spendease Pro</span>
        </div>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>Sign in to your account</p>
        {error && <div style={s.error}>⚠ {error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div style={s.group}>
            <label style={s.label}>Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <p style={s.bottom}>Don't have an account? <Link to="/register" style={s.link}>Create one</Link></p>
        <p style={{ ...s.bottom, marginTop: 8 }}><Link to="/" style={{ color: 'var(--text-3)' }}>← Back to home</Link></p>
      </div>
    </div>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-up">
        <div style={s.logo}>
          <div style={s.logoMark}>💸</div>
          <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '1.1rem' }}>Spendease Pro</span>
        </div>
        <h1 style={s.title}>Create your account</h1>
        <p style={s.sub}>Start tracking finances intelligently</p>
        {error && <div style={s.error}>⚠ {error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Sarah George' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { key: 'password', label: 'Password (min 6 chars)', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={s.group}>
              <label style={s.label}>{label}</label>
              <input className="input" type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>
        <p style={s.bottom}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
        <p style={{ ...s.bottom, marginTop: 8 }}><Link to="/" style={{ color: 'var(--text-3)' }}>← Back to home</Link></p>
      </div>
    </div>
  );
}
