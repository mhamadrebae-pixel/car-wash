@echo off
chcp 65001 > nul
title Darya Car Wash - Online Cloudflare Tunnel
color 0b

echo ========================================================
echo    سیستەمی غەسلی دەریا - بەستنەوە بە ئینتەرنێت (Cloudflare)
echo    Darya Car Wash - Cloudflare Global Tunnel
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] پشکنینی سێرڤەری ناوخۆیی...
netstat -ano | findstr :3000 | findstr LISTENING > nul
if %errorlevel% neq 0 (
    echo [2/3] داگیرساندنی سێرڤەر...
    start "" /min cmd /c "npm start"
    timeout /t 4 /nobreak > nul
) else (
    echo     سێرڤەر لە پاشبنەما کاردەکات.
)

echo [3/3] کردنەوەی دەروازەی ئینتەرنێت و دروستکردنی لینکی جیهانی (HTTPS)...
echo.
echo ========================================================
echo  تکایە چاوەڕێبە تا لینکی ئینتەرنێت (trycloudflare.com) دەردەکەوێت:
echo  دەتوانیت ئەو لینکە کۆپی بکەیت و لەسەر مۆبایلی خۆت بیکەیتەوە!
echo ========================================================
echo.

.\tools\cloudflared.exe tunnel --url http://localhost:3000
pause
