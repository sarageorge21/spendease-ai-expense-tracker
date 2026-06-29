import api from './client';

export const expensesAPI = {
  getAll:   (params) => api.get('/expenses', { params }),
  create:   (data)   => api.post('/expenses', data),
  update:   (id, d)  => api.put(`/expenses/${id}`, d),
  remove:   (id)     => api.delete(`/expenses/${id}`),
  summary:  (params) => api.get('/expenses/summary', { params }),
};

export const incomeAPI = {
  getAll: ()     => api.get('/income'),
  create: (data) => api.post('/income', data),
  remove: (id)   => api.delete(`/income/${id}`),
};

export const budgetAPI = {
  get:  (params) => api.get('/budgets', { params }),
  save: (data)   => api.post('/budgets', data),
};

export const goalsAPI = {
  getAll: ()       => api.get('/goals'),
  create: (data)   => api.post('/goals', data),
  update: (id, d)  => api.put(`/goals/${id}`, d),
  remove: (id)     => api.delete(`/goals/${id}`),
};

export const recurringAPI = {
  getAll: ()     => api.get('/recurring'),
  create: (data) => api.post('/recurring', data),
  remove: (id)   => api.delete(`/recurring/${id}`),
};

export const aiAPI = {
  insights:    ()    => api.get('/ai/insights'),
  chat:        (msg, history) => api.post('/ai/chat', { message: msg, history }),
  predictions: ()    => api.get('/ai/predictions'),
};

export const ocrAPI = {
  scan: (formData) => api.post('/ocr/scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const reportsAPI = {
  export: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  json:   (params) => api.get('/reports/export', { params: { ...params, format: 'json' } }),
};

export const notifAPI = {
  getAll:  ()   => api.get('/notifications'),
  markRead:(id) => api.put(`/notifications/${id}/read`),
  readAll: ()   => api.put('/notifications/read-all'),
};
