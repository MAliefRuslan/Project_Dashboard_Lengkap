const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Folders/files to watch
const watchPaths = [
    './Master_Data.xlsx',
    './BOM MENU.xlsx',
    './STOK.xlsx',
    './dashboard/src'
];

let isSyncing = false;
let syncTimeout = null;

function syncToGitHub() {
    if (isSyncing) return;
    isSyncing = true;
    
    console.log('\n[Auto-Sync] Perubahan terdeteksi! Mengekstrak Excel ke JSON dan mengirim ke GitHub...');
    
    // First, change directory to dashboard, run parse script, then go back, then git add and push
    const cmd = `cd dashboard && node --max-old-space-size=4096 parseDataForGitHub.js && cd .. && git add . && git commit -m "Auto update: ${new Date().toLocaleString()}" && git push origin main`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            // Ignore "nothing to commit" errors
            if (!stdout.includes('nothing to commit')) {
                console.error(`[Auto-Sync] Error: ${error.message}`);
            } else {
                console.log('[Auto-Sync] Tidak ada perubahan baru untuk dikirim.');
            }
        } else {
            console.log(`[Auto-Sync] Berhasil! File terbaru telah di-push ke GitHub.`);
        }
        isSyncing = false;
    });
}

function onFileChange(eventType, filename) {
    if (filename && (filename.includes('.git') || filename.includes('node_modules') || filename.includes('.next'))) {
        return;
    }
    
    // Debounce the sync so it doesn't trigger multiple times for a single save
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        syncToGitHub();
    }, 5000); // Wait 5 seconds after the last change before syncing
}

console.log('Memulai Auto-Sync ke GitHub...');
console.log('Memantau perubahan pada file Excel dan kode Dashboard...');

// Watch specific files and directories
watchPaths.forEach(watchPath => {
    if (fs.existsSync(watchPath)) {
        fs.watch(watchPath, { recursive: true }, onFileChange);
    } else {
        console.warn(`[Auto-Sync] Peringatan: Path ${watchPath} tidak ditemukan.`);
    }
});
