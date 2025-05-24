@echo off
setlocal enabledelayedexpansion

echo.
echo ===============================================
echo    Please note: The first startup may take
echo    several minutes to install all dependencies.
echo    Subsequent runs will be much faster. Total around 783 packages so please be patient 
echo    and installing is purely dependent on your network connection.
echo ===============================================
echo.

REM Pause for 5 seconds to let user read message (optional)
timeout /t 5 /nobreak >nul

REM Get root directory
set "ROOT_DIR=%~dp0"
echo Current Directory: %ROOT_DIR%

REM --- Step 1: Install root dependencies ---
echo Checking dependencies in root...
if not exist "%ROOT_DIR%node_modules\.bin\electron.cmd" (
    echo Electron not found. Installing root dependencies...
    pushd "%ROOT_DIR%"
    call npm install
    popd
) else (
    echo Root dependencies already installed.
)

REM --- Step 2: Install backend dependencies ---
echo Checking dependencies in backend...
if not exist "%ROOT_DIR%backend\node_modules" (
    echo Installing backend dependencies...
    pushd "%ROOT_DIR%backend"
    call npm install
    popd
) else (
    echo Backend dependencies already installed.
)

REM --- Step 3: Start backend server ---
echo Starting backend server...
start "" cmd /k "cd /d %ROOT_DIR%backend && npm start"

REM --- Step 4: Start the Electron app ---
echo Starting the Electron app...
call "%ROOT_DIR%node_modules\.bin\electron.cmd" .

pause
