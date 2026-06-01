export function buildSankeyData(rows, indication) {
  const lotCols = {
    EC: ['Q6_20Z_EC_1L', 'Q6_20Z_EC_2L', 'Q6_20Z_EC_3L'],
    OC: ['Q6_20Z_OC_1L', 'Q6_20Z_OC_2L', 'Q6_20Z_OC_3L'],
    CC: ['Q6_20Z_CC_1L', 'Q6_20Z_CC_2L', 'Q6_20Z_CC_3L'],
  }[indication];

  const labelSet = new Set();
  const linkMap = new Map();

  rows.forEach(row => {
    const lots = lotCols.map(col => row[col]).filter(Boolean);
    lots.forEach(l => labelSet.add(l));
    for (let i = 0; i < lots.length - 1; i++) {
      const key = `${lots[i]}|||${lots[i + 1]}`;
      linkMap.set(key, (linkMap.get(key) || 0) + 1);
    }
  });

  const labels = Array.from(labelSet);
  const idx = label => labels.indexOf(label);

  const sources = [];
  const targets = [];
  const values = [];

  linkMap.forEach((count, key) => {
    const [src, tgt] = key.split('|||');
    sources.push(idx(src));
    targets.push(idx(tgt));
    values.push(count);
  });

  return { labels, sources, targets, values };
}
