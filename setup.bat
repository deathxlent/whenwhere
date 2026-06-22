@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   WhenWhere 一键安装脚本 (Windows)
echo ========================================
echo.

REM 检查 Node.js
echo [1/6] 检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 20.x 或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js 版本: %NODE_VERSION%

REM 检查 npm
echo [2/6] 检查 npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 npm，请重新安装 Node.js
    pause
    exit /b 1
)

for /f "delims=" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm 版本: %NPM_VERSION%
echo.

REM 安装 HSD 依赖
echo [3/6] 安装 HSD 依赖...
cd hsd
if exist node_modules (
    echo 检测到已存在 node_modules，跳过安装
) else (
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] HSD 依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo HSD 依赖安装完成
)

REM 初始化 HSD 数据库
echo [4/6] 初始化 HSD 数据库...
if exist db\hsd.db (
    echo 检测到已存在数据库，跳过初始化
) else (
    if not exist db mkdir db
    call npm run init-db
    if %errorlevel% neq 0 (
        echo [警告] HSD 数据库初始化失败，请手动执行 npm run init-db
    ) else (
        echo HSD 数据库初始化完成
    )
)

cd ..

REM 安装 WW 依赖
echo [5/6] 安装 WW 依赖...
cd ww
if exist node_modules (
    echo 检测到已存在 node_modules，跳过安装
) else (
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] WW 依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo WW 依赖安装完成
)

REM 初始化 WW 数据库
echo [6/6] 初始化 WW 数据库...
if exist db\whenwhere.db (
    echo 检测到已存在数据库，跳过初始化
) else (
    if not exist db mkdir db
    call npm run init-db
    if %errorlevel% neq 0 (
        echo [警告] WW 数据库初始化失败，请手动执行 npm run init-db
    ) else (
        echo WW 数据库初始化完成
    )
)

cd ..

REM 创建必要目录
echo.
echo 创建必要目录...
if not exist hsd\static\images mkdir hsd\static\images
if not exist hsd\static\exports mkdir hsd\static\exports
if not exist ww\static\images mkdir ww\static\images
if not exist ww\static\tiles mkdir ww\static\tiles
if not exist ww\static\geojson mkdir ww\static\geojson

REM 检查 HSD 配置文件
if not exist hsd\server\config.json (
    echo.
    echo 创建 HSD 配置文件模板...
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
    echo 请编辑 hsd\server\config.json 配置 LLM API（可选）
)

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo HSD 维护系统: http://localhost:3001
echo WW 游戏系统:   http://localhost:3000
echo.
echo 启动服务请运行: start.bat
echo.
pause
