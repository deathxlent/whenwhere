﻿@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================
echo   WhenWhere Start Script (Windows)
echo ========================================
echo.

netstat -ano | findstr ":3001" >nul
if %errorlevel% equ 0 (
    echo [WARN] Port 3001 in use, HSD may be running
)

netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo [WARN] Port 3000 in use, WW may be running
)

echo.
echo Starting HSD Admin (port 3001)...
echo Starting WW Game (port 3000)...
echo.
echo Press Ctrl+C to stop services
echo ========================================
echo.

cd hsd
start "HSD Server" cmd /k "npm start"
cd ..

cd ww
start "WW Server" cmd /k "npm start"
cd ..

echo.
echo Services starting, please wait...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Services Started!
echo ========================================
echo.
echo HSD Admin:    http://localhost:3001
echo WW Game:      http://localhost:3000
echo.
echo Both services run in separate windows.
echo Close the windows to stop them.
echo.
pause
