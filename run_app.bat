@echo off
echo Checking dependencies...

if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    npm install
) else (
    echo Dependencies already installed.
)

echo Starting backend server...
start "" cmd /k "cd /d "%~dp0backend" && node server.js"

echo Starting the Electron app...
call "node_modules\.bin\electron.cmd" .

pause
