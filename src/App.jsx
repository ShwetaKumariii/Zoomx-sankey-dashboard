import React, { useState, useEffect, useMemo } from 'react';
import { loadData } from './utils/dataLoader';
import SankeyChart from './components/SankeyChart';
import UserTab from './components/UserTab';
import FilterPanel from './components/FilterPanel';

export default function App() {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indication, setIndication] = useState('EC');
  const [activeTab, setActiveTab] = useState('sankey');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData()
      .then(({ rows }) => { setAllRows(rows); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const filteredRows = useMemo(() => {
    return allRows.filter(row =>
      Object.entries(filters).every(([col, vals]) =>
        !vals || vals.length === 0 || vals.includes(String(row[col]))
      )
    );
  }, [allRows, filters]);

  const tabStyle = active => ({
    padding: '8px 20px', cursor: 'pointer', fontWeight: active ? 700 : 400,
    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    color: active ? '#2563eb' : '#64748b', background: 'none', border: 'none',
    fontSize: 14,
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>
      Loading data…
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ef4444' }}>
      Error: {error}
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>ZoomRx</span>
        <span style={{ color: '#94a3b8', fontSize: 15 }}>Gyn DE ATU — Treatment Sequencing Dashboard</span>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e2e8f0', background: '#fff', padding: '0 16px' }}>
        <button style={tabStyle(activeTab === 'sankey')} onClick={() => setActiveTab('sankey')}>Sankey View</button>
        <button style={tabStyle(activeTab === 'user')} onClick={() => setActiveTab('user')}>User Level</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <FilterPanel rows={allRows} filters={filters} onFilterChange={setFilters} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'sankey' ? (
            <SankeyChart
              rows={filteredRows}
              indication={indication}
              onIndicationChange={setIndication}
            />
          ) : (
            <UserTab rows={filteredRows} indication={indication} />
          )}
        </div>
      </div>
    </div>
  );
}
