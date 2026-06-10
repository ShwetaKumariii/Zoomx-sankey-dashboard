import React, { useState, useEffect, useMemo } from 'react';
import { loadData } from './utils/dataLoader';
import { buildSankeyData } from './utils/sankeyBuilder';
import SankeyChart from './components/SankeyChart';
import UserTab from './components/UserTab';
import FilterPanel from './components/FilterPanel';
import './App.css';

const INDICATION_LABELS = { EC: 'Endometrial Cancer', OC: 'Ovarian Cancer', CC: 'Cervical Cancer' };
const FONT_FAMILIES = ['Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Courier New', 'Times New Roman'];

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

function SliderRow({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: '#666' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#7c6ee6', cursor: 'pointer' }} />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: '#444' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10, background: checked ? '#7c6ee6' : '#d0d5dd',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: checked ? 18 : 3,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </label>
  );
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

  // Chart configuration
  const [chartTitle, setChartTitle] = useState('Sankey Flow Diagram');
  const [showLabels, setShowLabels] = useState(true);
  const [cleanMode, setCleanMode] = useState(false);
  const [nodeBorders, setNodeBorders] = useState(false);
  const [showNodes, setShowNodes] = useState(true);
  const [hoverValue, setHoverValue] = useState('n');
  const [flowOpacity, setFlowOpacity] = useState(0.35);
  const [nodeThickness, setNodeThickness] = useState(20);
  const [nodePadding, setNodePadding] = useState(20);
  const [labelFontSize, setLabelFontSize] = useState(12);
  const [labelFontFamily, setLabelFontFamily] = useState('Arial');
  const [chartHeight, setChartHeight] = useState(460);
  const [defaultNodeColor, setDefaultNodeColor] = useState('#7c6ee6');

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

  const { labels: allLabels } = useMemo(() => buildSankeyData(filteredRows, indication), [filteredRows, indication]);
  const labels = useMemo(() => [...new Set(allLabels)], [allLabels]);

  useEffect(() => {
    if (labels.length > 0) setNodeColors(prev => assignDefaultColors(labels, prev));
  }, [labels]);

  const resetConfig = () => {
    setChartTitle('Sankey Flow Diagram');
    setShowLabels(true);
    setCleanMode(false);
    setNodeBorders(false);
    setShowNodes(true);
    setHoverValue('n');
    setFlowOpacity(0.35);
    setNodeThickness(20);
    setNodePadding(20);
    setLabelFontSize(12);
    setLabelFontFamily('Arial');
    setChartHeight(460);
    setDefaultNodeColor('#7c6ee6');
  };

  const resetColors = () => {
    const fresh = {};
    labels.forEach((l, i) => { fresh[l] = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]; });
    setNodeColors(fresh);
  };

  const chartConfig = {
    chartTitle, showLabels, cleanMode, nodeBorders,
    showNodes, hoverValue, flowOpacity, nodeThickness, nodePadding,
    labelFontSize, labelFontFamily, chartHeight, defaultNodeColor,
  };

  if (loading) return <div className="center-screen">Loading data…</div>;
  if (error) return <div className="center-screen" style={{ color: '#ef4444' }}>Error: {error}</div>;

  return (
    <div className="app-layout" style={{ background: bgColor }}>

      {/* ── Left sidebar ── */}
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
            <button key={t}
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
              <input type="radio" name="indication" value={k}
                checked={indication === k} onChange={() => setIndication(k)}
                style={{ accentColor }} />
              <span>{v}</span>
              <span className="chip" style={{ background: accentColor + '22', color: accentColor }}>{k}</span>
            </label>
          ))}
        </div>

        <div className="divider" />

        {/* Filters */}
        <div className="section">
          <div className="section-label">🗂️ Filters</div>
          <FilterPanel rows={allRows} filters={filters} onFilterChange={setFilters} accentColor={accentColor} />
        </div>

        <div className="divider" />

        {/* Chart Configuration */}
        <div className="section">
          <div className="section-label">⚙️ Chart Configuration</div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>Chart Title</div>
            <input
              type="text" value={chartTitle}
              onChange={e => setChartTitle(e.target.value)}
              style={{
                width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #ddd',
                borderRadius: 6, outline: 'none', color: '#333',
              }}
            />
          </div>

          <Toggle label="Show Labels" checked={showLabels} onChange={setShowLabels} />
          <Toggle label="Clean Mode" checked={cleanMode} onChange={setCleanMode} />
          <Toggle label="Show Nodes" checked={showNodes} onChange={setShowNodes} />

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Hover Value</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ val: 'n', label: 'Count (n)' }, { val: '%', label: 'Percent (%)' }].map(opt => (
                <button key={opt.val} onClick={() => setHoverValue(opt.val)} style={{
                  flex: 1, padding: '4px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${hoverValue === opt.val ? accentColor : '#ddd'}`,
                  borderRadius: 8,
                  background: hoverValue === opt.val ? accentColor + '18' : '#fff',
                  color: hoverValue === opt.val ? accentColor : '#888',
                }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <SliderRow label="Flow Opacity" value={flowOpacity} min={0.05} max={1} step={0.05} onChange={setFlowOpacity} />
          <SliderRow label="Node Thickness" value={nodeThickness} min={1} max={50} onChange={setNodeThickness} unit="px" />
          <SliderRow label="Node Padding" value={nodePadding} min={0} max={60} onChange={setNodePadding} unit="px" />
          <SliderRow label="Label Font Size" value={labelFontSize} min={8} max={20} onChange={setLabelFontSize} unit="px" />
          <SliderRow label="Chart Height" value={chartHeight} min={300} max={800} step={10} onChange={setChartHeight} unit="px" />

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>Label Font Family</div>
            <select value={labelFontFamily} onChange={e => setLabelFontFamily(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 6, color: '#333', background: '#fff' }}>
              {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={defaultNodeColor} onChange={e => setDefaultNodeColor(e.target.value)}
              style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
            <span style={{ fontSize: 11, color: '#666' }}>Default Node Color</span>
          </div>

          <button className="link-btn" onClick={resetConfig} style={{ marginTop: 8, color: '#ef4444' }}>
            Reset to defaults
          </button>
        </div>

        <div className="divider" />

        {/* Node Colors */}
        <div className="section">
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🎨 Node Colors</span>
            <button className="link-btn" onClick={() => setShowColors(v => !v)}>{showColors ? 'Hide' : 'Edit'}</button>
          </div>
          {showColors ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {labels.length === 0 && <p style={{ fontSize: 11, color: '#aaa' }}>No nodes yet.</p>}
              {labels.map(label => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={nodeColors[label] || '#cccccc'}
                    onChange={e => setNodeColors(prev => ({ ...prev, [label]: e.target.value }))}
                    style={{ width: 26, height: 26, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 0 }} />
                  <span style={{ fontSize: 11, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
              ))}
              {labels.length > 0 && <button className="link-btn" onClick={resetColors}>Reset defaults</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {labels.map(l => <div key={l} title={l} style={{ width: 14, height: 14, borderRadius: 3, background: nodeColors[l] || defaultNodeColor }} />)}
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Theme */}
        <div className="section" style={{ marginBottom: 20 }}>
          <div className="section-label">🖌️ Theme</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
              <span style={{ fontSize: 11, color: '#666' }}>Background</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
              <span style={{ fontSize: 11, color: '#666' }}>Accent color</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right content ── */}
      <div className="main-content">
        <div className="main-header" style={{ borderLeft: `4px solid ${accentColor}` }}>
          <div>
            <div className="main-title">{chartTitle || 'Treatment Sequencing — Sankey'}</div>
            <div className="main-sub">{INDICATION_LABELS[indication]} · {filteredRows.length} respondents</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(INDICATION_LABELS).map(([k]) => (
              <button key={k} onClick={() => setIndication(k)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${indication === k ? accentColor : '#ddd'}`,
                background: indication === k ? accentColor : '#fff',
                color: indication === k ? '#fff' : '#555', cursor: 'pointer',
              }}>{k}</button>
            ))}
          </div>
        </div>

        <div className="content-card">
          {activeTab === 'sankey' ? (
            <SankeyChart
              rows={filteredRows}
              indication={indication}
              nodeColors={nodeColors}
              accentColor={accentColor}
              config={chartConfig}
            />
          ) : (
            <UserTab rows={filteredRows} indication={indication} accentColor={accentColor} />
          )}
        </div>
      </div>
    </div>
  );
}
