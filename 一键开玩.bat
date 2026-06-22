﻿@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title WhenWhere - Quick Start

echo.
echo ========================================
echo      WhenWhere - Quick Start
echo        When Where - Know the World
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

set "SETUP_REQUIRED=0"
set "NODE_OK=0"
set "NPM_OK=0"
set "WW_DEPS_OK=0"
set "WW_DB_OK=0"

echo [1/5] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo     [X] Node.js not found
    echo.
    echo     Please install Node.js 20.x or later:
    echo     Download: https://nodejs.org/
    echo.
    set "SETUP_REQUIRED=1"
    set "NODE_OK=0"
) else (
    for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
    echo     [OK] Node.js %NODE_VERSION%
    set "NODE_OK=1"
)

echo.
echo [2/5] Checking npm...
if "%NODE_OK%"=="1" (
    where npm >nul 2>&1
    if %errorlevel% neq 0 (
        echo     [X] npm not found
        set "SETUP_REQUIRED=1"
        set "NPM_OK=0"
    ) else (
        for /f "delims=" %%i in ('npm --version') do set NPM_VERSION=%%i
        echo     [OK] npm %NPM_VERSION%
        set "NPM_OK=1"
    )
) else (
    echo     [SKIP] Skipped (Node.js not installed)
    set "NPM_OK=0"
)

echo.
echo [3/5] Checking WW dependencies...
if exist "ww\node_modules" (
    echo     [OK] Dependencies installed
    set "WW_DEPS_OK=1"
) else (
    echo     [X] Dependencies not installed
    set "SETUP_REQUIRED=1"
    set "WW_DEPS_OK=0"
)

echo.
echo [4/5] Checking WW database...
if exist "ww\db\whenwhere.db" (
    echo     [OK] Database initialized
    set "WW_DB_OK=1"
) else (
    echo     [X] Database not initialized
    set "SETUP_REQUIRED=1"
    set "WW_DB_OK=0"
)

echo.
echo [5/5] Checking port...
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo     [!] Port 3000 is already in use, game may be running
    echo.
    echo     Open game in browser? (Y/N)
    set /p "OPEN_BROWSER="
    if /i "!OPEN_BROWSER!"=="Y" (
        echo     Opening http://localhost:3000 ...
        start http://localhost:3000
    )
    echo.
    pause
    exit /b 0
) else (
    echo     [OK] Port 3000 available
)

echo.
echo ========================================
echo.

if "%SETUP_REQUIRED%"=="1" (
    echo [!] Environment incomplete, setup required.
    echo.
    echo Current status:
    if "%NODE_OK%"=="1" (echo   [OK] Node.js - installed) else (echo   [X] Node.js - not installed)
    if "%NPM_OK%"=="1" (echo   [OK] npm - installed) else (echo   [X] npm - not installed)
    if "%WW_DEPS_OK%"=="1" (echo   [OK] WW dependencies - installed) else (echo   [X] WW dependencies - not installed)
    if "%WW_DB_OK%"=="1" (echo   [OK] WW database - initialized) else (echo   [X] WW database - not initialized)
    echo.
    echo Run auto setup now? (Y/N)
    echo   Y - Run setup (takes 2-5 minutes)
    echo   N - Exit, run setup.bat manually later
    echo.
    set /p "DO_SETUP="
    
    if /i not "!DO_SETUP!"=="Y" (
        echo.
        echo Cancelled. Please run setup.bat manually later.
        echo.
        pause
        exit /b 0
    )
    
    echo.
    echo ========================================
    echo.
    echo Running setup...
    echo.
    
    if "%NODE_OK%"=="0" (
        echo [X] Node.js not installed, cannot continue.
        echo Please install Node.js first: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    
    if "%WW_DEPS_OK%"=="0" (
        echo [1/2] Installing WW dependencies...
        cd ww
        call npm install
        if %errorlevel% neq 0 (
            echo.
            echo [X] Dependencies install failed. Please check your network and retry.
            cd "%SCRIPT_DIR%"
            pause
            exit /b 1
        )
        echo [OK] WW dependencies installed
        cd "%SCRIPT_DIR%"
    )
    
    if "%WW_DB_OK%"=="0" (
        echo.
        echo [2/2] Initializing database...
        cd ww
        if not exist db mkdir db
        call npm run init-db
        if %errorlevel% neq 0 (
            echo.
            echo [!] Database init may have issues, but startup should still work.
            echo Game will auto-create necessary tables on startup.
        ) else (
            echo [OK] Database initialized
        )
        cd "%SCRIPT_DIR%"
    )
    
    echo.
    echo [OK] Setup complete!
)

echo.
echo ========================================
echo.
echo Starting WhenWhere game server...
echo.
echo   URL:  http://localhost:3000
echo   Stop: Close the log window
echo.
echo ========================================
echo.

echo Starting game server (logs in new window)...
echo.

start "WhenWhere - Game Server Log" cmd /k "cd /d ""%SCRIPT_DIR%ww"" && npm start"

echo Waiting for server to be ready (about 4 seconds)...
timeout /t 4 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo.
echo [OK] Game started!
echo.
echo   Game is running in the log window.
echo   Browser should have opened automatically.
echo.
echo   Troubleshooting:
echo   * Browser not open?  -> Visit http://localhost:3000 manually
echo   * Page error?        -> Wait a few seconds and refresh
echo   * Won't start?       -> Check the log window for errors
echo.
echo ========================================
echo.
echo [TIP] Close the log window to stop the game server.
echo.

cd "%SCRIPT_DIR%"
endlocal
pause
exit /b 0
