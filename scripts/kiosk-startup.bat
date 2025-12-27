@echo off
REM Lab Kiosk Auto-Startup Script
REM This script launches the kiosk app in fullscreen mode on Windows startup
REM 
REM Purpose: Auto-launch the Lab Kiosk system on Windows boot
REM URL: https://if-8amo.onrender.com/
REM 
REM Usage: Copy this file to C:\ and add shortcut to Windows Startup folder

setlocal enabledelayedexpansion

REM Wait for system to fully load before launching
echo Starting Lab Kiosk...
timeout /t 5 /nobreak

REM Launch Chrome in fullscreen kiosk mode
REM --app flag: runs as web app (no browser chrome)
REM --fullscreen: launches in fullscreen mode
REM --no-first-run: skips first run prompts

start "Lab Kiosk" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=https://if-8amo.onrender.com/ --fullscreen

REM Alternative: Use Microsoft Edge instead of Chrome (uncomment to use)
REM start "Lab Kiosk" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=https://if-8amo.onrender.com/ --fullscreen

REM Exit batch script
exit /b
