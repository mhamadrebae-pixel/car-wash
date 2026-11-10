@echo off
chcp 65001 > nul
title Darya Car Wash POS - Kiosk Print Mode
color 0a

echo ========================================================
echo       سیستەمی غەسلی دەریا - پرینتی ڕاستەوخۆ (Kiosk POS)
echo       Darya Car Wash - Fast Thermal Receipt Mode
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] پشکنینی سێرڤەر...
netstat -ano | findstr :3000 | findstr LISTENING > nul
if %errorlevel% neq 0 (
    echo [2/3] داگیرساندنی سێرڤەر...
    start "" /min cmd /c "npm start"
    timeout /t 3 /nobreak > nul
) else (
    echo     سێرڤەر کاردەکات.
)

echo [3/3] کردنەوەی وێبگەڕ بە پرینتی ڕاستەوخۆی پسوولە (Kiosk Printing)...

:: Try Google Chrome in Kiosk Printing mode
set CHROME_PATH=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

if not %CHROME_PATH%=="" (
    start "" %CHROME_PATH% --kiosk-printing http://localhost:3000
    echo پەڕەکە لە گووگڵ کرۆم کرایەوە بە پرینتی خێرای پسوولە.
) else (
    :: Fallback to default browser
    start http://localhost:3000
    echo وێبگەڕی بنەڕەتی کرایەوە.
)

timeout /t 3 > nul
exit
