import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { expensesAPI } from '../api/index';
import { fmt, MONTHS, CAT_COLORS } from '../utils/index';
import StatCard from '../components/common/StatCard';

Chart.register(...registerables);

function useChart(ref, config) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    const chart = new Chart(ctx, config);
    return () => chart.destroy();
  }, [config]);
}

export default function Analytics() {
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [year, setYear]         = useState(new Date().getFullYear());
  const barRef  = useRef(null);
  const pieRef  = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    expensesAPI.summary({ year })
      .then(r => setSummary(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  // Build month array (12 months)
  const monthlyData = Array(12).fill(0);
  summary?.byMonth?.forEach(m => { monthlyData[m._id.month - 1] = m.total; });

  const catLabels  = summary?.byCategory?.map(c => c._id) || [];
  const catAmounts = summary?.byCategory?.map(c => c.total) || [];
  const catColors  = catLabels.map(l => CAT_COLORS[l] || '#64748b');

  const chartDefaults = {
    plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } } },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b', font: { size: 11 }, callback: v => `₹${(v/1000).toFixed(0)}k` }, grid: { color: 'rgba(255,255,255,0.04)' } },
    }
  };

  const barConfig = {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [{ label: 'Monthly Spending', data: monthlyData, backgroundColor: 'rgba(99,102,241,0.7)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 6 }],
    },
    options: { ...chartDefaults, responsive: true, plugins: { ...chartDefaults.plugins, title: { display: false } } },
  };

  const pieConfig = {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{ data: catAmounts, backgroundColor: catColors, borderColor: '#0a0e1a', borderWidth: 2, hoverOffset: 8 }],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 14 } } },
    },
  };

  const lineConfig = {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [{
        label: 'Spending Trend',
        data: monthlyData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
      }],
    },
    options: { ...chartDefaults, responsive: true },
  };

  useChart(barRef, barConfig);
  useChart(pieRef, pieConfig);
  useChart(lineRef, lineConfig);

  const grandTotal = summary?.grandTotal || 0;
  const avgMonthly = monthlyData.filter(v => v > 0).length > 0
    ? monthlyData.reduce((s,v)=>s+v,0) / monthlyData.filter(v=>v>0).length
    : 0;
  const peakMonth = MONTHS[monthlyData.indexOf(Math.max(...monthlyData))];
  const topCat    = summary?.byCategory?.[0];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>Analytics 📊</h1>
          <p>Visual breakdown of your spending patterns</p>
        </div>
        <select className="input" style={{ width: 110 }} value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon="💸" label="Total Spent" value={fmt(grandTotal)} color="var(--red)" />
        <StatCard icon="📅" label="Avg / Month" value={fmt(avgMonthly)} color="var(--accent)" />
        <StatCard icon="📈" label="Peak Month" value={peakMonth || '—'} color="var(--yellow)" />
        <StatCard icon="🏆" label="Top Category" value={topCat?._id || '—'} sub={topCat ? fmt(topCat.total) : ''} color="var(--purple)" />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--raised)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading analytics…
        </div>
      ) : (
        <>
          {/* Bar + Line */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>Monthly Spending — {year}</h3>
              <canvas ref={barRef} />
            </div>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>Spending Trend</h3>
              <canvas ref={lineRef} />
            </div>
          </div>

          {/* Pie + Category Table */}
          <div className="grid-2">
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>Category Breakdown</h3>
              {catLabels.length === 0 ? <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: 40 }}>No data</p> : <canvas ref={pieRef} />}
            </div>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>Category Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(summary?.byCategory || []).map(({ _id: cat, total, count }) => {
                  const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : 0;
                  const color = CAT_COLORS[cat] || '#64748b';
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 500 }}>{cat} <span style={{ color: 'var(--text-3)' }}>({count})</span></span>
                        <span style={{ color, fontWeight: 600 }}>{fmt(total)} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>· {pct}%</span></span>
                      </div>
                      <div style={{ height: 6, background: 'var(--raised)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
                {(summary?.byCategory || []).length === 0 && <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: 20 }}>No expenses yet</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
