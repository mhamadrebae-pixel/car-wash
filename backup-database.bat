@echo off
chcp 65001 > nul
title Car Wash Database Backup
color 0b

echo ========================================================
echo    سیستەمی پاراستن و باکئەپی داتای غەسلی ئۆتۆمبێل
echo    Car Wash Database Auto-Backup
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "backups" (
    mkdir backups
    echo فۆڵدەری باکئەپ (backups) دروستکرا.
)

set CURR_DATE=%date:~10,4%-%date:~4,2%-%date:~7,2%
if "%CURR_DATE%"=="--" set CURR_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%
set CURR_TIME=%time:~0,2%-%time:~3,2%
set CURR_TIME=%CURR_TIME: =0%

set BACKUP_FILE=backups\carwash-db-backup-%CURR_DATE%_%CURR_TIME%.json

if exist "data\carwash-db.json" (
    copy /y "data\carwash-db.json" "%BACKUP_FILE%" > nul
    echo.
    echo [سەرکەوتوو بوو] فایلی باکئەپ پارێزرا لە:
    echo  ^> %BACKUP_FILE%
    echo.
    echo دەتوانیت ئەم فایلە کۆپی بکەیتە سەر فلاش یان Google Drive.
) else (
    echo [هەڵە] فایلی داتابەیس (data\carwash-db.json) نەدۆزرایەوە!
)

echo ========================================================
echo پەنجەرەکە لە دوای ٤ چرکە دادەخرێت...
timeout /t 4 > nul
exit
