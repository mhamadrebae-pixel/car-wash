@echo off
title Car Wash Pro - دۆخی خێرای پرۆدەکشن (Production Mode)
color 0a
echo ========================================================
echo    سیستەمی پێشکەوتووی بەڕێوەبردنی غەسلی ئۆتۆمبێل
echo    دۆخی خێرا (Production Mode - High Performance)
echo ========================================================
echo.
echo ئامادەکردن و دروستکردنی سیستەم بە شێوازی خێرا...
cd /d "%~dp0"

call npm run build
if %errorlevel% neq 0 (
    echo [هەڵە] دروستکردنی فایلەکان سەرکەوتوو نەبوو!
    pause
    exit /b %errorlevel%
)

echo.
echo دەستپێکردنی سێرڤەری پرۆدەکشن...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

npm run start
pause
