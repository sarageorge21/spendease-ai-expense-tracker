import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard',  icon: '⊞', label: 'Dashboard' },
  { to: '/analytics',  icon: '📊', label: 'Analytics' },
  { to: '/ai',         icon: '🤖', label: 'AI Assistant' },
  { to: '/budgets',    icon: '🎯', label: 'Budgets' },
  { to: '/goals',      icon: '🏆', label: 'Goals' },
  { to: '/recurring',  icon: '🔄', label: 'Recurring' },
  { to: '/reports',    icon: '📄', label: 'Reports' },
  { to: '/settings',   icon: '⚙️', label: 'Settings' },
];

const s = {
  sidebar: {
    width: 220, minHeight: '100vh', background: 'var(--surface)',
    borderRight: '1px solid var(--border)', display: 'flex',
    flexDirection: 'column', padding: '0', position: 'sticky', top: 0,
    flexShrink: 0,
  },
  logo: {
    padding: '20px 20px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoMark: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(135deg, var(--accent), #818cf8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, boxShadow: '0 0 16px rgba(99,102,241,0.4)',
  },
  logoText: { fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '1rem' },
  logoSub: { fontSize: '0.62rem', color: 'var(--text-3)', marginTop: 1 },
  nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
    borderRadius: 'var(--r-sm)', color: 'var(--text-2)', fontSize: '0.875rem',
    fontWeight: 500, transition: 'all 0.15s', cursor: 'pointer',
  },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  bottom: { padding: '12px 10px', borderTop: '1px solid var(--border)' },
  userWrap: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 'var(--r-sm)', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--accent)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userName: { fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3 },
  userEmail: { fontSize: '0.68rem', color: 'var(--text-3)' },
  logoutBtn: {
    width: '100%', marginTop: 6, padding: '8px 12px',
    background: 'transparent', color: 'var(--text-3)', fontSize: '0.8rem',
    border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
    cursor: 'pointer', transition: 'all 0.15s',
  },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoverLogout, setHoverLogout] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Track screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for hamburger toggle from Header
  useEffect(() => {
    const handler = () => { if (isMobile) setMobileOpen(prev => !prev); };
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, [isMobile]);

  // Close on navigation (mobile)
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = () => { logout(); navigate('/'); };

  const sidebarContent = (
    <>
      <div style={s.logo}>
        <div style={s.logoMark}>💸</div>
        <div>
          <div style={s.logoText}>Spendease</div>
          <div style={s.logoSub}>AI Finance Pro</div>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--text-3)', fontSize: 20, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', border: 'none' }}
          >✕</button>
        )}
      </div>

      <nav style={s.nav}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to} to={to}
            style={({ isActive }) => ({
              ...s.navLink,
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              color: isActive ? 'var(--accent-2)' : 'var(--text-2)',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}
          >
            <span style={s.navIcon}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={s.bottom}>
        <div style={s.userWrap}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--raised)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ minWidth: 0 }}>
            <div style={s.userName}>{user?.name || 'User'}</div>
            <div style={s.userEmail}>{user?.email?.slice(0,22)}…</div>
          </div>
        </div>
        <button
          style={{ ...s.logoutBtn, color: hoverLogout ? 'var(--red)' : 'var(--text-3)', borderColor: hoverLogout ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}
          onClick={handleLogout}
          onMouseEnter={() => setHoverLogout(true)}
          onMouseLeave={() => setHoverLogout(false)}
        >
          🚪 Sign out
        </button>
      </div>
    </>
  );

  // Mobile: overlay drawer
  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998, backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside style={{
          ...s.sidebar,
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 999,
          minHeight: 'auto',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
        }}>
          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop: normal sticky sidebar
  return (
    <aside style={s.sidebar}>
      {sidebarContent}
    </aside>
  );
}
