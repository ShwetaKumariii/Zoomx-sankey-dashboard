// Reads the master data file (data/Sankey_RD_master.xlsx, kept private/gitignored)
// and writes a sanitized copy to public/Sankey_RD.xlsx with PII columns removed.
// Run automatically before every build/deploy via the predeploy script.

const XLSX = require('xlsx');
const path = require('path');

const PII_COLUMNS = ['First Name', 'Last Name'];

const masterPath = path.join(__dirname, '..', 'data', 'Sankey_RD_master.xlsx');
const outPath = path.join(__dirname, '..', 'public', 'Sankey_RD.xlsx');

const workbook = XLSX.readFile(masterPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const sanitized = rows.map(row => {
  const out = { ...row };
  PII_COLUMNS.forEach(col => { delete out[col]; });
  return out;
});

const newSheet = XLSX.utils.json_to_sheet(sanitized);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
XLSX.writeFile(newWorkbook, outPath);

console.log(`Sanitized ${rows.length} rows → ${outPath} (removed: ${PII_COLUMNS.join(', ')})`);
