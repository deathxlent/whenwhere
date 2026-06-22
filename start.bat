@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   WhenWhere 一键启动脚本 (Windows)
echo ========================================
echo.

REM 检查服务是否已启动
netstat -ano | findstr ":3001" >nul
if %errorlevel% equ 0 (
    echo [警告] 端口 3001 已被占用，HSD 可能已在运行
)

netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo [警告] 端口 3000 已被占用，WW 可能已在运行
)

echo.
echo 启动 HSD 维护系统 (端口 3001)...
echo 启动 WW 游戏系统 (端口 3000)...
echo.
echo 按 Ctrl+C 停止所有服务
echo ========================================
echo.

REM 使用 PowerShell 在新窗口中启动服务
cd hsd
start "HSD Server" cmd /k "npm start"
cd ..

cd ww
start "WW Server" cmd /k "npm start"
cd ..

echo.
echo 服务启动中，请等待...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   服务已启动！
echo ========================================
echo.
echo HSD 维护系统: http://localhost:3001
echo WW 游戏系统:   http://localhost:3000
echo.
echo 注意：两个服务分别在独立的窗口中运行
echo 关闭窗口即可停止对应服务
echo.
pause
