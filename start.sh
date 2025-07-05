#!/bin/bash

echo "🚀 启动 VibeGhost AI提示词助手..."

# 杀死可能存在的进程
pkill -f "vite.*8173"
pkill -f "vite.*8174"  
pkill -f "electron-vite"

# 等待端口释放
sleep 2

echo "📦 启动主应用服务器..."
npm run dev:renderer &
RENDERER_PID=$!

echo "📦 启动侧边栏服务器..."
npm run dev:sidebar &
SIDEBAR_PID=$!

echo "⏳ 等待服务器启动..."
sleep 5

echo "⚡ 启动 Electron 应用..."
npx electron-vite dev &
ELECTRON_PID=$!

echo "✅ 所有服务已启动"
echo "   - 主应用: http://localhost:8173"
echo "   - 侧边栏: http://localhost:8174"
echo "   - Electron应用已运行"

# 等待用户输入来停止所有服务
echo ""
echo "按 Ctrl+C 停止所有服务..."

# 捕获中断信号
trap 'echo "🛑 停止所有服务..."; kill $RENDERER_PID $SIDEBAR_PID $ELECTRON_PID 2>/dev/null; exit 0' INT

# 保持脚本运行
wait