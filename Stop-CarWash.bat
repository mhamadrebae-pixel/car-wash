@echo off
chcp 65001 > nul
title Stop Royal Car Wash POS System

echo =======================================================
echo          داخستنی سێرڤەری سیستەمی غەسل
echo =======================================================
echo.

echo ڕاگرتنی پڕۆسەی سێرڤەر لەسەر پۆرتی 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a > nul 2>&1
)

taskkill /f /im cloudflared.exe > nul 2>&1

echo.
echo =======================================================
echo  سێرڤەری پرۆژەکە بە سەرکەوتوویی داخرا.
echo =======================================================
timeout /t 2 > nul
exit
