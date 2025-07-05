import { BrowserWindow, BrowserView, screen, shell } from 'electron'
import { join } from 'path'
import { app } from 'electron'
import { TabManager } from './tab-manager'

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private sideView: BrowserView | null = null
  private tabManager: TabManager | null = null
  private sidebarWidth = 350
  private tabBarHeight = 80 // 增加高度为标签页栏和工具栏预留空间

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
      show: true,
      // 确保主窗口内容可以覆盖BrowserView
      alwaysOnTop: false
    })

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
      this.mainWindow?.focus()
      this.mainWindow?.moveTop()
    })

    this.mainWindow.on('closed', () => {
      this.tabManager?.destroy()
      this.tabManager = null
      this.mainWindow = null
      this.sideView = null
    })

    this.mainWindow.on('resize', () => {
      this.updateViewLayout()
    })

    return this.mainWindow
  }

  async setupViews(mainWindow: BrowserWindow): Promise<void> {
    if (!mainWindow) return

    // 创建侧边栏视图
    this.sideView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js'),
        webSecurity: true
      }
    })

    // 初始化TabManager
    this.tabManager = new TabManager(mainWindow, 8)

    // 设置标签页区域边界
    this.tabManager.setTabAreaBounds({
      x: 0,
      y: this.tabBarHeight,
      width: 0,
      height: 0
    })

    mainWindow.addBrowserView(this.sideView)

    this.updateViewLayout()
    await this.loadViewContents()
    this.setupViewEvents()
  }

  private async loadViewContents(): Promise<void> {
    if (!this.sideView) return

    try {
      if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        await this.sideView.webContents.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/sidebar.html`)
      } else {
        await this.sideView.webContents.loadFile(
          join(__dirname, '../renderer/sidebar.html')
        )
      }
      console.log('侧边栏内容加载完成')
    } catch (error) {
      console.error('加载视图内容失败:', error)
    }
  }

  private updateViewLayout(): void {
    if (!this.mainWindow || !this.sideView) return

    const contentBounds = this.mainWindow.getContentBounds()

    // 更新侧边栏布局 - 为TabHostApp预留顶部空间
    this.sideView.setBounds({
      x: contentBounds.width - this.sidebarWidth,
      y: this.tabBarHeight, // 从标签栏高度开始，不覆盖TabHostApp
      width: this.sidebarWidth,
      height: contentBounds.height - this.tabBarHeight
    })

    // 更新标签页管理器布局
    if (this.tabManager) {
      this.tabManager.setTabAreaBounds({
        x: 0,
        y: this.tabBarHeight,
        width: contentBounds.width - this.sidebarWidth,
        height: contentBounds.height - this.tabBarHeight
      })
    }
  }

  private setupViewEvents(): void {
    if (!this.sideView) return

    this.sideView.webContents.on('dom-ready', () => {
      console.log('侧边栏加载完成')
      if (process.env.NODE_ENV === 'development') {
        this.sideView?.webContents.openDevTools({ mode: 'detach' })
      }
    })

    this.sideView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('侧边栏加载失败:', errorCode, errorDescription)
    })

    this.sideView.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  setSidebarWidth(width: number): void {
    this.sidebarWidth = Math.max(200, Math.min(600, width))
    this.updateViewLayout()
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  getTabManager(): TabManager | null {
    return this.tabManager
  }

  getSideView(): BrowserView | null {
    return this.sideView
  }

  async switchToSite(url: string): Promise<void> {
    // 通过标签页管理器处理网站切换
    const activeTab = this.tabManager?.getActiveTab()
    if (activeTab) {
      await this.tabManager?.navigateTab(activeTab.id, url)
    }
  }

  refreshActiveTab(): void {
    const activeTab = this.tabManager?.getActiveTab()
    if (activeTab && this.mainWindow) {
      this.mainWindow.webContents.send('tab-navigation', {
        tabId: activeTab.id,
        action: 'reload'
      })
    }
  }

  refreshSideView(): void {
    if (this.sideView) {
      this.sideView.webContents.reload()
    }
  }

  getViewState() {
    const activeTab = this.tabManager?.getActiveTab()
    return {
      activeTabUrl: activeTab?.url || '',
      activeTabTitle: activeTab?.title || '',
      sideViewUrl: this.sideView?.webContents.getURL() || '',
      sidebarWidth: this.sidebarWidth,
      windowBounds: this.mainWindow?.getBounds() || null,
      tabCount: this.tabManager?.getTabCount() || 0
    }
  }
}