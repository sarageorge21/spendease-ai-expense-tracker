import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sp_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Global 401 handler
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sp_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
