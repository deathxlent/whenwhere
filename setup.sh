#!/bin/bash

set -e

echo "========================================"
echo "  WhenWhere 一键安装脚本 (Linux/macOS)"
echo "========================================"
echo ""

# 检查 Node.js
echo "[1/6] 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 20.x 或更高版本"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "Node.js 版本: $NODE_VERSION"

# 检查 npm
echo "[2/6] 检查 npm..."
if ! command -v npm &> /dev/null; then
    echo "[错误] 未检测到 npm，请重新安装 Node.js"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "npm 版本: $NPM_VERSION"
echo ""

# 安装 HSD 依赖
echo "[3/6] 安装 HSD 依赖..."
cd hsd
if [ -d "node_modules" ]; then
    echo "检测到已存在 node_modules，跳过安装"
else
    npm install
    echo "HSD 依赖安装完成"
fi

# 初始化 HSD 数据库
echo "[4/6] 初始化 HSD 数据库..."
if [ -f "db/hsd.db" ]; then
    echo "检测到已存在数据库，跳过初始化"
else
    mkdir -p db
    npm run init-db
    echo "HSD 数据库初始化完成"
fi

cd ..

# 安装 WW 依赖
echo "[5/6] 安装 WW 依赖..."
cd ww
if [ -d "node_modules" ]; then
    echo "检测到已存在 node_modules，跳过安装"
else
    npm install
    echo "WW 依赖安装完成"
fi

# 初始化 WW 数据库
echo "[6/6] 初始化 WW 数据库..."
if [ -f "db/whenwhere.db" ]; then
    echo "检测到已存在数据库，跳过初始化"
else
    mkdir -p db
    npm run init-db
    echo "WW 数据库初始化完成"
fi

cd ..

# 创建必要目录
echo ""
echo "创建必要目录..."
mkdir -p hsd/static/images
mkdir -p hsd/static/exports
mkdir -p ww/static/images
mkdir -p ww/static/tiles
mkdir -p ww/static/geojson

# 检查 HSD 配置文件
if [ ! -f "hsd/server/config.json" ]; then
    echo ""
    echo "创建 HSD 配置文件模板..."
    cat > hsd/server/config.json << 'EOF'
{
  "server": {
    "port": 3001
  },
  "llm": {
    "apiKey": "your-api-key-here",
    "baseURL": "https://api.openai.com/v1",
    "model": "gpt-4o-mini",
    "maxTokens": 1000,
    "temperature": 0.3
  },
  "paths": {
    "images": "static/images/",
    "exports": "static/exports/"
  }
}
EOF
    echo "请编辑 hsd/server/config.json 配置 LLM API（可选）"
fi

echo ""
echo "========================================"
echo "  安装完成！"
echo "========================================"
echo ""
echo "HSD 维护系统: http://localhost:3001"
echo "WW 游戏系统:   http://localhost:3000"
echo ""
echo "启动服务请运行: ./start.sh"
echo ""
