const xlsx = require('xlsx');

function getColumns(file) {
    try {
        console.log(`Reading ${file}...`);
        const workbook = xlsx.readFile(file, { sheetRows: 5 });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length > 0) {
            console.log(`Columns in ${file}:`);
            console.log(data[0]);
            console.log('Sample Data:');
            console.log(data.slice(1, 3));
            console.log('---------------------------');
        } else {
            console.log(`No data in ${file}`);
        }
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
}

getColumns('d:/Project_Dashboard_Lengkap/Master_Data.xlsx');
getColumns('d:/Project_Dashboard_Lengkap/BOM MENU.xlsx');
getColumns('d:/Project_Dashboard_Lengkap/STOK.xlsx');
