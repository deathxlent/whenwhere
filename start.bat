@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   WhenWhere One-Click Start
echo ========================================
echo.

if not exist "ww\node_modules" (
    echo [1/4] Installing ww dependencies...
    cd /d "%~dp0ww"
    call npm install
    if errorlevel 1 (
        echo Failed to install ww dependencies!
        pause
        exit /b 1
    )
    cd /d "%~dp0"
)

if not exist "hsd\node_modules" (
    echo [2/4] Installing hsd dependencies...
    cd /d "%~dp0hsd"
    call npm install
    if errorlevel 1 (
        echo Failed to install hsd dependencies!
        pause
        exit /b 1
    )
    cd /d "%~dp0"
)

if not exist "ww\db\whenwhere.db" (
    echo [3/4] Initializing database...
    cd /d "%~dp0ww"
    call npm run init-db
    if errorlevel 1 (
        echo Failed to initialize database!
        pause
        exit /b 1
    )
    cd /d "%~dp0"
) else (
    echo [3/4] Database exists, skipping init
)

echo [4/4] Starting services...
echo.
echo   ww (guess game):  http://localhost:3000
echo   hsd (admin):       http://localhost:3001
echo.

start "WW - Port 3000" /D "%~dp0ww" cmd /k npm start
timeout /t 1 /nobreak >nul
start "HSD - Port 3001" /D "%~dp0hsd" cmd /k npm start

echo.
echo Both services started in separate windows!
echo Closing this window won't stop the services.
echo.
pause
endlocal
