@echo off
chcp 65001 > nul
title Darya Car Wash POS System

echo =======================================================
echo          سیستەمی زیرەکی کارگێڕیی غەسلی دەریا
echo               Darya Car Wash Smart POS
echo =======================================================
echo.

cd /d "%~dp0"

echo [1/3] پشکنینی پۆرت و سێرڤەر...
netstat -ano | findstr :3000 | findstr LISTENING > nul
if %errorlevel% equ 0 (
    echo     سیستەم پێشتر لە پاشبنەما کراوەتەوە.
) else (
    echo [2/3] کارپێکردنی سێرڤەری پرۆژە...
    start "" /min cmd /c "npm start"
    timeout /t 3 /nobreak > nul
)

echo [3/3] کردنەوەی شاشەی سەرەکی سیستەم لە وێبگەڕدا...
start http://localhost:3000

echo.
echo =======================================================
echo  سەرکەوتوو بوو! پەڕەی سیستەم بە سەرکەوتوویی کرایەوە.
echo  دەتوانیت ئەم پەنجەرەیە دابخەیت.
echo =======================================================
timeout /t 3 > nul
exit
