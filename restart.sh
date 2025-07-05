#!/bin/bash

echo "🔄 重启 VibeGhost..."

# 杀死所有相关进程
pkill -f "vite.*5173"
pkill -f "vite.*5174"  
pkill -f "electron"
pkill -f "start.sh"

sleep 3

echo "🚀 重新启动..."
./start.sh