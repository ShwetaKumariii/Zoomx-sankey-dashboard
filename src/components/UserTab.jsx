import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

const INDICATION_LABELS = { EC: 'Endometrial Cancer', OC: 'Ovarian Cancer', CC: 'Cervical Cancer' };

const LOT_COLS = {
  EC: ['Q6_20Z_EC_1L', 'Q6_20Z_EC_2L', 'Q6_20Z_EC_3L'],
  OC: ['Q6_20Z_OC_1L', 'Q6_20Z_OC_2L', 'Q6_20Z_OC_3L'],
  CC: ['Q6_20Z_CC_1L', 'Q6_20Z_CC_2L', 'Q6_20Z_CC_3L'],
};

const OTHER_COLS = {
  EC: ['Q6_20Z_OTHER_EC_A1', 'Q6_20Z_OTHER_EC_A2', 'Q6_20Z_OTHER_EC_A3'],
  OC: ['Q6_20Z_OTHER_OC_A1', 'Q6_20Z_OTHER_OC_A2', 'Q6_20Z_OTHER_OC_A3'],
  CC: ['Q6_20Z_OTHER_CC_A1', 'Q6_20Z_OTHER_CC_A2', 'Q6_20Z_OTHER_CC_A3'],
};

const SEGMENT_COLS = [
  'Practice Setting', 'Specialty',
  'Segment 1', 'Segment 2', 'Segment 3', 'Segment 4', 'Segment 5',
  'Segment 6', 'Segment 7', 'Segment 8', 'Segment 9', 'Segment 10',
];

const REASON_COLS = {
  EC: 'Q6_30Z_EC',
  OC: 'Q6_30Z_OC',
  CC: 'Q6_30Z_CC',
};

function formatDate(val) {
  if (!val) return '';
  const n = Number(val);
  if (!isNaN(n) && n > 40000) {
    // Excel serial date → JS Date (Excel epoch offset + leap year bug)
    const d = new Date((n - 25569) * 86400 * 1000);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return String(val).split(' ')[0];
}

function formatTime(seconds) {
  if (!seconds || isNaN(Number(seconds))) return '';
  return (Number(seconds) / 60).toFixed(1) + ' min';
}

function topSequence(rows, indication) {
  const [l1, l2, l3] = LOT_COLS[indication];
  const counts = {};
  rows.forEach(r => {
    const seq = [r[l1], r[l2], r[l3]].filter(Boolean).join(' → ');
    if (seq) counts[seq] = (counts[seq] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (n=${top[1]})` : '—';
}

function topLOT2Switch(rows, indication) {
  const [l1, l2] = LOT_COLS[indication];
  const counts = {};
  rows.forEach(r => {
    if (r[l1] && r[l2] && r[l1] !== r[l2]) {
      const k = `${r[l1]} → ${r[l2]}`;
      counts[k] = (counts[k] || 0) + 1;
    }
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (n=${top[1]})` : '—';
}

function pctLOT3(rows, indication) {
  const [l1, , l3] = LOT_COLS[indication];
  const withL1 = rows.filter(r => r[l1]).length;
  const withL3 = rows.filter(r => r[l3]).length;
  if (!withL1) return '—';
  return `${((withL3 / withL1) * 100).toFixed(1)}%`;
}

export default function UserTab({ rows, indication, accentColor = '#7c6ee6' }) {
  const [l1, l2, l3] = LOT_COLS[indication];
  const [o1, o2, o3] = OTHER_COLS[indication];
  const reasonCol = REASON_COLS[indication];

  // Column search state: { LOT1: '', LOT2: '', LOT3: '', ... }
  const [colSearch, setColSearch] = useState({});

  const displayRows = useMemo(() => {
    return rows.filter(row => {
      if (colSearch['LOT1'] && !(row[l1] || '').toLowerCase().includes(colSearch['LOT1'].toLowerCase())) return false;
      if (colSearch['LOT2'] && !(row[l2] || '').toLowerCase().includes(colSearch['LOT2'].toLowerCase())) return false;
      if (colSearch['LOT3'] && !(row[l3] || '').toLowerCase().includes(colSearch['LOT3'].toLowerCase())) return false;
      return true;
    });
  }, [rows, colSearch, l1, l2, l3]);

  function downloadExcel() {
    const data = displayRows.map(r => ({
      Id: r['Id'],
      'Completion Date': formatDate(r['End Date Users Tz']),
      'Time Taken': formatTime(r['Time Taken']),
      LOT1: r[l1] || '',
      LOT2: r[l2] || '',
      LOT3: r[l3] || '',
      'Other A1': r[o1] || '',
      'Other A2': r[o2] || '',
      'Other A3': r[o3] || '',
      'Reason for Sequencing': r[reasonCol] || '',
      ...Object.fromEntries(SEGMENT_COLS.map(s => [s, r[s] && r[s] !== 0 && r[s] !== '0' ? r[s] : ''])),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Level');
    XLSX.writeFile(wb, `UserLevel_${indication}.xlsx`);
  }

  const insights = [
    { label: 'Most common sequence', value: topSequence(rows, indication), icon: '🔗' },
    { label: 'Most common LOT2 switch', value: topLOT2Switch(rows, indication), icon: '🔄' },
    { label: '% reached LOT3', value: pctLOT3(rows, indication), icon: '📈' },
  ];

  const th = { padding: '8px 12px', background: '#f8f9fb', fontWeight: 600, fontSize: 12, color: '#555', borderBottom: '2px solid #eaecf0', whiteSpace: 'nowrap', textAlign: 'left' };
  const td = { padding: '7px 12px', fontSize: 12, color: '#333', borderBottom: '1px solid #f0f1f3', whiteSpace: 'nowrap' };
  const tdReason = {
    padding: '7px 12px', fontSize: 12, color: '#333', borderBottom: '1px solid #f0f1f3',
    maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default',
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Insight cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        {insights.map(card => (
          <div key={card.label} style={{
            flex: 1, background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}06)`,
            border: `1px solid ${accentColor}30`, borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{card.icon}</div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.4 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Download button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          onClick={downloadExcel}
          style={{
            padding: '6px 16px', background: accentColor, color: '#fff',
            border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          ⬇ Download Excel
        </button>
      </div>

      {/* Active search chips */}
      {Object.entries(colSearch).some(([, v]) => v) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(colSearch).filter(([, v]) => v).map(([col, val]) => (
            <span key={col} style={{
              background: accentColor + '18', color: accentColor, fontSize: 11,
              fontWeight: 600, padding: '2px 10px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {col}: "{val}"
              <span style={{ cursor: 'pointer', fontWeight: 800 }}
                onClick={() => setColSearch(p => { const n = { ...p }; delete n[col]; return n; })}>×</span>
            </span>
          ))}
          <span style={{ cursor: 'pointer', fontSize: 11, color: '#ef4444', padding: '2px 6px' }}
            onClick={() => setColSearch({})}>Clear all</span>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #eaecf0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {['Id', 'Completion Date', 'Time Taken', 'LOT1', 'LOT2', 'LOT3',
                'Other A1', 'Other A2', 'Other A3', 'Reason for Sequencing', ...SEGMENT_COLS].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
            {/* Search row */}
            <tr style={{ background: '#f1f5f9' }}>
              {['Id', 'Completion Date', 'Time Taken', 'LOT1', 'LOT2', 'LOT3',
                'Other A1', 'Other A2', 'Other A3', 'Reason for Sequencing', ...SEGMENT_COLS].map(h => {
                const searchable = ['LOT1', 'LOT2', 'LOT3'].includes(h);
                return (
                  <td key={h} style={{ padding: '4px 8px' }}>
                    {searchable ? (
                      <input
                        type="text"
                        placeholder="🔍"
                        value={colSearch[h] || ''}
                        onChange={e => setColSearch(p => ({ ...p, [h]: e.target.value }))}
                        style={{
                          width: '100%', padding: '3px 6px', fontSize: 11, border: `1px solid ${accentColor}55`,
                          borderRadius: 5, outline: 'none', minWidth: 80,
                          background: colSearch[h] ? accentColor + '12' : '#fff',
                        }}
                      />
                    ) : null}
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={td}>{row['Id'] || ''}</td>
                <td style={td}>{formatDate(row['End Date Users Tz'])}</td>
                <td style={td}>{formatTime(row['Time Taken'])}</td>
                <td style={td}>{row[l1] || ''}</td>
                <td style={td}>{row[l2] || ''}</td>
                <td style={td}>{row[l3] || ''}</td>
                <td style={td}>{row[o1] || ''}</td>
                <td style={td}>{row[o2] || ''}</td>
                <td style={td}>{row[o3] || ''}</td>
                <td style={tdReason} title={row[reasonCol] || ''}>{row[reasonCol] || ''}</td>
                {SEGMENT_COLS.map(s => (
                  <td key={s} style={td}>{row[s] && row[s] !== 0 && row[s] !== '0' ? row[s] : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#aaa', textAlign: 'right' }}>
        {displayRows.length}{displayRows.length !== rows.length ? ` of ${rows.length}` : ''} respondents · {INDICATION_LABELS[indication]}
      </div>
    </div>
  );
}
