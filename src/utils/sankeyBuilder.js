const LOT_COLS = {
  EC: ['Q6_20Z_EC_1L', 'Q6_20Z_EC_2L', 'Q6_20Z_EC_3L'],
  OC: ['Q6_20Z_OC_1L', 'Q6_20Z_OC_2L', 'Q6_20Z_OC_3L'],
  CC: ['Q6_20Z_CC_1L', 'Q6_20Z_CC_2L', 'Q6_20Z_CC_3L'],
};

// Each drug×LOT combination is a SEPARATE node so flows never loop back.
// Node key = "drug||lot_index" (e.g. "Pembrolizumab||0")
// Display label = just the drug name.
// x position is fixed by LOT column (0.01 / 0.5 / 0.99) for clean left→right layout.

export function buildSankeyData(rows, indication) {
  const cols = LOT_COLS[indication];

  // Collect all (drug, lotIdx) pairs that appear in the data
  const nodeMap = new Map(); // key "drug||lotIdx" → { label, x, y_slot }

  const linkMap = new Map(); // key "srcKey|||tgtKey" → count

  rows.forEach(row => {
    const lots = cols.map(col => row[col]); // null if missing
    for (let i = 0; i < lots.length; i++) {
      if (!lots[i]) continue;
      const key = `${lots[i]}||${i}`;
      if (!nodeMap.has(key)) {
        nodeMap.set(key, { label: lots[i], lotIdx: i });
      }
    }
    // Build links between consecutive filled LOTs
    for (let i = 0; i < lots.length - 1; i++) {
      if (!lots[i] || !lots[i + 1]) continue;
      const srcKey = `${lots[i]}||${i}`;
      const tgtKey = `${lots[i + 1]}||${i + 1}`;
      const lk = `${srcKey}|||${tgtKey}`;
      linkMap.set(lk, (linkMap.get(lk) || 0) + 1);
    }
  });

  // Convert to arrays
  const keys = Array.from(nodeMap.keys());
  const keyIdx = Object.fromEntries(keys.map((k, i) => [k, i]));

  // Assign x by LOT column, y spread evenly within each column
  // Count nodes per column first
  const colNodes = [[], [], []];
  keys.forEach(k => colNodes[nodeMap.get(k).lotIdx].push(k));

  const xPos = [0.01, 0.5, 0.99];
  const nodeX = [];
  const nodeY = [];
  const nodeLabels = [];

  keys.forEach(k => {
    const { label, lotIdx } = nodeMap.get(k);
    const col = colNodes[lotIdx];
    const posInCol = col.indexOf(k);
    const total = col.length;
    nodeLabels.push(label);
    nodeX.push(xPos[lotIdx]);
    // Spread nodes evenly between 0.05 and 0.95
    nodeY.push(total === 1 ? 0.5 : 0.05 + (posInCol / (total - 1)) * 0.9);
  });

  const sources = [];
  const targets = [];
  const values = [];

  linkMap.forEach((count, lk) => {
    const [srcKey, tgtKey] = lk.split('|||');
    sources.push(keyIdx[srcKey]);
    targets.push(keyIdx[tgtKey]);
    values.push(count);
  });

  return { labels: nodeLabels, sources, targets, values, nodeX, nodeY };
}
