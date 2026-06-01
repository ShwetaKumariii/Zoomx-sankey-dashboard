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

const DEFAULT_CONFIG = {
  showLabels: true,
  cleanMode: false,
  nodeBorders: false,
  flowOpacity: 0.35,
  nodeThickness: 20,
  nodePadding: 20,
  labelFontSize: 12,
  labelFontFamily: 'Arial',
  chartHeight: 460,
  defaultNodeColor: '#7c6ee6',
};

export default function SankeyChart({ rows, indication, nodeColors = {}, accentColor = '#7c6ee6', config = {} }) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const { labels, sources, targets, values, nodeX, nodeY } = useMemo(
    () => buildSankeyData(rows, indication),
    [rows, indication]
  );

  const respondentCount = useMemo(() => {
    const col = { EC: 'Q6_20Z_EC_1L', OC: 'Q6_20Z_OC_1L', CC: 'Q6_20Z_CC_1L' }[indication];
    return rows.filter(r => r[col]).length;
  }, [rows, indication]);

  const uniqueDrugs = useMemo(() => [...new Set(labels)], [labels]);

  const nodeColorList = labels.map(l => nodeColors[l] || cfg.defaultNodeColor);
  const linkColors = sources.map(si => hexToRgba(nodeColorList[si], cfg.flowOpacity));

  const nodeLineColor = cfg.nodeBorders ? '#333' : '#fff';
  const nodeLineWidth = cfg.nodeBorders ? 1.5 : 0.5;

  // Clean mode: hide node labels
  const displayLabels = cfg.showLabels && !cfg.cleanMode ? labels : labels.map(() => '');

  return (
    <div style={{ padding: '16px 20px 10px' }}>
      {labels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb', fontSize: 14 }}>
          No treatment flow data for {INDICATION_LABELS[indication]}.
        </div>
      ) : (
        <>
          {/* LOT column headers */}
          {!cfg.cleanMode && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingLeft: '2%', paddingRight: '2%' }}>
              {['1st Line', '2nd Line', '3rd Line'].map(l => (
                <div key={l} style={{
                  background: '#f1f5f9', borderRadius: 6, padding: '3px 14px',
                  fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.3,
                }}>{l}</div>
              ))}
            </div>
          )}

          <Plot
            data={[{
              type: 'sankey',
              orientation: 'h',
              arrangement: 'fixed',
              node: {
                pad: cfg.nodePadding,
                thickness: cfg.nodeThickness,
                line: { color: nodeLineColor, width: nodeLineWidth },
                label: displayLabels,
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
              font: {
                size: cfg.labelFontSize,
                family: cfg.labelFontFamily,
              },
              margin: { l: 10, r: 10, t: 5, b: 10 },
              height: cfg.chartHeight,
              paper_bgcolor: 'rgba(0,0,0,0)',
            }}
            style={{ width: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
          />

          {/* Legend */}
          {!cfg.cleanMode && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8, paddingLeft: 4 }}>
              {uniqueDrugs.map(drug => (
                <div key={drug} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                    background: nodeColors[drug] || cfg.defaultNodeColor,
                    border: cfg.nodeBorders ? '1px solid #333' : 'none',
                  }} />
                  <span style={{ fontSize: 11, color: '#555', fontFamily: cfg.labelFontFamily }}>{drug}</span>
                </div>
              ))}
            </div>
          )}

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
