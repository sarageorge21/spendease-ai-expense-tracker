import React, { useState, useEffect, useCallback } from 'react';
import { budgetAPI, goalsAPI, recurringAPI, reportsAPI, expensesAPI } from '../api/index';
import { fmt, fmtDate, CATEGORIES, downloadBlob } from '../utils/index';
import Modal from '../components/common/Modal';

// ── BUDGETS ───────────────────────────────────────────────────
export function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year]  = useState(now.getFullYear());
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [catName, setCatName] = useState(''); const [catLimit, setCatLimit] = useState('');
  const [totalLimit, setTotalLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [br, sr] = await Promise.all([
      budgetAPI.get({ month, year }),
      expensesAPI.summary({ year }),
    ]);
    setBudget(br.data.data);
    setSummary(sr.data.data);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const actualByCategory = {};
  summary?.byCategory?.forEach(c => { actualByCategory[c._id] = c.total; });

  const addCat = () => {
    if (!catName || !catLimit) return;
    const cats = [...(budget?.categories || []).filter(c => c.name !== catName), { name: catName, limit: parseFloat(catLimit), spent: actualByCategory[catName] || 0 }];
    setBudget(b => ({ ...b, categories: cats }));
    setCatName(''); setCatLimit('');
  };

  const save = async () => {
    setSaving(true);
    await budgetAPI.save({ month, year, total: parseFloat(totalLimit) || 0, categories: budget?.categories || [] });
    setSaving(false); load();
  };

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div><h1>Budgets 🎯</h1><p>Set and track monthly spending limits</p></div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select className="input" style={{ width:110 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Budget'}</button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-d)', fontWeight:600, marginBottom:16, fontSize:'0.95rem' }}>Monthly Total Limit</h3>
          <input className="input" type="number" placeholder="e.g. 50000" value={totalLimit} onChange={e => setTotalLimit(e.target.value)} style={{ marginBottom:10 }} />
          {budget?.total > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:6 }}>
                <span style={{ color:'var(--text-2)' }}>Spent</span>
                <span>{fmt(Object.values(actualByCategory).reduce((s,v)=>s+v,0))} / {fmt(budget.total)}</span>
              </div>
              <div style={{ height:8, background:'var(--raised)', borderRadius:4 }}>
                <div style={{ height:'100%', width:`${Math.min(100, (Object.values(actualByCategory).reduce((s,v)=>s+v,0)/budget.total)*100)}%`, background: Object.values(actualByCategory).reduce((s,v)=>s+v,0) > budget.total ? 'var(--red)' : 'var(--green)', borderRadius:4, transition:'width 0.8s ease' }} />
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily:'var(--font-d)', fontWeight:600, marginBottom:16, fontSize:'0.95rem' }}>Add Category Budget</h3>
          <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <select className="input" style={{ flex:1 }} value={catName} onChange={e => setCatName(e.target.value)}>
              <option value="">Category…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input className="input" type="number" placeholder="Limit ₹" style={{ width:120 }} value={catLimit} onChange={e => setCatLimit(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={addCat}>Add</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily:'var(--font-d)', fontWeight:600, marginBottom:16, fontSize:'0.95rem' }}>Category Budgets vs Actual</h3>
        {(budget?.categories || []).length === 0 ? (
          <p style={{ color:'var(--text-3)', textAlign:'center', padding:32 }}>No category budgets set yet</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {(budget?.categories || []).map(cat => {
              const actual = actualByCategory[cat.name] || 0;
              const pct = Math.min(100, (actual / cat.limit) * 100);
              const over = actual > cat.limit;
              return (
                <div key={cat.name}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontWeight:500, fontSize:'0.875rem' }}>{cat.name}</span>
                    <span style={{ fontSize:'0.82rem', color: over ? 'var(--red)' : 'var(--text-2)' }}>
                      {fmt(actual)} / {fmt(cat.limit)} {over && '⚠ Over!'}
                    </span>
                  </div>
                  <div style={{ height:8, background:'var(--raised)', borderRadius:4 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: over ? 'var(--red)' : pct > 80 ? 'var(--yellow)' : 'var(--green)', borderRadius:4, transition:'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── GOALS ─────────────────────────────────────────────────────
export function Goals() {
  const [goals, setGoals] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ title:'', targetAmount:'', savedAmount:'', icon:'🎯', deadline:'' });
  const [saving, setSaving] = useState(false);

  const load = () => goalsAPI.getAll().then(r => setGoals(r.data.data));
  useEffect(() => { load(); }, []);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try { await goalsAPI.create(form); setModal(false); load(); }
    catch(err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const contribute = async (goal) => {
    const amt = parseFloat(prompt(`Add amount to "${goal.title}" (currently ${fmt(goal.savedAmount)}):`));
    if (!amt || isNaN(amt)) return;
    await goalsAPI.update(goal._id, { savedAmount: Math.min(goal.savedAmount + amt, goal.targetAmount), status: goal.savedAmount + amt >= goal.targetAmount ? 'completed' : 'active' });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this goal?')) return;
    await goalsAPI.remove(id); load();
  };

  const ICONS = ['🎯','🚗','🏠','💻','✈️','📱','🎓','💍','🏖️','💰'];

  return (
    <div>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between' }}>
        <div><h1>Savings Goals 🏆</h1><p>Track progress towards your financial goals</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ New Goal</button>
      </div>

      {goals.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:60, color:'var(--text-3)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏆</div>
          <p>No goals yet — create your first savings goal!</p>
        </div>
      ) : (
        <div className="grid-3">
          {goals.map(g => {
            const pct = Math.min(100, (g.savedAmount / g.targetAmount) * 100);
            const remaining = g.targetAmount - g.savedAmount;
            return (
              <div key={g._id} className="card fade-up" style={{ position:'relative' }}>
                {g.status === 'completed' && <div style={{ position:'absolute', top:12, right:12 }}><span className="badge badge-green">✓ Done</span></div>}
                <div style={{ fontSize:32, marginBottom:10 }}>{g.icon}</div>
                <h3 style={{ fontFamily:'var(--font-d)', fontWeight:600, marginBottom:4 }}>{g.title}</h3>
                <p style={{ fontSize:'0.75rem', color:'var(--text-3)', marginBottom:12 }}>
                  {g.deadline ? `Target: ${fmtDate(g.deadline)}` : 'No deadline'}
                </p>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:6 }}>
                  <span style={{ color:'var(--green)', fontWeight:600 }}>{fmt(g.savedAmount)}</span>
                  <span style={{ color:'var(--text-3)' }}>of {fmt(g.targetAmount)}</span>
                </div>
                <div style={{ height:8, background:'var(--raised)', borderRadius:4, marginBottom:10 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg, var(--accent), var(--green))', borderRadius:4, transition:'width 1s ease' }} />
                </div>
                <p style={{ fontSize:'0.72rem', color:'var(--text-3)', marginBottom:14 }}>{pct.toFixed(1)}% complete · {fmt(remaining)} to go</p>
                <div style={{ display:'flex', gap:6 }}>
                  {g.status !== 'completed' && <button className="btn btn-primary btn-sm" onClick={() => contribute(g)}>+ Add</button>}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(g._id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Savings Goal">
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Goal Name</label>
            <input className="input" placeholder="e.g. New MacBook" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} required />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Target Amount (₹)</label>
            <input className="input" type="number" placeholder="100000" value={form.targetAmount} onChange={e => setForm(f=>({...f,targetAmount:e.target.value}))} required />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Already Saved (₹)</label>
            <input className="input" type="number" placeholder="0" value={form.savedAmount} onChange={e => setForm(f=>({...f,savedAmount:e.target.value}))} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Icon</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {ICONS.map(ic => <button key={ic} type="button" onClick={() => setForm(f=>({...f,icon:ic}))} style={{ fontSize:20, padding:'6px 10px', borderRadius:8, background: form.icon===ic ? 'var(--accent-glow)' : 'var(--raised)', border: form.icon===ic ? '1px solid var(--accent)' : '1px solid var(--border)', cursor:'pointer' }}>{ic}</button>)}
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Deadline (optional)</label>
            <input className="input" type="date" value={form.deadline} onChange={e => setForm(f=>({...f,deadline:e.target.value}))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent:'center' }} disabled={saving}>{saving?'Creating…':'Create Goal'}</button>
        </form>
      </Modal>
    </div>
  );
}

// ── RECURRING ─────────────────────────────────────────────────
export function Recurring() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ title:'', amount:'', category:'Subscriptions', frequency:'monthly', nextDue:new Date().toISOString().slice(0,10) });
  const [saving, setSaving] = useState(false);

  const load = () => recurringAPI.getAll().then(r => setItems(r.data.data));
  useEffect(() => { load(); }, []);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try { await recurringAPI.create(form); setModal(false); load(); }
    catch(err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Remove?')) return; await recurringAPI.remove(id); load(); };
  const totalMonthly = items.reduce((s,i) => s + (i.frequency==='monthly'?i.amount:i.frequency==='yearly'?i.amount/12:i.frequency==='weekly'?i.amount*4.3:i.amount*30), 0);

  return (
    <div>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between' }}>
        <div><h1>Recurring Expenses 🔄</h1><p>Subscriptions and regular bills</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Recurring</button>
      </div>

      <div className="card" style={{ marginBottom:20, display:'flex', gap:24, flexWrap:'wrap' }}>
        <div><p style={{ fontSize:'0.72rem', color:'var(--text-3)', marginBottom:4 }}>MONTHLY TOTAL</p><p style={{ fontFamily:'var(--font-d)', fontSize:'1.4rem', fontWeight:700, color:'var(--red)' }}>{fmt(totalMonthly)}</p></div>
        <div><p style={{ fontSize:'0.72rem', color:'var(--text-3)', marginBottom:4 }}>ANNUAL COST</p><p style={{ fontFamily:'var(--font-d)', fontSize:'1.4rem', fontWeight:700 }}>{fmt(totalMonthly*12)}</p></div>
        <div><p style={{ fontSize:'0.72rem', color:'var(--text-3)', marginBottom:4 }}>SUBSCRIPTIONS</p><p style={{ fontFamily:'var(--font-d)', fontSize:'1.4rem', fontWeight:700 }}>{items.length}</p></div>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:60, color:'var(--text-3)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔄</div>
          <p>No recurring expenses yet</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map(item => {
            const dueDate = new Date(item.nextDue);
            const daysLeft = Math.ceil((dueDate - new Date()) / (1000*60*60*24));
            return (
              <div key={item._id} className="card" style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:500, marginBottom:2 }}>{item.title}</p>
                  <p style={{ fontSize:'0.72rem', color:'var(--text-3)' }}>{item.category} · {item.frequency}</p>
                </div>
                <div style={{ textAlign:'right', marginRight:16 }}>
                  <p style={{ fontFamily:'var(--font-d)', fontWeight:700 }}>{fmt(item.amount)}</p>
                  <p style={{ fontSize:'0.72rem', color: daysLeft <= 3 ? 'var(--red)' : 'var(--text-3)' }}>
                    {daysLeft <= 0 ? '⚠ Due now' : `Due in ${daysLeft}d`}
                  </p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => remove(item._id)}>Remove</button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Recurring Expense">
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { key:'title', label:'Name', type:'text', placeholder:'e.g. Netflix' },
            { key:'amount', label:'Amount (₹)', type:'number', placeholder:'499' },
          ].map(({ key,label,type,placeholder }) => (
            <div key={key}>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>{label}</label>
              <input className="input" type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} required />
            </div>
          ))}
          <div>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Frequency</label>
            <select className="input" value={form.frequency} onChange={e => setForm(f=>({...f,frequency:e.target.value}))}>
              {['daily','weekly','monthly','yearly'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Next Due Date</label>
            <input className="input" type="date" value={form.nextDue} onChange={e => setForm(f=>({...f,nextDue:e.target.value}))} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent:'center' }} disabled={saving}>{saving?'Adding…':'Add Recurring'}</button>
        </form>
      </Modal>
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────
export function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const r = await reportsAPI.json({ month, year });
      setReport(r.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReport(); }, [month]);

  const downloadCSV = async () => {
    setDownloading(true);
    try {
      const r = await reportsAPI.export({ month, year, format:'csv' });
      downloadBlob(r.data, `spendease_${year}_${month}.csv`);
    } catch(e) { alert('Download failed'); }
    finally { setDownloading(false); }
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div><h1>Reports 📄</h1><p>Export and analyse your financial data</p></div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select className="input" style={{ width:110 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m} {year}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={loadReport} disabled={loading}>{loading?'Loading…':'🔄 Refresh'}</button>
          <button className="btn btn-primary btn-sm" onClick={downloadCSV} disabled={downloading}>{downloading?'Downloading…':'⬇ Download CSV'}</button>
        </div>
      </div>

      {report && (
        <>
          <div className="grid-4" style={{ marginBottom:20 }}>
            {[
              { label:'Total Income', value:fmt(report.totalIncome), color:'var(--green)' },
              { label:'Total Expenses', value:fmt(report.totalExpenses), color:'var(--red)' },
              { label:'Net Savings', value:fmt(report.savings), color: report.savings>=0?'var(--green)':'var(--red)' },
              { label:'Savings Rate', value:`${report.savingsRate}%`, color:'var(--accent-2)' },
            ].map(({ label,value,color }) => (
              <div key={label} className="card">
                <p style={{ fontSize:'0.68rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</p>
                <p style={{ fontFamily:'var(--font-d)', fontSize:'1.4rem', fontWeight:700, color }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ fontFamily:'var(--font-d)', fontWeight:600, marginBottom:14, fontSize:'0.95rem' }}>Spending by Category</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {Object.entries(report.categoryBreakdown || {}).sort((a,b)=>b[1]-a[1]).map(([cat,amt]) => (
                  <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:'0.82rem' }}>
                    <span style={{ color:'var(--text-2)' }}>{cat}</span>
                    <span style={{ fontWeight:600 }}>{fmt(amt)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontFamily:'var(--font-d)', fontWeight:600, marginBottom:14, fontSize:'0.95rem' }}>Recent Transactions ({report.expenseCount})</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:320, overflow:'auto' }}>
                {(report.expenses || []).slice(0,15).map(e => (
                  <div key={e._id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:'0.78rem' }}>
                    <div>
                      <p style={{ fontWeight:500 }}>{e.title}</p>
                      <p style={{ color:'var(--text-3)', fontSize:'0.68rem' }}>{e.category} · {fmtDate(e.date)}</p>
                    </div>
                    <span style={{ color:'var(--red)', fontWeight:600 }}>{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
