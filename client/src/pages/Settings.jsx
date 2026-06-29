import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || '₹');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put('/auth/profile', { name, currency });
      if (res.data.success) {
        setUser(res.data.user);
        if (res.data.user?.currency) {
          localStorage.setItem('sp_currency', res.data.user.currency);
        }
        setSuccess('Profile updated successfully! 🎉');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put('/auth/profile', { password });
      if (res.data.success) {
        setSuccess('Password updated successfully! 🔒');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  const CURRENCIES = [
    { symbol: '₹', name: 'INR (Indian Rupee)' },
    { symbol: '$', name: 'USD (US Dollar)' },
    { symbol: '€', name: 'EUR (Euro)' },
    { symbol: '£', name: 'GBP (British Pound)' },
    { symbol: '¥', name: 'JPY (Japanese Yen)' },
    { symbol: '₣', name: 'CHF (Swiss Franc)' },
    { symbol: '₩', name: 'KRW (South Korean Won)' },
    { symbol: 'A$', name: 'AUD (Australian Dollar)' },
    { symbol: 'C$', name: 'CAD (Canadian Dollar)' },
  ];

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Settings ⚙️</h1>
        <p>Manage your account settings, currency preferences, and security details</p>
      </div>

      {error && (
        <div className="card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', marginBottom: 20, padding: '12px 20px', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="card" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: 'var(--green)', marginBottom: 20, padding: '12px 20px', fontSize: '0.875rem' }}>
          {success}
        </div>
      )}

      <div className="grid-2">
        {/* Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, margin: 0 }}>
            Profile Details
          </h2>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
                Full Name
              </label>
              <input
                className="input"
                type="text"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
                Email Address (Read-only)
              </label>
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
                Primary Currency
              </label>
              <select
                className="input"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                required
              >
                {CURRENCIES.map(cur => (
                  <option key={cur.symbol} value={cur.symbol}>
                    {cur.name} ({cur.symbol})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={updating}
              style={{ alignSelf: 'flex-start' }}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Security Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, margin: 0 }}>
            Security Settings
          </h2>

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
                New Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
                Confirm New Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={updating}
              style={{ alignSelf: 'flex-start' }}
            >
              {updating ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
