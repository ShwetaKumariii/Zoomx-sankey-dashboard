import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { buildSankeyData } from '../utils/sankeyBuilder';

const INDICATION_LABELS = { EC: 'Endometrial Cancer', OC: 'Ovarian Cancer', CC: 'Cervical Cancer' };

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(150,150,150,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function SankeyChart({ rows, indication, nodeColors = {}, accentColor = '#7c6ee6' }) {
  const { labels, sources, targets, values, nodeX, nodeY } = useMemo(
    () => buildSankeyData(rows, indication),
    [rows, indication]
  );

  const respondentCount = useMemo(() => {
    const col = { EC: 'Q6_20Z_EC_1L', OC: 'Q6_20Z_OC_1L', CC: 'Q6_20Z_CC_1L' }[indication];
    return rows.filter(r => r[col]).length;
  }, [rows, indication]);

  // Unique drug names for legend (deduplicated across LOTs)
  const uniqueDrugs = useMemo(() => [...new Set(labels)], [labels]);

  const nodeColorList = labels.map(l => nodeColors[l] || accentColor);
  const linkColors = sources.map(si => hexToRgba(nodeColorList[si], 0.35));

  return (
    <div style={{ padding: '16px 20px 10px' }}>
      {labels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb', fontSize: 14 }}>
          No treatment flow data for {INDICATION_LABELS[indication]}.
        </div>
      ) : (
        <>
          {/* LOT column headers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingLeft: '2%', paddingRight: '2%' }}>
            {['1st Line', '2nd Line', '3rd Line'].map(l => (
              <div key={l} style={{
                background: '#f1f5f9', borderRadius: 6, padding: '3px 14px',
                fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.3,
              }}>{l}</div>
            ))}
          </div>

          <Plot
            data={[{
              type: 'sankey',
              orientation: 'h',
              arrangement: 'fixed',
              node: {
                pad: 20,
                thickness: 20,
                line: { color: '#fff', width: 1 },
                label: labels,
                color: nodeColorList,
                x: nodeX,
                y: nodeY,
              },
              link: {
                source: sources,
                target: targets,
                value: values,
                color: linkColors,
              },
            }]}
            layout={{
              font: { size: 12, family: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' },
              margin: { l: 10, r: 10, t: 5, b: 10 },
              height: 460,
              paper_bgcolor: 'rgba(0,0,0,0)',
            }}
            style={{ width: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
          />

          {/* Legend — unique drugs only */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 8, paddingLeft: 4 }}>
            {uniqueDrugs.map(drug => (
              <div key={drug} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 11, height: 11, borderRadius: 3, flexShrink: 0,
                  background: nodeColors[drug] || accentColor,
                }} />
                <span style={{ fontSize: 11, color: '#555' }}>{drug}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <span style={{
              background: accentColor + '18', color: accentColor,
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
            }}>
              n = {respondentCount} respondents
            </span>
          </div>
        </>
      )}
    </div>
  );
}
