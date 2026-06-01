import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { buildSankeyData } from '../utils/sankeyBuilder';

const INDICATION_LABELS = { EC: 'Endometrial Cancer', OC: 'Ovarian Cancer', CC: 'Cervical Cancer' };

export default function SankeyChart({ rows, indication, onIndicationChange }) {
  const { labels, sources, targets, values } = useMemo(
    () => buildSankeyData(rows, indication),
    [rows, indication]
  );

  const respondentCount = useMemo(() => {
    const lotCols = {
      EC: 'Q6_20Z_EC_1L', OC: 'Q6_20Z_OC_1L', CC: 'Q6_20Z_CC_1L',
    };
    return rows.filter(r => r[lotCols[indication]]).length;
  }, [rows, indication]);

  const nodeColors = labels.map(l =>
    l === 'Product X' ? 'rgba(0,112,192,0.9)' : 'rgba(112,173,71,0.85)'
  );

  const linkColors = sources.map(si => {
    const base = nodeColors[si].replace('0.9', '0.35').replace('0.85', '0.35');
    return base;
  });

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <label style={{ fontWeight: 600 }}>Indication:</label>
        <select
          value={indication}
          onChange={e => onIndicationChange(e.target.value)}
          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
        >
          {Object.entries(INDICATION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v} ({k})</option>
          ))}
        </select>
        <span style={{ color: '#555', fontSize: 13 }}>n = {respondentCount} respondents</span>
      </div>

      {labels.length === 0 ? (
        <p style={{ color: '#888', marginTop: 40, textAlign: 'center' }}>
          No treatment flow data available for {INDICATION_LABELS[indication]}.
        </p>
      ) : (
        <Plot
          data={[{
            type: 'sankey',
            orientation: 'h',
            node: {
              pad: 20,
              thickness: 24,
              line: { color: 'white', width: 0.5 },
              label: labels,
              color: nodeColors,
            },
            link: {
              source: sources,
              target: targets,
              value: values,
              color: linkColors,
            },
          }]}
          layout={{
            title: {
              text: `Treatment Sequencing — ${INDICATION_LABELS[indication]}`,
              font: { size: 16 },
            },
            font: { size: 12 },
            margin: { l: 20, r: 20, t: 50, b: 20 },
            height: 520,
          }}
          style={{ width: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      )}
    </div>
  );
}
