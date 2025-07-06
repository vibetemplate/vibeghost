import { BrowserWindow, BrowserView, screen, shell } from 'electron'
import { join } from 'path'
import { app } from 'electron'
import { TabManager } from './tab-manager'

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private sideView: BrowserView | null = null
  private tabManager: TabManager | null = null
  private sidebarWidth = 350
  private tabBarHeight = 0 // 实际高度：标签页栏32px + 工具栏32px + 边距8px

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
      // 窗口大小变化后强制验证布局
      if (this.tabManager) {
        setTimeout(() => this.tabManager!.triggerLayoutVerification(), 100)
        setTimeout(() => this.tabManager!.triggerLayoutVerification(), 500)
      }
    })

    this.mainWindow.on('move', () => {
      // 窗口移动后也验证布局
      if (this.tabManager) {
        setTimeout(() => this.tabManager!.triggerLayoutVerification(), 100)
      }
    })

    this.mainWindow.on('maximize', () => {
      // 窗口最大化后验证布局
      if (this.tabManager) {
        setTimeout(() => this.tabManager!.triggerLayoutVerification(), 200)
      }
    })

    this.mainWindow.on('unmaximize', () => {
      // 窗口取消最大化后验证布局
      if (this.tabManager) {
        setTimeout(() => this.tabManager!.triggerLayoutVerification(), 200)
      }
    })

    await this.setupViews(this.mainWindow)

    // 延迟创建默认标签页，确保所有组件都已初始化
    setTimeout(() => {
      this.createDefaultTab()
    }, 1000)

    return this.mainWindow
  }

  async setupViews(mainWindow: BrowserWindow): Promise<void> {
    if (!mainWindow) {
      console.error('❌ mainWindow 为空，无法设置视图')
      return
    }

    console.log('🔧 开始设置WindowManager视图...')

    try {
      // 创建侧边栏视图
      console.log('📱 创建侧边栏BrowserView...')
      this.sideView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: join(__dirname, '../preload/preload.js'),
          webSecurity: true
        }
      })

      // 初始化TabManager
      console.log('📊 初始化TabManager...')
      this.tabManager = new TabManager(mainWindow, 8)

      // 设置标签页区域边界
      this.tabManager.setTabAreaBounds({
        x: 0,
        y: this.tabBarHeight,
        width: 0,
        height: 0
      })

      console.log('🔗 添加侧边栏到主窗口...')
      mainWindow.addBrowserView(this.sideView)

      console.log('📐 更新视图布局...')
      this.updateViewLayout()
      
      console.log('📥 加载视图内容...')
      await this.loadViewContents()
      
      console.log('⚡ 设置视图事件监听器...')
      this.setupViewEvents()
      
      console.log('✅ WindowManager视图设置完成')
      
    } catch (error) {
      console.error('❌ 设置WindowManager视图失败:', error)
      console.error('错误详情:', error instanceof Error ? error.stack : error)
    }
  }

  private async loadViewContents(): Promise<void> {
    if (!this.sideView) {
      console.error('❌ SideView 未初始化，无法加载内容')
      return
    }

    try {
      console.log('🔄 开始加载侧边栏内容...')
      
      if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        const sidebarUrl = `${process.env['ELECTRON_RENDERER_URL']}/sidebar.html`
        console.log('📡 开发模式，加载URL:', sidebarUrl)
        await this.sideView.webContents.loadURL(sidebarUrl)
      } else {
        const sidebarPath = join(__dirname, '../renderer/sidebar.html')
        console.log('📁 生产模式，加载文件:', sidebarPath)
        await this.sideView.webContents.loadFile(sidebarPath)
      }
      console.log('✅ 侧边栏内容加载完成')
    } catch (error) {
      console.error('❌ 加载侧边栏内容失败:', error)
      console.error('错误详情:', error instanceof Error ? error.stack : error)
    }
  }

  private updateViewLayout(): void {
    if (!this.mainWindow || !this.sideView) {
      console.warn('⚠️  WindowManager或SideView未初始化，跳过布局更新')
      return
    }

    const contentBounds = this.mainWindow.getContentBounds()
    console.log('🏗️  WindowManager开始更新布局')
    console.log('  窗口内容边界:', contentBounds)
    console.log('  侧边栏宽度:', this.sidebarWidth)

    // 更新侧边栏布局 - 让侧边栏与TabHostApp并列显示
    const sidebarBounds = {
      x: contentBounds.width - this.sidebarWidth,
      y: 0, // 从窗口顶部开始，与TabHostApp并列
      width: this.sidebarWidth,
      height: contentBounds.height
    }
    
    console.log('📋 设置侧边栏bounds:', sidebarBounds)
    this.sideView.setBounds(sidebarBounds)

    // 更新标签页管理器布局
    if (this.tabManager) {
      const tabAreaBounds = {
        x: 0,
        y: this.tabBarHeight,
        width: contentBounds.width - this.sidebarWidth,
        height: contentBounds.height - this.tabBarHeight
      }
      
      console.log('🏗️  WindowManager - 更新标签页区域布局:')
      console.log('  🛡️  TabBar保护高度:', this.tabBarHeight)
      console.log('  📐 窗口内容边界:', contentBounds)
      console.log('  📋 标签页区域边界:', tabAreaBounds)
      
      this.tabManager.setTabAreaBounds(tabAreaBounds)
      
      // 通过bounds精确控制BrowserView位置，避免覆盖TabHostApp
      // 注意：移除setTopBrowserView(null)调用以避免TypeError
      console.log('🔒 WindowManager已更新布局，TabHostApp受保护')
    }
  }

  private setupViewEvents(): void {
    if (!this.mainWindow || !this.sideView || !this.tabManager) return

    this.sideView.webContents.on('dom-ready', () => {
      console.log('✅ 侧边栏内容加载完成')
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

  private async createDefaultTab(): Promise<void> {
    try {
      if (!this.tabManager) {
        console.warn('TabManager 未初始化，无法创建默认标签页')
        return
      }

      console.log('🚀 开始创建默认欢迎页面...')

      // 构建欢迎页面的文件路径
      const welcomeHtmlPath = app.isPackaged 
        ? join(process.resourcesPath, 'welcome.html')
        : join(__dirname, '../../resources/welcome.html')

      console.log('📁 欢迎页面路径:', welcomeHtmlPath)

      // 欢迎页面配置
      const welcomeWebsite = {
        id: 'welcome',
        name: 'VibeGhost - 欢迎',
        url: `file://${welcomeHtmlPath}`,
        description: 'VibeGhost AI提示词助手欢迎页面',
        icon: '🚀',
        category: 'local',
        tags: ['欢迎', '首页', '导航'],
        isActive: true
      }

      // 创建默认标签页
      const defaultTab = await this.tabManager.createTab(welcomeWebsite)
      console.log('✅ 欢迎页面已创建:', defaultTab.title)
      console.log('📊 当前标签页数量:', this.tabManager.getTabCount())
    } catch (error) {
      console.error('❌ 创建欢迎页面失败:', error)
      console.error('错误详情:', error instanceof Error ? error.stack : error)
      
      // 降级到DeepSeek页面
      try {
        console.log('🔄 降级到DeepSeek默认页面...')
        const fallbackWebsite = {
          id: 'deepseek',
          name: 'DeepSeek',
          url: 'https://chat.deepseek.com/',
          description: '深度求索AI对话助手',
          icon: '🤖',
          category: 'domestic',
          tags: ['对话', '编程', '推理'],
          isActive: true
        }
        
        const fallbackTab = await this.tabManager.createTab(fallbackWebsite)
        console.log('✅ 降级页面已创建:', fallbackTab.title)
      } catch (fallbackError) {
        console.error('❌ 降级页面创建也失败:', fallbackError)
        
        // 最后尝试重新创建
        setTimeout(() => {
          console.log('🔄 2秒后重试创建默认标签页...')
          this.createDefaultTab()
        }, 2000)
      }
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