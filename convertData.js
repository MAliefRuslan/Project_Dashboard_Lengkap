const fs = require('fs');
const xlsx = require('xlsx');

console.time('Read Master_Data');
const buffer1 = fs.readFileSync('Master_Data.xlsx');
const wb1 = xlsx.read(buffer1, { type: 'buffer' });
const json1 = xlsx.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { defval: null });
console.timeEnd('Read Master_Data');

console.time('Write Master_Data JSON');
fs.writeFileSync('masterData.json', JSON.stringify(json1));
console.timeEnd('Write Master_Data JSON');

console.time('Read BOM & STOK');
const wb2 = xlsx.readFile('BOM MENU.xlsx');
fs.writeFileSync('bomMenu.json', JSON.stringify(xlsx.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]])));

const wb3 = xlsx.readFile('STOK.xlsx');
fs.writeFileSync('stok.json', JSON.stringify(xlsx.utils.sheet_to_json(wb3.Sheets[wb3.SheetNames[0]])));
console.timeEnd('Read BOM & STOK');

console.log("Conversion complete.");
