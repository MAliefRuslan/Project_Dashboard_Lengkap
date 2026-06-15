const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

async function streamExcel(inputPath, filterFn) {
    const data = [];
    if (!fs.existsSync(inputPath)) {
        console.log(`  File tidak ditemukan: ${inputPath}`);
        return data;
    }

    const reader = new ExcelJS.stream.xlsx.WorkbookReader(inputPath, {
        sharedStrings: 'cache',
        hyperlinks: 'ignore',
        worksheets: 'emit',
    });

    let headers = null;

    for await (const ws of reader) {
        for await (const row of ws) {
            const vals = row.values; // sparse array, index 1-based
            if (!headers) {
                // Copy headers and normalize
                headers = [...vals];
                for (let i = 1; i < headers.length; i++) {
                    if (headers[i] == null) continue;
                    if (typeof headers[i] === 'object') {
                        if (headers[i].richText) headers[i] = headers[i].richText.map(r => r.text).join('');
                        else if (headers[i].text) headers[i] = headers[i].text;
                        else if (headers[i].result != null) headers[i] = String(headers[i].result);
                        else headers[i] = JSON.stringify(headers[i]);
                    }
                    headers[i] = String(headers[i]).trim();
                }
            } else {
                const rowData = {};
                for (let i = 1; i < headers.length; i++) {
                    if (!headers[i]) continue;
                    let val = vals[i];
                    if (val != null && typeof val === 'object') {
                        if (val.result != null) val = val.result;
                        else if (val.text != null) val = val.text;
                        else if (val.richText) val = val.richText.map(r => r.text).join('');
                    }
                    rowData[headers[i]] = val;
                }
                const filtered = filterFn(rowData);
                if (filtered) data.push(filtered);
            }
        }
        break; // only first worksheet
    }

    return data;
}

const xlsx = require('xlsx');

function parseExcelSmall(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const wb = xlsx.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const worksheet = wb.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet, { defval: null });
}

async function main() {
    console.log('Mulai memproses file Excel untuk GitHub...');

    // 1. Master Data
    console.log('- Memproses Master_Data.xlsx...');
    const masterData = await streamExcel('../Master_Data.xlsx', row => {
        const menu = row['Menu'] || row['Menu '];
        if (!menu) return null;
        return {
            Menu: menu,
            Qty: row['Qty'] || 0,
            Total: row['Total'] || 0,
            SalesDate: row['Sales Date'] || row['Sales Date In'],
            Branch: row['Branch'] || row['Cabang'],
            Category: row['Menu Category'],
            PaymentMethod: row['Payment Method'] || 'Unknown',
            Hour: row['Hour'] || 'Unknown',
        };
    });
    console.log(`  Berhasil mengekstrak ${masterData.length} baris.`);
    fs.writeFileSync(path.join(publicDir, 'masterData.json'), JSON.stringify(masterData));

    // 2. BOM MENU (Use xlsx for small file)
    console.log('- Memproses BOM MENU.xlsx...');
    const bomData = parseExcelSmall('../BOM MENU.xlsx');
    console.log(`  Berhasil mengekstrak ${bomData.length} baris.`);
    fs.writeFileSync(path.join(publicDir, 'bomMenu.json'), JSON.stringify(bomData));

    // 3. STOK (Use xlsx for small file)
    console.log('- Memproses STOK.xlsx...');
    const stokData = parseExcelSmall('../STOK.xlsx');
    console.log(`  Berhasil mengekstrak ${stokData.length} baris.`);
    fs.writeFileSync(path.join(publicDir, 'stok.json'), JSON.stringify(stokData));

    const masterSize = (fs.statSync(path.join(publicDir, 'masterData.json')).size / 1024 / 1024).toFixed(2);
    console.log(`\nProses selesai! masterData.json: ${masterSize} MB`);
    console.log('File JSON siap di folder public/ untuk dikirim ke GitHub.');
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
