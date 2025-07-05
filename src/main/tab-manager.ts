import { BrowserView, BrowserWindow, ipcMain, shell } from 'electron'
import { AITab, WebsiteInfo, BrowserNavigationState } from '../shared/types'
import { v4 as uuidv4 } from 'uuid'

export class TabManager {
  private mainWindow: BrowserWindow | null = null
  private tabs: Map<string, AITab> = new Map()
  private tabViews: Map<string, BrowserView> = new Map()
  private activeTabId: string | null = null
  private maxTabs: number = 8
  private tabAreaBounds = { x: 0, y: 40, width: 0, height: 0 } // 预留标签栏高度

  constructor(mainWindow: BrowserWindow, maxTabs: number = 8) {
    this.mainWindow = mainWindow
    this.maxTabs = maxTabs
    this.setupIPC()
    console.log('TabManager 初始化完成')
  }

  private setupIPC(): void {
    // 创建新标签页
    ipcMain.handle('create-tab', async (event, data: { website: WebsiteInfo }) => {
      try {
        const tab = await this.createTab(data.website)
        return { success: true, tab }
      } catch (error) {
        console.error('创建标签页失败:', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // 关闭标签页
    ipcMain.handle('close-tab', async (event, data: { tabId: string }) => {
      try {
        await this.closeTab(data.tabId)
        return { success: true }
      } catch (error) {
        console.error('关闭标签页失败:', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // 切换标签页
    ipcMain.handle('switch-tab', async (event, data: { tabId: string }) => {
      try {
        await this.switchToTab(data.tabId)
        return { success: true }
      } catch (error) {
        console.error('切换标签页失败:', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // 获取所有标签页
    ipcMain.handle('get-tabs', () => {
      return {
        tabs: Array.from(this.tabs.values()),
        activeTabId: this.activeTabId
      }
    })

    // 标签页导航操作
    ipcMain.handle('tab-navigation', async (event, data: { 
      tabId: string, 
      action: 'back' | 'forward' | 'reload' | 'stop' | 'navigate',
      url?: string
    }) => {
      try {
        const view = this.tabViews.get(data.tabId)
        if (!view) throw new Error('标签页不存在')

        switch (data.action) {
          case 'back':
            if (view.webContents.canGoBack()) {
              view.webContents.goBack()
            }
            break
          case 'forward':
            if (view.webContents.canGoForward()) {
              view.webContents.goForward()
            }
            break
          case 'reload':
            view.webContents.reload()
            break
          case 'stop':
            view.webContents.stop()
            break
          case 'navigate':
            if (data.url) {
              await view.webContents.loadURL(data.url)
            }
            break
        }
        return { success: true }
      } catch (error) {
        console.error('标签页导航失败:', error)
        return { success: false, error: (error as Error).message }
      }
    })
  }

  async createTab(website: WebsiteInfo): Promise<AITab> {
    if (this.tabs.size >= this.maxTabs) {
      throw new Error(`最多只能打开${this.maxTabs}个标签页`)
    }

    const tabId = uuidv4()
    const now = new Date()

    // 创建标签页数据
    const tab: AITab = {
      id: tabId,
      websiteId: website.id,
      websiteName: website.name,
      websiteIcon: website.icon || '🌐',
      url: website.url,
      title: website.name,
      isActive: false,
      isLoading: true,
      createdAt: now,
      lastActivatedAt: now
    }

    // 创建BrowserView
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        webSecurity: false,
        allowRunningInsecureContent: true,
        partition: `persist:tab-${tabId}`
      }
    })

    // 设置用户代理
    view.webContents.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    )

    // 配置请求头
    view.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      details.requestHeaders['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8'
      details.requestHeaders['Accept-Encoding'] = 'gzip, deflate, br'
      details.requestHeaders['Cache-Control'] = 'no-cache'
      details.requestHeaders['Pragma'] = 'no-cache'
      callback({ requestHeaders: details.requestHeaders })
    })

    // 设置事件监听
    this.setupTabEvents(view, tab)

    // 存储标签页和视图
    this.tabs.set(tabId, tab)
    this.tabViews.set(tabId, view)
    tab.webContentsId = view.webContents.id

    // 添加到窗口
    if (this.mainWindow) {
      this.mainWindow.addBrowserView(view)
    }

    try {
      // 加载网站
      await view.webContents.loadURL(website.url)
      console.log(`标签页创建成功: ${website.name} (${tabId})`)
    } catch (error) {
      console.error(`加载网站失败: ${website.url}`, error)
      // 即使加载失败也保留标签页
    }

    // 自动切换到新创建的标签页
    await this.switchToTab(tabId)

    // 通知渲染进程
    this.notifyTabCreated(tab)

    return tab
  }

  private setupTabEvents(view: BrowserView, tab: AITab): void {
    const webContents = view.webContents

    // 页面开始加载
    webContents.on('did-start-loading', () => {
      tab.isLoading = true
      this.updateTab(tab.id, { isLoading: true })
      this.notifyNavigationStateChanged(tab.id)
    })

    // 页面加载完成
    webContents.on('did-finish-loading', () => {
      tab.isLoading = false
      tab.title = webContents.getTitle() || tab.websiteName
      tab.url = webContents.getURL()
      this.updateTab(tab.id, { 
        isLoading: false, 
        title: tab.title,
        url: tab.url
      })
      this.notifyNavigationStateChanged(tab.id)
      console.log(`标签页加载完成: ${tab.title} (${tab.id})`)
    })

    // 页面加载失败
    webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`标签页加载失败 (${tab.id}):`, errorCode, errorDescription, validatedURL)
      tab.isLoading = false
      tab.title = `加载失败: ${tab.websiteName}`
      this.updateTab(tab.id, { 
        isLoading: false, 
        title: tab.title 
      })
      this.notifyNavigationStateChanged(tab.id)
    })

    // 标题变化
    webContents.on('page-title-updated', (event, title) => {
      tab.title = title || tab.websiteName
      this.updateTab(tab.id, { title: tab.title })
    })

    // 导航事件
    webContents.on('will-navigate', (event, navigationUrl) => {
      console.log(`标签页导航 (${tab.id}): ${navigationUrl}`)
      tab.url = navigationUrl
      this.updateTab(tab.id, { url: navigationUrl })
    })

    // 处理新窗口打开
    webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    // 上下文菜单
    webContents.on('context-menu', () => {
      // 可以在这里添加右键菜单逻辑
    })
  }

  async closeTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId)
    const view = this.tabViews.get(tabId)

    if (!tab || !view) {
      console.warn(`尝试关闭不存在的标签页: ${tabId}`)
      return
    }

    console.log(`正在关闭标签页: ${tab.title} (${tabId})`)

    // 先从数据结构中移除，避免重复操作
    this.tabs.delete(tabId)
    this.tabViews.delete(tabId)

    // 如果是当前活跃标签，需要处理活跃状态
    let needSwitchTab = false
    let nextTabId: string | null = null

    if (this.activeTabId === tabId) {
      const remainingTabs = Array.from(this.tabs.keys())
      if (remainingTabs.length > 0) {
        nextTabId = remainingTabs[0] // 切换到第一个剩余标签
        needSwitchTab = true
      } else {
        this.activeTabId = null
      }
    }

    try {
      // 安全地从窗口移除视图
      if (this.mainWindow && this.mainWindow.getBrowserViews().includes(view)) {
        this.mainWindow.removeBrowserView(view)
      }
    } catch (error) {
      console.warn(`移除BrowserView时出错: ${error}`)
    }

    try {
      // 安全地销毁WebContents
      if (!view.webContents.isDestroyed()) {
        view.webContents.destroy()
      }
    } catch (error) {
      console.warn(`销毁WebContents时出错: ${error}`)
    }

    // 如果需要切换标签，在清理完成后进行
    if (needSwitchTab && nextTabId) {
      try {
        await this.switchToTab(nextTabId)
      } catch (error) {
        console.error(`切换标签页失败: ${error}`)
        this.activeTabId = null
      }
    }

    // 通知渲染进程
    this.notifyTabClosed(tabId)

    console.log(`标签页已关闭: ${tab.title} (${tabId})`)
  }

  async switchToTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId)
    const view = this.tabViews.get(tabId)

    if (!tab || !view) {
      throw new Error('标签页不存在')
    }

    // 隐藏当前活跃标签页
    if (this.activeTabId && this.activeTabId !== tabId) {
      const currentView = this.tabViews.get(this.activeTabId)
      if (currentView) {
        currentView.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      }
      const currentTab = this.tabs.get(this.activeTabId)
      if (currentTab) {
        currentTab.isActive = false
        this.updateTab(this.activeTabId, { isActive: false })
      }
    }

    // 激活新标签页
    tab.isActive = true
    tab.lastActivatedAt = new Date()
    this.activeTabId = tabId

    // 更新视图布局
    this.updateTabViewLayout(view)

    // 确保视图可见，但不要覆盖主窗口的React内容
    // 注释掉setTopBrowserView，它会覆盖主窗口内容
    // if (this.mainWindow) {
    //   this.mainWindow.setTopBrowserView(view)
    // }

    // 更新标签页数据
    this.updateTab(tabId, { 
      isActive: true, 
      lastActivatedAt: tab.lastActivatedAt 
    })

    // 通知导航状态变化
    this.notifyNavigationStateChanged(tabId)

    console.log(`切换到标签页: ${tab.title} (${tabId})`)
  }

  private updateTabViewLayout(view: BrowserView): void {
    if (!this.mainWindow) return

    const contentBounds = this.mainWindow.getContentBounds()
    const sidebarWidth = 350 // 与WindowManager保持一致

    view.setBounds({
      x: this.tabAreaBounds.x,
      y: this.tabAreaBounds.y,
      width: contentBounds.width - sidebarWidth,
      height: contentBounds.height - this.tabAreaBounds.y
    })
  }

  updateLayout(): void {
    if (this.activeTabId) {
      const view = this.tabViews.get(this.activeTabId)
      if (view) {
        this.updateTabViewLayout(view)
      }
    }
  }

  setTabAreaBounds(bounds: { x: number, y: number, width: number, height: number }): void {
    this.tabAreaBounds = bounds
    this.updateLayout()
  }

  private updateTab(tabId: string, updates: Partial<AITab>): void {
    const tab = this.tabs.get(tabId)
    if (tab) {
      Object.assign(tab, updates)
      this.tabs.set(tabId, tab)
      
      // 通知渲染进程
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('tab-updated', { tabId, updates })
      }
    }
  }

  private notifyTabCreated(tab: AITab): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('tab-created', tab)
    }
  }

  private notifyTabClosed(tabId: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('tab-closed', { tabId })
    }
  }

  private notifyNavigationStateChanged(tabId: string): void {
    const view = this.tabViews.get(tabId)
    if (!view || !this.mainWindow || this.mainWindow.isDestroyed()) return

    const state: BrowserNavigationState = {
      canGoBack: view.webContents.canGoBack(),
      canGoForward: view.webContents.canGoForward(),
      isLoading: view.webContents.isLoading(),
      currentUrl: view.webContents.getURL(),
      title: view.webContents.getTitle()
    }

    this.mainWindow.webContents.send('navigation-state-changed', { tabId, state })
  }

  // 公共接口
  getAllTabs(): AITab[] {
    return Array.from(this.tabs.values())
  }

  getActiveTab(): AITab | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null
  }

  getActiveTabId(): string | null {
    return this.activeTabId
  }

  getTabCount(): number {
    return this.tabs.size
  }

  hasTab(tabId: string): boolean {
    return this.tabs.has(tabId)
  }

  getTabById(tabId: string): AITab | null {
    return this.tabs.get(tabId) || null
  }

  async navigateTab(tabId: string, url: string): Promise<void> {
    const view = this.tabViews.get(tabId)
    if (!view) {
      throw new Error('标签页不存在')
    }
    await view.webContents.loadURL(url)
  }

  // 清理所有标签页
  async closeAllTabs(): Promise<void> {
    const tabIds = Array.from(this.tabs.keys())
    for (const tabId of tabIds) {
      try {
        await this.closeTab(tabId)
      } catch (error) {
        console.warn(`关闭标签页时出错 (${tabId}):`, error)
      }
    }
  }

  // 销毁TabManager
  destroy(): void {
    // 标记为正在销毁，避免通知已销毁的窗口
    this.mainWindow = null
    
    // 清理所有标签页
    this.closeAllTabs()
    
    // 移除IPC监听器
    ipcMain.removeAllListeners('create-tab')
    ipcMain.removeAllListeners('close-tab')
    ipcMain.removeAllListeners('switch-tab')
    ipcMain.removeAllListeners('get-tabs')
    ipcMain.removeAllListeners('tab-navigation')
    
    console.log('TabManager 已销毁')
  }
}