#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

// 启动开发服务器
function startDev() {
  console.log('🚀 启动 VibeGhost 开发环境...')
  
  const processes = []
  
  // 启动主应用 Vite 开发服务器
  console.log('📦 启动主应用开发服务器...')
  const mainViteProcess = spawn('npm', ['run', 'dev:renderer'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe'
  })
  
  mainViteProcess.stdout.on('data', (data) => {
    console.log(`[Main Vite] ${data.toString().trim()}`)
  })
  
  mainViteProcess.stderr.on('data', (data) => {
    console.error(`[Main Vite Error] ${data.toString().trim()}`)
  })
  
  processes.push(mainViteProcess)
  
  // 启动侧边栏 Vite 开发服务器
  console.log('📦 启动侧边栏开发服务器...')
  const sidebarViteProcess = spawn('npm', ['run', 'dev:sidebar'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe'
  })
  
  sidebarViteProcess.stdout.on('data', (data) => {
    console.log(`[Sidebar Vite] ${data.toString().trim()}`)
  })
  
  sidebarViteProcess.stderr.on('data', (data) => {
    console.error(`[Sidebar Vite Error] ${data.toString().trim()}`)
  })
  
  processes.push(sidebarViteProcess)
  
  // 等待 Vite 服务器启动完成后启动 Electron
  setTimeout(() => {
    console.log('⚡ 启动 Electron 主进程...')
    const electronProcess = spawn('npx', ['electron-vite', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe'
    })
    
    electronProcess.stdout.on('data', (data) => {
      console.log(`[Electron] ${data.toString().trim()}`)
    })
    
    electronProcess.stderr.on('data', (data) => {
      console.error(`[Electron Error] ${data.toString().trim()}`)
    })
    
    processes.push(electronProcess)
    
    // 监听进程退出
    electronProcess.on('close', (code) => {
      console.log(`\n🛑 Electron 进程退出，代码: ${code}`)
      processes.forEach(p => p.kill())
      process.exit(code)
    })
  }, 5000) // 增加等待时间确保所有服务器都启动完成
  
  // 监听所有进程
  processes.forEach((proc, index) => {
    proc.on('close', (code) => {
      if (code !== 0) {
        console.log(`\n🛑 进程 ${index} 退出，代码: ${code}`)
        processes.forEach(p => p.kill())
        process.exit(code)
      }
    })
  })
  
  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n🛑 停止所有开发服务器...')
    processes.forEach(p => p.kill())
    process.exit(0)
  })
}

startDev()