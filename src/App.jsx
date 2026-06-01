import React, { useState, useEffect, useMemo } from 'react';
import { loadData } from './utils/dataLoader';
import { buildSankeyData } from './utils/sankeyBuilder';
import SankeyChart from './components/SankeyChart';
import UserTab from './components/UserTab';
import FilterPanel from './components/FilterPanel';
import './App.css';

const INDICATION_LABELS = { EC: 'Endometrial Cancer', OC: 'Ovarian Cancer', CC: 'Cervical Cancer' };

const DEFAULT_PALETTE = [
  '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f',
  '#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ac',
  '#d37295','#fabfd2','#8cd17d','#b6992d','#499894',
];

function assignDefaultColors(labels, existing = {}) {
  const out = { ...existing };
  labels.forEach((label, i) => {
    if (!out[label]) out[label] = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
  });
  return out;
}

export default function App() {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indication, setIndication] = useState('EC');
  const [activeTab, setActiveTab] = useState('sankey');
  const [filters, setFilters] = useState({});
  const [nodeColors, setNodeColors] = useState({});
  const [showColors, setShowColors] = useState(false);

  // Theme
  const [bgColor, setBgColor] = useState('#f5f6fa');
  const [accentColor, setAccentColor] = useState('#7c6ee6');

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

  // Get labels for current indication to show color pickers
  const { labels } = useMemo(() => buildSankeyData(filteredRows, indication), [filteredRows, indication]);

  useEffect(() => {
    if (labels.length > 0) {
      setNodeColors(prev => assignDefaultColors(labels, prev));
    }
  }, [labels]);

  const handleColorChange = (label, color) => {
    setNodeColors(prev => ({ ...prev, [label]: color }));
  };

  const resetColors = () => {
    const fresh = {};
    labels.forEach((l, i) => { fresh[l] = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]; });
    setNodeColors(fresh);
  };

  if (loading) return <div className="center-screen">Loading data…</div>;
  if (error) return <div className="center-screen" style={{ color: '#ef4444' }}>Error: {error}</div>;

  return (
    <div className="app-layout" style={{ background: bgColor }}>

      {/* Left sidebar */}
      <div className="controls-sidebar">
        <div className="brand">
          <span className="brand-dot" style={{ background: accentColor }} />
          <span className="brand-name">ZoomRx</span>
        </div>
        <div className="brand-sub">Gyn DE ATU 2026</div>

        <div className="divider" />

        {/* View */}
        <div className="section">
          <div className="section-label">📊 View</div>
          {['sankey', 'user'].map(t => (
            <button
              key={t}
              className={`pill-btn ${activeTab === t ? 'active' : ''}`}
              style={activeTab === t ? { background: accentColor + '22', borderColor: accentColor, color: accentColor } : {}}
              onClick={() => setActiveTab(t)}
            >
              {t === 'sankey' ? 'Sankey View' : 'User Level'}
            </button>
          ))}
        </div>

        <div className="divider" />

        {/* Indication */}
        <div className="section">
          <div className="section-label">🔬 Indication</div>
          {Object.entries(INDICATION_LABELS).map(([k, v]) => (
            <label key={k} className="radio-row">
              <input
                type="radio" name="indication" value={k}
                checked={indication === k}
                onChange={() => setIndication(k)}
                style={{ accentColor }}
              />
              <span>{v}</span>
              <span className="chip" style={{ background: accentColor + '22', color: accentColor }}>{k}</span>
            </label>
          ))}
        </div>

        <div className="divider" />

        {/* Segment Filters */}
        <div className="section">
          <div className="section-label">⚙️ Filters</div>
          <FilterPanel rows={allRows} filters={filters} onFilterChange={setFilters} accentColor={accentColor} />
        </div>

        <div className="divider" />

        {/* Node Colors */}
        <div className="section">
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🎨 Node Colors</span>
            <button className="link-btn" onClick={() => setShowColors(v => !v)}>
              {showColors ? 'Hide' : 'Edit'}
            </button>
          </div>
          {showColors && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {labels.length === 0 && (
                <p style={{ fontSize: 11, color: '#aaa' }}>No nodes yet — select an indication.</p>
              )}
              {labels.map(label => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={nodeColors[label] || '#cccccc'}
                    onChange={e => handleColorChange(label, e.target.value)}
                    style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <span style={{ fontSize: 12, color: '#333', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {label}
                  </span>
                </div>
              ))}
              {labels.length > 0 && (
                <button className="link-btn" style={{ marginTop: 4 }} onClick={resetColors}>Reset defaults</button>
              )}
            </div>
          )}
          {!showColors && labels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {labels.map(l => (
                <div key={l} style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: nodeColors[l] || '#ccc',
                  title: l,
                }} title={l} />
              ))}
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Dashboard Theme */}
        <div className="section">
          <div className="section-label">🖌️ Theme</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
              <span style={{ fontSize: 12, color: '#555' }}>Background</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
              <span style={{ fontSize: 12, color: '#555' }}>Accent color</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right content */}
      <div className="main-content">
        {/* Top header strip */}
        <div className="main-header" style={{ borderLeft: `4px solid ${accentColor}` }}>
          <div>
            <div className="main-title">
              {activeTab === 'sankey' ? 'Treatment Sequencing — Sankey' : 'User Level Data'}
            </div>
            <div className="main-sub">
              {INDICATION_LABELS[indication]} · {filteredRows.length} respondents
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(INDICATION_LABELS).map(([k]) => (
              <button
                key={k}
                onClick={() => setIndication(k)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${indication === k ? accentColor : '#ddd'}`,
                  background: indication === k ? accentColor : '#fff',
                  color: indication === k ? '#fff' : '#555',
                  cursor: 'pointer',
                }}
              >{k}</button>
            ))}
          </div>
        </div>

        <div className="content-card">
          {activeTab === 'sankey' ? (
            <SankeyChart rows={filteredRows} indication={indication} nodeColors={nodeColors} accentColor={accentColor} />
          ) : (
            <UserTab rows={filteredRows} indication={indication} accentColor={accentColor} />
          )}
        </div>
      </div>
    </div>
  );
}
