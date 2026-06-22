#!/bin/bash

echo "========================================"
echo "  WhenWhere 一键启动脚本 (Linux/macOS)"
echo "========================================"
echo ""

# 检查服务是否已启动
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[警告] 端口 3001 已被占用，HSD 可能已在运行"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[警告] 端口 3000 已被占用，WW 可能已在运行"
fi

echo ""
echo "启动 HSD 维护系统 (端口 3001)..."
echo "启动 WW 游戏系统 (端口 3000)..."
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "========================================"
echo ""

# 创建临时文件存储 PID
PID_FILE=$(mktemp)

# 清理函数
cleanup() {
    echo ""
    echo "正在停止服务..."
    if [ -f "$PID_FILE" ]; then
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null
                echo "已停止进程 $pid"
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    exit 0
}

# 捕获信号
trap cleanup SIGINT SIGTERM EXIT

# 启动 HSD
cd hsd
npm start &
HSD_PID=$!
echo $HSD_PID >> "$PID_FILE"
echo "HSD 已启动 (PID: $HSD_PID)"

cd ..

# 启动 WW
cd ww
npm start &
WW_PID=$!
echo $WW_PID >> "$PID_FILE"
echo "WW 已启动 (PID: $WW_PID)"

cd ..

echo ""
echo "========================================"
echo "  服务已启动！"
echo "========================================"
echo ""
echo "HSD 维护系统: http://localhost:3001"
echo "WW 游戏系统:   http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待进程
wait
