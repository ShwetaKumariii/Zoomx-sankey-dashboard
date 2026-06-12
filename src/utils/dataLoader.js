import * as XLSX from 'xlsx';

const LOT_COLUMNS = {
  EC: ['Q6_20Z_EC_1L', 'Q6_20Z_EC_2L', 'Q6_20Z_EC_3L'],
  OC: ['Q6_20Z_OC_1L', 'Q6_20Z_OC_2L', 'Q6_20Z_OC_3L'],
  CC: ['Q6_20Z_CC_1L', 'Q6_20Z_CC_2L', 'Q6_20Z_CC_3L'],
};

const OTHER_COLUMNS = {
  EC: ['Q6_20Z_OTHER_EC_A1', 'Q6_20Z_OTHER_EC_A2', 'Q6_20Z_OTHER_EC_A3'],
  OC: ['Q6_20Z_OTHER_OC_A1', 'Q6_20Z_OTHER_OC_A2', 'Q6_20Z_OTHER_OC_A3'],
  CC: ['Q6_20Z_OTHER_CC_A1', 'Q6_20Z_OTHER_CC_A2', 'Q6_20Z_OTHER_CC_A3'],
};

const SEGMENT_COLUMNS = [
  'Practice Setting', 'Specialty',
  'Segment 1', 'Segment 2', 'Segment 3', 'Segment 4', 'Segment 5',
  'Segment 6', 'Segment 7', 'Segment 8', 'Segment 9', 'Segment 10',
];

const REASON_COLUMNS = {
  EC: 'Q6_30Z_EC',
  OC: 'Q6_30Z_OC',
  CC: 'Q6_30Z_CC',
};

function normaliseValue(val) {
  if (val === undefined || val === null || val === 0 || val === '0' || val === '') return null;
  const s = String(val).trim();
  if (s === '0') return null;
  if (s.toLowerCase() === 'clinical trial') return 'Clinical Trial';
  return s;
}

export async function loadData() {
  const response = await fetch(`${process.env.PUBLIC_URL}/Sankey_RD.xlsx`);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

  const rows = rawRows.map(row => {
    const out = { ...row };
    // Normalise all LOT columns
    Object.values(LOT_COLUMNS).flat().forEach(col => {
      out[col] = normaliseValue(row[col]);
    });
    // Normalise all OTHER columns
    Object.values(OTHER_COLUMNS).flat().forEach(col => {
      out[col] = normaliseValue(row[col]);
    });
    return out;
  });

  return { rows, LOT_COLUMNS, OTHER_COLUMNS, SEGMENT_COLUMNS, REASON_COLUMNS };
}

export { LOT_COLUMNS, OTHER_COLUMNS, SEGMENT_COLUMNS, REASON_COLUMNS };
