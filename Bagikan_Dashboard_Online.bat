@echo off
title Berbagi Dashboard Online
echo ========================================================
echo MENDAPATKAN LINK INTERNET UNTUK DASHBOARD ANDA...
echo ========================================================
echo.
echo Pastikan server Dashboard (npm run dev) sedang berjalan!
echo.
npx localtunnel --port 3000
pause
