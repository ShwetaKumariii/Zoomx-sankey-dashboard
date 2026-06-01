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

export default function UserTab({ rows, indication }) {
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
      ...Object.fromEntries(SEGMENT_COLS.map(s => [s, r[s] || ''])),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Level');
    XLSX.writeFile(wb, `UserLevel_${indication}.xlsx`);
  }

  const cellStyle = { padding: '6px 10px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', fontSize: 13 };
  const headerStyle = { ...cellStyle, background: '#f1f5f9', fontWeight: 600, position: 'sticky', top: 0 };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>
          User Level — {INDICATION_LABELS[indication]}
        </h3>
        <button
          onClick={downloadExcel}
          style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}
        >
          Download as Excel
        </button>
      </div>

      {/* Insight cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Most common sequence', value: topSequence(rows, indication) },
          { label: 'Most common LOT2 switch', value: topLOT2Switch(rows, indication) },
          { label: '% reached LOT3', value: pctLOT3(rows, indication) },
        ].map(card => (
          <div key={card.label} style={{
            flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid #e2e8f0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {['Id', 'Name', 'Completion Date', 'Time Taken', 'LOT1', 'LOT2', 'LOT3', 'Other A1', 'Other A2', 'Other A3',
                ...SEGMENT_COLS].map(h => (
                <th key={h} style={headerStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={cellStyle}>{row['Id'] || ''}</td>
                <td style={cellStyle}>{getName(row)}</td>
                <td style={cellStyle}>{formatDate(row['End Date Users Tz'])}</td>
                <td style={cellStyle}>{formatTime(row['Time Taken'])}</td>
                <td style={cellStyle}>{row[l1] || ''}</td>
                <td style={cellStyle}>{row[l2] || ''}</td>
                <td style={cellStyle}>{row[l3] || ''}</td>
                <td style={cellStyle}>{row[o1] || ''}</td>
                <td style={cellStyle}>{row[o2] || ''}</td>
                <td style={cellStyle}>{row[o3] || ''}</td>
                {SEGMENT_COLS.map(s => (
                  <td key={s} style={cellStyle}>
                    {row[s] && row[s] !== 0 && row[s] !== '0' ? row[s] : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
        {displayRows.length} respondents
      </div>
    </div>
  );
}
