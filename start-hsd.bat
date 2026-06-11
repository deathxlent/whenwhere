@echo off
chcp 65001 >nul
echo ========================================
echo   启动 HSD (heshidi) 维护系统
echo ========================================
echo.

cd /d "%~dp0hsd"

if not exist "node_modules" (
    echo [1/2] 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败！
        pause
        exit /b 1
    )
)

if not exist "..\ww\db\whenwhere.db" (
    echo [2/2] 正在初始化数据库...
    call npm run init-db
    if errorlevel 1 (
        echo 数据库初始化失败！
        pause
        exit /b 1
    )
)

echo.
echo 正在启动服务...
echo.
call npm start
pause
