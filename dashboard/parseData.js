const xlsx = require('xlsx');
const fs = require('fs');

console.time('Read Master Data');
console.log('Reading Master_Data.xlsx...');
const wb = xlsx.readFile('../Master_Data.xlsx');
const sheetName = wb.SheetNames[0];
const worksheet = wb.Sheets[sheetName];
console.log('Converting to JSON...');
const data = xlsx.utils.sheet_to_json(worksheet, { defval: null });
console.timeEnd('Read Master Data');

const processedMaster = data.map(row => ({
  Menu: row['Menu'],
  Qty: row['Qty'] || 0,
  SalesDate: row['Sales Date'],
  Branch: row['Branch'] || row['Cabang'],
  Category: row['Menu Category']
})).filter(row => row.Menu && row.Qty);

console.log(`Valid rows: ${processedMaster.length}`);
fs.writeFileSync('masterData.json', JSON.stringify(processedMaster));
console.log('Wrote masterData.json');
