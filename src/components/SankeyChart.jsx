import React, { useMemo, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist-min';
import * as XLSX from 'xlsx';
import { buildSankeyData } from '../utils/sankeyBuilder';

const INDICATION_LABELS = { EC: 'Endometrial Cancer', OC: 'Ovarian Cancer', CC: 'Cervical Cancer' };

const LOT_COLS = {
  EC: ['Q6_20Z_EC_1L', 'Q6_20Z_EC_2L', 'Q6_20Z_EC_3L'],
  OC: ['Q6_20Z_OC_1L', 'Q6_20Z_OC_2L', 'Q6_20Z_OC_3L'],
  CC: ['Q6_20Z_CC_1L', 'Q6_20Z_CC_2L', 'Q6_20Z_CC_3L'],
};

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
  showNodes: true,
  flowOpacity: 0.35,
  nodeThickness: 20,
  nodePadding: 20,
  labelFontSize: 12,
  labelFontFamily: 'Arial',
  chartHeight: 460,
  defaultNodeColor: '#7c6ee6',
  hoverValue: 'n',
};

export default function SankeyChart({ rows, indication, nodeColors = {}, accentColor = '#7c6ee6', config = {} }) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const plotRef = useRef(null);
  const [copying, setCopying] = useState(false);

  async function copyChart() {
    const el = plotRef.current?.el;
    if (!el) return;
    setCopying(true);
    try {
      const dataUrl = await Plotly.toImage(el, { format: 'png', width: 1400, height: cfg.chartHeight, scale: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } finally {
      setCopying(false);
    }
  }

  const { labels, sources, targets, values, nodeX, nodeY } = useMemo(
    () => buildSankeyData(rows, indication),
    [rows, indication]
  );

  const respondentCount = useMemo(() => {
    const col = { EC: 'Q6_20Z_EC_1L', OC: 'Q6_20Z_OC_1L', CC: 'Q6_20Z_CC_1L' }[indication];
    return rows.filter(r => r[col]).length;
  }, [rows, indication]);

  // Compute per-node flow totals for % hover
  const { nodeCustomdata, linkCustomdata } = useMemo(() => {
    const outgoing = new Array(labels.length).fill(0);
    const incoming = new Array(labels.length).fill(0);
    sources.forEach((src, i) => { outgoing[src] += values[i]; incoming[targets[i]] += values[i]; });
    const nodeFlow = nodeX.map((x, i) => x < 0.1 ? outgoing[i] : incoming[i]);
    const base = respondentCount || 1;
    return {
      nodeCustomdata: nodeFlow.map(f => (f / base * 100).toFixed(1)),
      linkCustomdata: values.map(v => (v / base * 100).toFixed(1)),
    };
  }, [labels, sources, targets, values, nodeX, respondentCount]);

  const showPct = cfg.hoverValue === '%';
  const nodeHoverTemplate = showPct
    ? '%{label}<br><b>%{customdata}%</b><extra></extra>'
    : '%{label}<br><b>n = %{value}</b><extra></extra>';
  const linkHoverTemplate = showPct
    ? '%{source.label} → %{target.label}<br><b>%{customdata}%</b><extra></extra>'
    : '%{source.label} → %{target.label}<br><b>n = %{value}</b><extra></extra>';

  const uniqueDrugs = useMemo(() => [...new Set(labels)], [labels]);
  const nodeColorList = labels.map(l => nodeColors[l] || cfg.defaultNodeColor);
  const linkColors = sources.map(si => hexToRgba(nodeColorList[si], cfg.flowOpacity));

  const effectiveThickness = cfg.showNodes ? cfg.nodeThickness : 1;
  const effectiveNodeColors = cfg.showNodes ? nodeColorList : nodeColorList.map(() => 'rgba(0,0,0,0)');
  const nodeLineColor = cfg.showNodes && cfg.nodeBorders ? '#333' : 'rgba(0,0,0,0)';
  const nodeLineWidth = cfg.nodeBorders ? 1.5 : 0.5;
  const displayLabels = cfg.showLabels && !cfg.cleanMode ? labels : labels.map(() => '');

  function downloadSummary() {
    const cols = LOT_COLS[indication];
    const lotLabels = ['1L', '2L', '3L'];

    // --- Sheet 1: Distribution (regimen × LOT) ---
    const drugSet = new Set();
    const counts = {};
    const lotTotals = cols.map(col => rows.filter(r => r[col]).length);

    cols.forEach((col, li) => {
      rows.forEach(r => {
        const drug = r[col];
        if (!drug) return;
        drugSet.add(drug);
        if (!counts[drug]) counts[drug] = [0, 0, 0];
        counts[drug][li]++;
      });
    });

    const sorted = [...drugSet].sort();
    const distData = sorted.map(drug => {
      const row = { Regimen: drug };
      lotLabels.forEach((lot, li) => {
        const n = counts[drug][li] || 0;
        const pct = lotTotals[li] ? ((n / lotTotals[li]) * 100).toFixed(1) : '0.0';
        row[`${lot} (n)`] = n || '';
        row[`${lot} (%)`] = n ? pct + '%' : '';
      });
      return row;
    });

    // --- Sheet 2: Totals ---
    const totalsData = lotLabels.map((lot, li) => ({
      LOT: lot,
      'Respondents (n)': lotTotals[li],
    }));

    const total = lotTotals[0] || 1; // total respondents with LOT1 data = base for all %

    // --- Helper: build transition matrix sheet (% out of total) ---
    function buildTransition(srcCol, tgtCol, srcLabel) {
      const srcDrugs = [...new Set(rows.map(r => r[srcCol]).filter(Boolean))].sort();
      const tgtDrugs = [...new Set(rows.map(r => r[tgtCol]).filter(Boolean))].sort();

      const count = {};
      rows.forEach(r => {
        const src = r[srcCol]; const tgt = r[tgtCol];
        if (!src || !tgt) return;
        if (!count[src]) count[src] = {};
        count[src][tgt] = (count[src][tgt] || 0) + 1;
      });

      return srcDrugs.map(src => {
        const row = { [`${srcLabel} Regimen`]: src };
        tgtDrugs.forEach(tgt => {
          const n = (count[src] || {})[tgt] || 0;
          const pct = ((n / total) * 100).toFixed(1);
          row[tgt + ' (n)'] = n || '';
          row[tgt + ' (%)'] = n ? pct + '%' : '';
        });
        return row;
      });
    }

    // --- Sheet: Pivot (1L / 2L / 3L / n / %) ---
    const pivotCount = {};
    rows.forEach(r => {
      const l1 = r[cols[0]] || '(none)';
      const l2 = r[cols[1]] || '(none)';
      const l3 = r[cols[2]] || '(none)';
      if (!r[cols[0]]) return; // skip rows with no LOT1
      const key = `${l1}|||${l2}|||${l3}`;
      pivotCount[key] = (pivotCount[key] || 0) + 1;
    });
    const pivotData = Object.entries(pivotCount)
      .sort((a, b) => b[1] - a[1])
      .map(([key, n]) => {
        const [l1, l2, l3] = key.split('|||');
        return {
          '1L Regimen': l1,
          '2L Regimen': l2 === '(none)' ? '' : l2,
          '3L Regimen': l3 === '(none)' ? '' : l3,
          'n': n,
          '%': ((n / total) * 100).toFixed(1) + '%',
        };
      });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(distData), 'Distribution');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildTransition(cols[0], cols[1], '1L')), '1L → 2L Transitions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildTransition(cols[1], cols[2], '2L')), '2L → 3L Transitions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pivotData), 'Sequence Pivot');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(totalsData), 'Totals');
    XLSX.writeFile(wb, `Sankey_Summary_${indication}.xlsx`);
  }

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 4, alignItems: 'center' }}>
            <button
              onClick={downloadSummary}
              style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${accentColor}`, borderRadius: 14,
                background: '#fff', color: accentColor,
              }}
            >
              ⬇ Summary Data
            </button>
            <button
              onClick={copyChart}
              disabled={copying}
              style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${accentColor}`, borderRadius: 14,
                background: '#fff', color: accentColor, opacity: copying ? 0.6 : 1,
              }}
            >
              {copying ? 'Copying…' : '📋 Copy Chart'}
            </button>
          </div>

          <Plot
            ref={plotRef}
            data={[{
              type: 'sankey',
              orientation: 'h',
              arrangement: 'snap',
              node: {
                pad: cfg.nodePadding,
                thickness: effectiveThickness,
                line: { color: nodeLineColor, width: nodeLineWidth },
                label: displayLabels,
                color: effectiveNodeColors,
                x: nodeX,
                y: nodeY,
                customdata: nodeCustomdata,
                hovertemplate: nodeHoverTemplate,
              },
              link: {
                source: sources,
                target: targets,
                value: values,
                color: linkColors,
                customdata: linkCustomdata,
                hovertemplate: linkHoverTemplate,
              },
            }]}
            layout={{
              font: { size: cfg.labelFontSize, family: cfg.labelFontFamily },
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
