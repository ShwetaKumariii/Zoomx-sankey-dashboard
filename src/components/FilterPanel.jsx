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

export default function FilterPanel({ rows, filters, onFilterChange, accentColor = '#7c6ee6' }) {
  const activeFilters = getActiveFilters(rows);

  if (activeFilters.length === 0) {
    return (
      <p style={{ color: '#bbb', fontSize: 11, lineHeight: 1.6 }}>
        Filters will appear when segment data is available.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.keys(filters).length > 0 && (
        <button
          onClick={() => onFilterChange({})}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#ef4444', padding: 0, alignSelf: 'flex-start' }}
        >
          Clear all
        </button>
      )}
      {activeFilters.map(col => {
        const values = getUniqueValues(rows, col);
        const selected = filters[col] || [];
        return (
          <div key={col}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#777', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>{col}</div>
            {values.map(val => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ accentColor, width: 13, height: 13 }}
                  checked={selected.includes(val)}
                  onChange={() => {
                    const next = selected.includes(val)
                      ? selected.filter(v => v !== val)
                      : [...selected, val];
                    onFilterChange({ ...filters, [col]: next.length ? next : undefined });
                  }}
                />
                <span style={{ fontSize: 12, color: '#333' }}>{val}</span>
              </label>
            ))}
          </div>
        );
      })}
    </div>
  );
}
