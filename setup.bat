﻿﻿﻿@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================
echo   WhenWhere Setup Script (Windows)
echo ========================================
echo.

echo [1/6] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 20+
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js: %NODE_VERSION%

echo [2/6] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found. Please reinstall Node.js.
    pause
    exit /b 1
)
for /f "delims=" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm: %NPM_VERSION%
echo.

echo [3/6] Installing HSD dependencies...
cd hsd
if exist node_modules (
    echo node_modules exists, skipped.
) else (
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] HSD dependencies install failed
        cd ..
        pause
        exit /b 1
    )
    echo HSD dependencies installed.
)

echo [4/6] Initializing HSD database...
if exist db\hsd.db (
    echo Database exists, skipped.
) else (
    if not exist db mkdir db
    call npm run init-db
    if %errorlevel% neq 0 (
        echo [WARN] HSD db init may have issues.
    ) else (
        echo HSD database initialized.
    )
)
cd ..

echo [5/6] Installing WW dependencies...
cd ww
if exist node_modules (
    echo node_modules exists, skipped.
) else (
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] WW dependencies install failed
        cd ..
        pause
        exit /b 1
    )
    echo WW dependencies installed.
)

echo [6/6] Initializing WW database...
if exist db\whenwhere.db (
    echo Database exists, skipped.
) else (
    if not exist db mkdir db
    call npm run init-db
    if %errorlevel% neq 0 (
        echo [WARN] WW db init may have issues.
    ) else (
        echo WW database initialized.
    )
)
cd ..

echo.
echo Creating directories...
if not exist hsd\static\images mkdir hsd\static\images
if not exist hsd\static\exports mkdir hsd\static\exports
if not exist ww\static\images mkdir ww\static\images
if not exist ww\static\tiles mkdir ww\static\tiles
if not exist ww\static\geojson mkdir ww\static\geojson

if not exist hsd\server\config.json (
    echo.
    echo Creating HSD config template...
    (
        echo {
        echo   "server": {
        echo     "port": 3001
        echo   },
        echo   "llm": {
        echo     "apiKey": "your-api-key-here",
        echo     "baseURL": "https://api.openai.com/v1",
        echo     "model": "gpt-4o-mini",
        echo     "maxTokens": 1000,
        echo     "temperature": 0.3
        echo   },
        echo   "paths": {
        echo     "images": "static/images/",
        echo     "exports": "static/exports/"
        echo   }
        echo }
    ) > hsd\server\config.json
    echo Edit hsd\server\config.json to configure LLM API (optional)
)

echo.
echo ========================================
echo   Setup complete!
echo ========================================
echo.
echo HSD Admin:    http://localhost:3001
echo WW Game:      http://localhost:3000
echo.
echo Run start.bat to start services.
echo.
pause
