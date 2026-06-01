import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { buildSankeyData } from '../utils/sankeyBuilder';

const INDICATION_LABELS = { EC: 'Endometrial Cancer', OC: 'Ovarian Cancer', CC: 'Cervical Cancer' };

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function SankeyChart({ rows, indication, nodeColors = {}, accentColor = '#7c6ee6' }) {
  const { labels, sources, targets, values } = useMemo(
    () => buildSankeyData(rows, indication),
    [rows, indication]
  );

  const respondentCount = useMemo(() => {
    const col = { EC: 'Q6_20Z_EC_1L', OC: 'Q6_20Z_OC_1L', CC: 'Q6_20Z_CC_1L' }[indication];
    return rows.filter(r => r[col]).length;
  }, [rows, indication]);

  const colors = labels.map(l => nodeColors[l] || accentColor);
  const linkColors = sources.map(si => hexToRgba(colors[si] || accentColor, 0.3));

  return (
    <div style={{ padding: '20px 20px 10px' }}>
      {labels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb', fontSize: 14 }}>
          No treatment flow data for {INDICATION_LABELS[indication]}.<br />
          <span style={{ fontSize: 12 }}>Check that the data file has rows for this indication.</span>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {labels.map(label => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: nodeColors[label] || accentColor, flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, color: '#555' }}>{label}</span>
              </div>
            ))}
          </div>

          <Plot
            data={[{
              type: 'sankey',
              orientation: 'h',
              arrangement: 'snap',
              node: {
                pad: 18,
                thickness: 22,
                line: { color: '#fff', width: 1 },
                label: labels,
                color: colors,
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
              margin: { l: 10, r: 10, t: 10, b: 10 },
              height: 480,
              paper_bgcolor: 'rgba(0,0,0,0)',
            }}
            style={{ width: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
          />

          <div style={{ textAlign: 'right', marginTop: 4 }}>
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
