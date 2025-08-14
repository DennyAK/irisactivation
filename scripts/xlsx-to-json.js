// Converts an XLSX with headers in first row to JSON array using keys from headers
// Usage: node scripts/xlsx-to-json.js <input.xlsx> <sheetName?>

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const [, , input, sheetName] = process.argv;
if (!input) {
  console.error('Usage: node scripts/xlsx-to-json.js <input.xlsx> <sheetName?>');
  process.exit(1);
}
const wb = XLSX.readFile(path.resolve(process.cwd(), input));
const ws = wb.Sheets[sheetName || wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
console.log(JSON.stringify(rows, null, 2));
