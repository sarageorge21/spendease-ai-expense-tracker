import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notifAPI } from '../../api/index';
import { fmtDate } from '../../utils/index';

export default function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await notifAPI.getAll();
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notifAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notifAPI.readAll();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.2)', color: 'var(--yellow)', icon: '⚠️' };
      case 'alert':
        return { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.2)', color: 'var(--red)', icon: '🚨' };
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.2)', color: 'var(--green)', icon: '✅' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.2)', color: 'var(--blue)', icon: 'ℹ️' };
    }
  };

  const s = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? '12px 16px' : '16px 32px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      gap: 12,
    },
    welcome: {
      fontSize: isMobile ? '0.8rem' : '0.9rem',
      fontWeight: 500,
      color: 'var(--text-2)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0,
    },
    boldName: {
      fontWeight: 700,
      color: 'var(--text)',
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '10px' : '16px',
      position: 'relative',
      flexShrink: 0,
    },
    iconBtn: {
      background: 'var(--bg-2)',
      border: '1px solid var(--border-2)',
      borderRadius: '50%',
      width: isMobile ? '36px' : '40px',
      height: isMobile ? '36px' : '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isMobile ? '16px' : '18px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: 'var(--text)',
      position: 'relative',
      flexShrink: 0,
    },
    hamburger: {
      background: 'var(--bg-2)',
      border: '1px solid var(--border-2)',
      borderRadius: 'var(--r-sm)',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      cursor: 'pointer',
      color: 'var(--text)',
      flexShrink: 0,
    },
    badge: {
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      background: 'var(--red)',
      color: '#fff',
      fontSize: '10px',
      fontWeight: 'bold',
      borderRadius: '50%',
      width: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
    },
    dropdown: {
      position: 'absolute',
      top: '50px',
      right: 0,
      width: isMobile ? 'calc(100vw - 32px)' : '320px',
      maxWidth: '320px',
      background: 'var(--surface)',
      border: '1px solid var(--border-2)',
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--shadow)',
      padding: '16px',
      zIndex: 110,
      animation: 'fadeUp 0.2s ease both',
    },
    dropdownHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: '1px solid var(--border)',
    },
    dropdownTitle: {
      fontWeight: 700,
      fontSize: '0.95rem',
      fontFamily: 'var(--font-d)',
    },
    markAllBtn: {
      background: 'transparent',
      color: 'var(--accent)',
      fontSize: '0.75rem',
      fontWeight: 600,
      cursor: 'pointer',
      padding: 0,
      border: 'none',
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxHeight: '280px',
      overflowY: 'auto',
      paddingRight: '4px',
    },
    item: {
      padding: '10px',
      borderRadius: 'var(--r-sm)',
      display: 'flex',
      gap: '10px',
      cursor: 'pointer',
      transition: 'background 0.15s',
      fontSize: '0.8rem',
      border: '1px solid transparent',
    },
    itemUnread: {
      background: 'var(--hover)',
      borderColor: 'var(--border-2)',
    },
    itemIconWrap: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontSize: '14px',
    },
    itemContent: {
      flex: 1,
      minWidth: 0,
    },
    itemTitle: {
      fontWeight: 600,
      color: 'var(--text)',
      marginBottom: '2px',
    },
    itemMsg: {
      color: 'var(--text-2)',
      lineHeight: 1.3,
      marginBottom: '4px',
      wordBreak: 'break-word',
    },
    itemTime: {
      fontSize: '0.68rem',
      color: 'var(--text-3)',
    },
    empty: {
      textAlign: 'center',
      padding: '24px 0',
      color: 'var(--text-3)',
      fontSize: '0.85rem',
    },
  };

  return (
    <header style={s.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {/* Hamburger - mobile only */}
        {isMobile && (
          <button style={s.hamburger} onClick={handleToggleSidebar} title="Menu">
            ☰
          </button>
        )}
        <div style={s.welcome}>
          Welcome back, <span style={s.boldName}>{user?.name || 'User'}</span> 👋
        </div>
      </div>

      <div style={s.actions}>
        {/* Theme Toggle */}
        <button
          style={s.iconBtn}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* Notification Bell */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            style={s.iconBtn}
            onClick={() => setIsOpen(!isOpen)}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && <div style={s.badge}>{unreadCount}</div>}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div style={s.dropdown}>
              <div style={s.dropdownHeader}>
                <span style={s.dropdownTitle}>Notifications</span>
                {unreadCount > 0 && (
                  <button style={s.markAllBtn} onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div style={s.list}>
                {notifications.length === 0 ? (
                  <div style={s.empty}>No notifications yet</div>
                ) : (
                  notifications.map(notif => {
                    const typeStyles = getTypeStyles(notif.type);
                    return (
                      <div
                        key={notif._id}
                        style={{
                          ...s.item,
                          ...(!notif.read ? s.itemUnread : {}),
                        }}
                        onClick={() => !notif.read && handleMarkRead(notif._id)}
                      >
                        <div
                          style={{
                            ...s.itemIconWrap,
                            background: typeStyles.bg,
                            border: `1px solid ${typeStyles.border}`,
                            color: typeStyles.color,
                          }}
                        >
                          {typeStyles.icon}
                        </div>
                        <div style={s.itemContent}>
                          <div style={s.itemTitle}>{notif.title}</div>
                          <div style={s.itemMsg}>{notif.message}</div>
                          <div style={s.itemTime}>{fmtDate(notif.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
