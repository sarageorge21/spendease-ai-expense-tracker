import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { expensesAPI, incomeAPI, ocrAPI } from '../api/index';
import { fmt, fmtDate, CAT_ICONS, CAT_COLORS, CATEGORIES, INCOME_CATEGORIES } from '../utils/index';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';

const EMPTY_FORM = { title: '', amount: '', category: '', date: new Date().toISOString().slice(0,10), note: '', source: 'manual' };

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses]     = useState([]);
  const [income, setIncome]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showExpModal, setExpModal] = useState(false);
  const [showIncModal, setIncModal] = useState(false);
  const [showOCR, setShowOCR]       = useState(false);
  const [editExp, setEditExp]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [incForm, setIncForm]       = useState({ title: '', amount: '', category: 'Salary', date: new Date().toISOString().slice(0,10) });
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('All');
  const [saving, setSaving]         = useState(false);
  const [ocrFile, setOcrFile]       = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [expR, incR] = await Promise.all([expensesAPI.getAll(), incomeAPI.getAll()]);
      setExpenses(expR.data.data);
      setIncome(incR.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalInc = income.reduce((s, i) => s + i.amount, 0);
  const savings  = totalInc - totalExp;

  const filtered = expenses.filter(e => {
    const matchCat = catFilter === 'All' || e.category === catFilter;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAdd = () => { setEditExp(null); setForm(EMPTY_FORM); setExpModal(true); };
  const openEdit = (exp) => { setEditExp(exp); setForm({ title: exp.title, amount: exp.amount, category: exp.category, date: exp.date?.slice(0,10), note: exp.note || '', source: exp.source }); setExpModal(true); };

  const handleSaveExpense = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (editExp) await expensesAPI.update(editExp._id, form);
      else await expensesAPI.create(form);
      setExpModal(false); await load();
    } catch(err) { alert(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await expensesAPI.remove(id); load();
  };

  const handleSaveIncome = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await incomeAPI.create(incForm);
      setIncModal(false); load();
    } catch(err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleOCR = async () => {
    if (!ocrFile) return;
    setOcrLoading(true); setOcrResult(null);
    try {
      const fd = new FormData(); fd.append('receipt', ocrFile);
      const r = await ocrAPI.scan(fd);
      setOcrResult(r.data.data);
      setForm({ title: r.data.data.parsed.title || '', amount: r.data.data.parsed.amount || '', category: r.data.data.parsed.category || 'Shopping', date: new Date().toISOString().slice(0,10), note: 'From OCR scan', source: 'ocr' });
    } catch(err) { alert('OCR failed: ' + (err.response?.data?.message || err.message)); }
    finally { setOcrLoading(false); }
  };

  const applyOCR = () => { setShowOCR(false); setExpModal(true); };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Dashboard 👋 {user?.name?.split(' ')[0]}</h1>
          <p>Here's your financial overview for today</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowOCR(true)}>📸 Scan Receipt</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setIncModal(true)}>💰 Add Income</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Expense</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon="💸" label="Total Expenses" value={fmt(totalExp)} sub={`${expenses.length} transactions`} color="var(--red)" />
        <StatCard icon="💰" label="Total Income" value={fmt(totalInc)} color="var(--green)" />
        <StatCard icon="🏦" label="Net Savings" value={fmt(savings)} color={savings >= 0 ? 'var(--green)' : 'var(--red)'} sub={totalInc > 0 ? `${((savings/totalInc)*100).toFixed(1)}% savings rate` : ''} />
        <StatCard icon="📊" label="This Month" value={fmt(expenses.filter(e => new Date(e.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((s,e)=>s+e.amount,0))} color="var(--accent)" />
      </div>

      {/* Filters + Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, fontSize: '1rem', flex: 1 }}>Recent Transactions</h2>
          <input className="input" style={{ width: 200 }} placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" style={{ width: 150 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option>All</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
            <div style={{ width: 28, height: 28, border: '3px solid var(--raised)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🪙</div>
            No expenses yet — add your first one!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(exp => {
              const cat = exp.category || 'Uncategorized';
              const color = CAT_COLORS[cat] || '#64748b';
              return (
                <div key={exp._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {CAT_ICONS[cat] || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>{cat} · {fmtDate(exp.date)} {exp.source === 'ocr' ? '· 📸 OCR' : ''}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>{fmt(exp.amount)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exp)} style={{ padding: '4px 8px' }}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp._id)} style={{ padding: '4px 8px' }}>✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal open={showExpModal} onClose={() => setExpModal(false)} title={editExp ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Grocery shopping' },
            { key: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '0.00' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</label>
              <input className="input" type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required min={type==='number'?'0.01':undefined} step={type==='number'?'0.01':undefined} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Category</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Note (optional)</label>
            <input className="input" placeholder="Any notes…" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={saving}>
            {saving ? 'Saving…' : editExp ? 'Update Expense' : 'Add Expense'}
          </button>
        </form>
      </Modal>

      {/* Add Income Modal */}
      <Modal open={showIncModal} onClose={() => setIncModal(false)} title="Add Income">
        <form onSubmit={handleSaveIncome} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'title', label: 'Source', type: 'text', placeholder: 'e.g. Monthly Salary' },
            { key: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '0.00' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</label>
              <input className="input" type={type} placeholder={placeholder} value={incForm[key]} onChange={e => setIncForm(f => ({ ...f, [key]: e.target.value }))} required />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Category</label>
            <select className="input" value={incForm.category} onChange={e => setIncForm(f => ({ ...f, category: e.target.value }))}>
              {INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Date</label>
            <input className="input" type="date" value={incForm.date} onChange={e => setIncForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={saving}>
            {saving ? 'Saving…' : 'Add Income'}
          </button>
        </form>
      </Modal>

      {/* OCR Modal */}
      <Modal open={showOCR} onClose={() => { setShowOCR(false); setOcrResult(null); setOcrFile(null); }} title="📸 Scan Receipt with AI" width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Upload a receipt image and our AI will extract the expense details automatically.</p>
          <input type="file" accept="image/*" className="input" style={{ padding: '8px' }} onChange={e => setOcrFile(e.target.files[0])} />
          <button className="btn btn-primary" onClick={handleOCR} disabled={!ocrFile || ocrLoading} style={{ justifyContent: 'center' }}>
            {ocrLoading ? '🔍 Scanning…' : '🔍 Scan Receipt'}
          </button>
          {ocrResult && (
            <div style={{ background: 'var(--raised)', borderRadius: 'var(--r-md)', padding: 16, border: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>✅ Extracted Data:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['Title', ocrResult.parsed.title],
                  ['Amount', ocrResult.parsed.amount ? fmt(ocrResult.parsed.amount) : 'Not detected'],
                  ['Category', ocrResult.parsed.category],
                  ['Date', ocrResult.parsed.date || 'Not detected'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-3)', minWidth: 70 }}>{k}:</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={applyOCR}>
                Use This Data →
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
