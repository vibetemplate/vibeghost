import { BrowserWindow, BrowserView, screen } from 'electron'
import { join } from 'path'
import { AppConfig } from '../shared/types'

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private mainView: BrowserView | null = null
  private sideView: BrowserView | null = null
  private sidebarWidth = 350

  async createMainWindow(): Promise<BrowserWindow> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    
    this.mainWindow = new BrowserWindow({
      width: Math.min(1400, width - 100),
      height: Math.min(900, height - 100),
      minWidth: 800,
      minHeight: 600,
      frame: true,
      titleBarStyle: 'default',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false
      },
      show: true  // 直接显示窗口
    })

    // 窗口准备就绪后显示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
      this.mainWindow?.focus()
      this.mainWindow?.moveTop()
    })

    // 窗口关闭时清理
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
      this.mainView = null
      this.sideView = null
    })

    // 监听窗口大小变化
    this.mainWindow.on('resize', () => {
      this.updateViewLayout()
    })

    return this.mainWindow
  }

  async setupDualViews(mainWindow: BrowserWindow): Promise<void> {
    if (!mainWindow) return

    // 创建侧边栏视图（提示词库）
    this.sideView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js'),
        webSecurity: true
      }
    })

    // 创建主内容视图（AI网站）
    this.mainView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        webSecurity: false, // 需要禁用以支持跨域注入
        allowRunningInsecureContent: true,
        partition: 'persist:main' // 持久化 session，保持登录状态
      }
    })

    // 设置 User-Agent 和更多 headers 避免安全检查
    this.mainView.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')
    
    // 设置额外的请求头
    this.mainView.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      details.requestHeaders['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8'
      details.requestHeaders['Accept-Encoding'] = 'gzip, deflate, br'
      details.requestHeaders['Cache-Control'] = 'no-cache'
      details.requestHeaders['Pragma'] = 'no-cache'
      details.requestHeaders['Sec-Ch-Ua'] = '"Not_A Brand";v="8", "Chromium";v="121", "Google Chrome";v="121"'
      details.requestHeaders['Sec-Ch-Ua-Mobile'] = '?0'
      details.requestHeaders['Sec-Ch-Ua-Platform'] = '"macOS"'
      details.requestHeaders['Sec-Fetch-Dest'] = 'document'
      details.requestHeaders['Sec-Fetch-Mode'] = 'navigate'
      details.requestHeaders['Sec-Fetch-Site'] = 'none'
      details.requestHeaders['Sec-Fetch-User'] = '?1'
      details.requestHeaders['Upgrade-Insecure-Requests'] = '1'
      callback({ requestHeaders: details.requestHeaders })
    })

    // 添加视图到窗口
    mainWindow.addBrowserView(this.sideView)
    mainWindow.addBrowserView(this.mainView)

    // 设置初始布局
    this.updateViewLayout()

    // 加载内容
    await this.loadViewContents()

    // 设置视图事件监听
    this.setupViewEvents()
  }

  private async loadViewContents(): Promise<void> {
    if (!this.sideView || !this.mainView) return

    try {
      // 加载侧边栏内容（提示词库应用）
      if (process.env.NODE_ENV === 'development') {
        // 使用应急调试面板
        await this.sideView.webContents.loadFile(join(__dirname, '..', '..', 'emergency-debug.html'))
      } else {
        await this.sideView.webContents.loadFile(
          join(__dirname, '../renderer/sidebar.html')
        )
      }

      // 加载默认AI网站（左侧主视图）
      await this.mainView.webContents.loadURL('https://chat.deepseek.com')
    } catch (error) {
      console.error('加载视图内容失败:', error)
    }
  }

  private updateViewLayout(): void {
    if (!this.mainWindow || !this.sideView || !this.mainView) return

    const bounds = this.mainWindow.getBounds()
    const contentBounds = this.mainWindow.getContentBounds()

    // 主视图布局 (左侧 - AI网站)
    this.mainView.setBounds({
      x: 0,
      y: 0,
      width: contentBounds.width - this.sidebarWidth,
      height: contentBounds.height
    })

    // 侧边栏视图布局 (右侧 - 提示词库)
    this.sideView.setBounds({
      x: contentBounds.width - this.sidebarWidth,
      y: 0,
      width: this.sidebarWidth,
      height: contentBounds.height
    })
  }

  private setupViewEvents(): void {
    if (!this.sideView || !this.mainView) return

    // 侧边栏视图事件
    this.sideView.webContents.on('dom-ready', () => {
      console.log('侧边栏加载完成')
      // 开发模式下自动打开开发者工具
      if (process.env.NODE_ENV === 'development') {
        this.sideView?.webContents.openDevTools({ mode: 'detach' })
      }
    })

    this.sideView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('侧边栏加载失败:', errorCode, errorDescription)
    })

    // 主视图事件
    this.mainView.webContents.on('dom-ready', () => {
      console.log('主视图加载完成')
    })

    this.mainView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('主视图加载失败:', errorCode, errorDescription)
    })

    // 新窗口处理
    this.mainView.webContents.setWindowOpenHandler(({ url }) => {
      // 在系统默认浏览器中打开外部链接
      require('electron').shell.openExternal(url)
      return { action: 'deny' }
    })

    // 导航事件
    this.mainView.webContents.on('will-navigate', (event, navigationUrl) => {
      // 可以在这里添加导航控制逻辑
      console.log('导航到:', navigationUrl)
    })
  }

  // 调整侧边栏宽度
  setSidebarWidth(width: number): void {
    this.sidebarWidth = Math.max(200, Math.min(600, width))
    this.updateViewLayout()
  }

  // 获取主窗口
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  // 获取主视图
  getMainView(): BrowserView | null {
    return this.mainView
  }

  // 获取侧视图
  getSideView(): BrowserView | null {
    return this.sideView
  }

  // 切换到指定网站
  async switchToSite(url: string): Promise<void> {
    if (this.mainView) {
      await this.mainView.webContents.loadURL(url)
    }
  }

  // 刷新主视图
  refreshMainView(): void {
    if (this.mainView) {
      this.mainView.webContents.reload()
    }
  }

  // 刷新侧视图
  refreshSideView(): void {
    if (this.sideView) {
      this.sideView.webContents.reload()
    }
  }

  // 获取当前视图状态
  getViewState() {
    return {
      mainViewUrl: this.mainView?.webContents.getURL() || '',
      sideViewUrl: this.sideView?.webContents.getURL() || '',
      sidebarWidth: this.sidebarWidth,
      windowBounds: this.mainWindow?.getBounds() || null
    }
  }
}