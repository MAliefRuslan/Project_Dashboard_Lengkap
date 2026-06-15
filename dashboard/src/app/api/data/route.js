import { NextResponse } from 'next/server';
import path from 'path';
import * as xlsx from 'xlsx';

// Global cache to avoid re-parsing large Excel files on every request
let cachedData = null;

import fs from 'fs';

function readExcelFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Return data as JSON array of objects
    return xlsx.utils.sheet_to_json(worksheet, { defval: null });
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error.message);
    return [];
  }
}

export async function GET() {
  try {
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    console.log('Parsing Excel files, this might take a moment...');
    
    // Resolve absolute paths
    const basePath = path.join(process.cwd(), '..');
    const bomMenuPath = path.join(basePath, 'BOM MENU.xlsx');
    const stokPath = path.join(basePath, 'STOK.xlsx');
    const masterJsonPath = path.join(process.cwd(), 'masterData.json');

    // Read Master Data from JSON
    let processedMaster = [];
    if (fs.existsSync(masterJsonPath)) {
      processedMaster = JSON.parse(fs.readFileSync(masterJsonPath, 'utf8'));
    } else {
      throw new Error('Data is still being processed. Please refresh in a few moments.');
    }

    const bomMenu = readExcelFile(bomMenuPath);
    const stok = readExcelFile(stokPath);

    cachedData = {
      masterData: processedMaster,
      bomMenu,
      stok
    };

    console.log('Parsing complete.');

    return NextResponse.json(cachedData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
