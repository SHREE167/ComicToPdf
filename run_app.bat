@echo off
setlocal enabledelayedexpansion

REM Get root directory
set ROOT_DIR=%~dp0
echo Current Directory: %ROOT_DIR%

REM --- Step 1: Install root dependencies ---
echo Checking dependencies in root...
if not exist "%ROOT_DIR%node_modules" (
    echo Installing root dependencies...
    call npm install
) else (
    echo Root dependencies already installed.
)

REM --- Step 2: Install backend dependencies ---
echo Checking dependencies in backend...
if not exist "%ROOT_DIR%backend\node_modules" (
    echo Installing backend dependencies...
    pushd backend
    call npm install
    popd
) else (
    echo Backend dependencies already installed.
)

REM --- Step 3: Start backend server ---
echo Starting backend server...
start "" cmd /k "cd /d %ROOT_DIR%backend && npm start"

REM --- Step 4: Start Electron frontend ---
echo Starting the Electron app...
call "%ROOT_DIR%node_modules\.bin\electron.cmd" .

pause
