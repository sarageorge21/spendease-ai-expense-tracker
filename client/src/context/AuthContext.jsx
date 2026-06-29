import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sp_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(r => {
          setUser(r.data.user);
          if (r.data.user?.currency) {
            localStorage.setItem('sp_currency', r.data.user.currency);
          }
        })
        .catch(() => {
          localStorage.removeItem('sp_token');
          localStorage.removeItem('sp_currency');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('sp_token', r.data.token);
    if (r.data.user?.currency) {
      localStorage.setItem('sp_currency', r.data.user.currency);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
    setUser(r.data.user);
    return r.data;
  };

  const register = async (name, email, password) => {
    const r = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('sp_token', r.data.token);
    if (r.data.user?.currency) {
      localStorage.setItem('sp_currency', r.data.user.currency);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
    setUser(r.data.user);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_currency');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
