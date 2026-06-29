import React from 'react';

export default function StatCard({ icon, label, value, sub, color = 'var(--accent)', trend }) {
  return (
    <div className="card fade-up" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`badge ${trend >= 0 ? 'badge-red' : 'badge-green'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-d)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}
