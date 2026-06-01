import React from 'react';

const SEGMENT_COLS = [
  'Practice Setting', 'Specialty',
  'Segment 1', 'Segment 2', 'Segment 3', 'Segment 4', 'Segment 5',
  'Segment 6', 'Segment 7', 'Segment 8', 'Segment 9', 'Segment 10',
];

function getActiveFilters(rows) {
  return SEGMENT_COLS.filter(col =>
    rows.some(r => r[col] && r[col] !== 0 && r[col] !== '0' && String(r[col]).trim() !== '')
  );
}

function getUniqueValues(rows, col) {
  return [...new Set(rows.map(r => r[col]).filter(v => v && v !== 0 && v !== '0'))].sort();
}

export default function FilterPanel({ rows, filters, onFilterChange }) {
  const activeFilters = getActiveFilters(rows);

  const sidebarStyle = {
    width: 200, minWidth: 180, padding: '16px 12px',
    background: '#f8fafc', borderRight: '1px solid #e2e8f0',
    overflowY: 'auto',
  };

  if (activeFilters.length === 0) {
    return (
      <div style={sidebarStyle}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#334155' }}>Filters</div>
        <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5 }}>
          Filters will appear when segment data is available.
        </p>
      </div>
    );
  }

  return (
    <div style={sidebarStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Filters</span>
        {Object.keys(filters).length > 0 && (
          <button
            onClick={() => onFilterChange({})}
            style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear all
          </button>
        )}
      </div>

      {activeFilters.map(col => {
        const values = getUniqueValues(rows, col);
        const selected = filters[col] || [];
        return (
          <div key={col} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{col}</div>
            {values.map(val => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(val)}
                  onChange={() => {
                    const next = selected.includes(val)
                      ? selected.filter(v => v !== val)
                      : [...selected, val];
                    onFilterChange({ ...filters, [col]: next.length ? next : undefined });
                  }}
                />
                <span style={{ fontSize: 12, color: '#334155' }}>{val}</span>
              </label>
            ))}
          </div>
        );
      })}
    </div>
  );
}
