export const fmt = (n, currency) => {
  const symbol = currency || localStorage.getItem('sp_currency') || '₹';
  return `${symbol}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtMonth = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export const CAT_ICONS = {
  Food: '🍔', Transport: '🚗', Shopping: '🛍️', Bills: '📄',
  Health: '💊', Entertainment: '🎬', Travel: '✈️', Education: '📚',
  Subscriptions: '📱', Salary: '💼', Freelance: '💻',
  Investments: '📈', Other: '📦', Uncategorized: '❓',
};

export const CAT_COLORS = {
  Food: '#f97316', Transport: '#3b82f6', Shopping: '#ec4899',
  Bills: '#f59e0b', Health: '#10b981', Entertainment: '#8b5cf6',
  Travel: '#06b6d4', Education: '#14b8a6', Subscriptions: '#6366f1',
  Salary: '#22c55e', Freelance: '#a3e635', Investments: '#fb923c',
  Other: '#64748b', Uncategorized: '#475569',
};

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const CATEGORIES = ['Food','Transport','Shopping','Bills','Health','Entertainment','Travel','Education','Subscriptions','Other'];
export const INCOME_CATEGORIES = ['Salary','Freelance','Investments','Business','Other'];

export const healthScoreColor = (score) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

export const healthScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 35) return 'Needs Work';
  return 'Critical';
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};
