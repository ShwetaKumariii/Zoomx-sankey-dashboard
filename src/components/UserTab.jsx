import React, { useMemo } from 'react';
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

function getName(row) {
  if (String(row['Last Name'] || '').toUpperCase() === 'M3GDPR') return 'Anonymous';
  return `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || '—';
}

function formatDate(val) {
  if (!val) return '';
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

  const displayRows = useMemo(() => rows, [rows]);

  function downloadExcel() {
    const data = displayRows.map(r => ({
      Id: r['Id'],
      Name: getName(r),
      'Completion Date': formatDate(r['End Date Users Tz']),
      'Time Taken': formatTime(r['Time Taken']),
      LOT1: r[l1] || '',
      LOT2: r[l2] || '',
      LOT3: r[l3] || '',
      'Other A1': r[o1] || '',
      'Other A2': r[o2] || '',
      'Other A3': r[o3] || '',
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

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #eaecf0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {['Id', 'Name', 'Completion Date', 'Time Taken', 'LOT1', 'LOT2', 'LOT3',
                'Other A1', 'Other A2', 'Other A3', ...SEGMENT_COLS].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={td}>{row['Id'] || ''}</td>
                <td style={td}>{getName(row)}</td>
                <td style={td}>{formatDate(row['End Date Users Tz'])}</td>
                <td style={td}>{formatTime(row['Time Taken'])}</td>
                <td style={td}>{row[l1] || ''}</td>
                <td style={td}>{row[l2] || ''}</td>
                <td style={td}>{row[l3] || ''}</td>
                <td style={td}>{row[o1] || ''}</td>
                <td style={td}>{row[o2] || ''}</td>
                <td style={td}>{row[o3] || ''}</td>
                {SEGMENT_COLS.map(s => (
                  <td key={s} style={td}>{row[s] && row[s] !== 0 && row[s] !== '0' ? row[s] : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#aaa', textAlign: 'right' }}>
        {displayRows.length} respondents · {INDICATION_LABELS[indication]}
      </div>
    </div>
  );
}
