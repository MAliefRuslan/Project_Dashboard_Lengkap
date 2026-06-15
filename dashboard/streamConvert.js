const ExcelJS = require('exceljs');
const fs = require('fs');

async function convertMasterData() {
  const masterData = [];
  console.log('Streaming Master_Data.xlsx...');
  
  const options = {
    sharedStrings: 'emit',
    hyperlinks: 'ignore',
    worksheets: 'emit',
  };
  
  const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('../Master_Data.xlsx', options);
  let headers = null;
  
  for await (const worksheetReader of workbookReader) {
    for await (const row of worksheetReader) {
      if (!headers) {
        // Read header row
        headers = [];
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value;
        });
      } else {
        // Read data row
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        
        // We only need Menu, Qty, Branch, Menu Category, Sales Date
        if (rowData['Menu'] && rowData['Qty']) {
          masterData.push({
            Menu: rowData['Menu'],
            Qty: rowData['Qty'],
            SalesDate: rowData['Sales Date'],
            Branch: rowData['Branch'] || rowData['Cabang'],
            Category: rowData['Menu Category']
          });
        }
      }
    }
    // Only process the first worksheet
    break;
  }
  
  console.log(`Finished parsing. Total valid rows: ${masterData.length}`);
  fs.writeFileSync('masterData.json', JSON.stringify(masterData));
  console.log('Wrote masterData.json');
}

convertMasterData().catch(console.error);
