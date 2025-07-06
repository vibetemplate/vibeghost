import { BrowserView, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
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
    
    // 启动布局验证守护进程
    this.startLayoutVerification()
    
    console.log('TabManager 初始化完成，布局保护已激活')
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
      const result = {
        tabs: Array.from(this.tabs.values()),
        activeTabId: this.activeTabId
      }
      console.log(`📤 后端返回标签页数据: ${result.tabs.length} tabs, activeTabId: ${result.activeTabId}`)
      console.log(`📊 标签页详情:`, result.tabs.map(tab => `${tab.websiteName}(${tab.id.slice(0,8)}, active: ${tab.isActive})`))
      return result
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
    // 强制单一标签页模式：创建前关闭所有旧标签页
    if (this.tabs.size > 0) {
      console.log('🔄 强制单页模式，正在关闭所有现有标签页...')
      await this.closeAllTabs()
      console.log('✅ 所有旧标签页已关闭')
    }

    console.log(`🆕 创建新标签页: ${website.name} (${website.url})`)
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

    // 判断是否为本地文件
    const isLocalFile = website.url.startsWith('file://')
    
    // 创建BrowserView
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: isLocalFile,  // 本地文件允许Node集成
        contextIsolation: !isLocalFile, // 本地文件不需要上下文隔离
        webSecurity: !isLocalFile,     // 本地文件禁用web安全限制
        allowRunningInsecureContent: true,
        partition: isLocalFile ? 'persist:local' : 'persist:vibeghost_sites',
        preload: isLocalFile ? join(__dirname, '../preload/preload.js') : undefined
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

    // 先设置正确的布局bounds，避免添加时覆盖TabHostApp
    if (this.mainWindow) {
      const contentBounds = this.mainWindow.getContentBounds()
      const sidebarWidth = 350
      const tabHostHeight = this.tabAreaBounds.y

      // 预先计算正确的布局bounds
      const correctBounds = {
        x: 0,
        y: tabHostHeight,
        width: Math.max(100, contentBounds.width - sidebarWidth),
        height: Math.max(100, contentBounds.height - tabHostHeight)
      }

      console.log(`🔧 预设BrowserView布局 (${tabId}):`, correctBounds)
      
      // 先设置bounds再添加到窗口，防止默认覆盖行为
      view.setBounds(correctBounds)
      this.mainWindow.addBrowserView(view)
      
      // 立即强制验证布局是否正确
      setTimeout(() => {
        const actualBounds = view.getBounds()
        console.log(`🔍 创建后验证布局 (${tabId}):`, actualBounds)
        
        if (actualBounds.y < tabHostHeight || actualBounds.y !== correctBounds.y) {
          console.error(`❌ 创建后布局错误，强制修正 (${tabId})`)
          view.setBounds(correctBounds)
          
          // 再次验证
          setTimeout(() => {
            const finalBounds = view.getBounds()
            console.log(`🔍 二次验证布局 (${tabId}):`, finalBounds)
          }, 50)
        }
      }, 10)
      
      console.log(`✅ BrowserView已添加并设置正确布局 (${tabId})`)
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

    // 创建完成后多次验证布局，确保万无一失
    setTimeout(() => {
      this.triggerLayoutVerification()
    }, 100)
    
    setTimeout(() => {
      this.triggerLayoutVerification()
    }, 500)
    
    setTimeout(() => {
      this.triggerLayoutVerification()
    }, 1000)

    return tab
  }

  private setupTabEvents(view: BrowserView, tab: AITab): void {
    const webContents = view.webContents

    // 超时机制：15秒后强制结束loading状态
    const loadingTimeout = setTimeout(() => {
      if (tab.isLoading) {
        console.log(`标签页加载超时，强制结束loading状态 (${tab.id})`)
        tab.isLoading = false
        this.updateTab(tab.id, { isLoading: false })
        this.notifyNavigationStateChanged(tab.id)
      }
    }, 15000)

    // 页面开始加载
    webContents.on('did-start-loading', () => {
      console.log(`标签页开始加载 (${tab.id}): ${tab.websiteName}`)
      tab.isLoading = true
      this.updateTab(tab.id, { isLoading: true })
      this.notifyNavigationStateChanged(tab.id)
      
      // 加载开始时强制验证布局
      setTimeout(() => this.triggerLayoutVerification(), 100)
    })

    // 页面加载完成
    webContents.on('did-finish-loading', () => {
      console.log(`标签页加载完成 (${tab.id}): ${webContents.getURL()}`)
      clearTimeout(loadingTimeout)
      tab.isLoading = false
      tab.title = webContents.getTitle() || tab.websiteName
      tab.url = webContents.getURL()
      this.updateTab(tab.id, { 
        isLoading: false, 
        title: tab.title,
        url: tab.url
      })
      this.notifyNavigationStateChanged(tab.id)
      
      // 页面加载完成后强制验证布局
      setTimeout(() => this.triggerLayoutVerification(), 200)
      setTimeout(() => this.triggerLayoutVerification(), 1000)
    })

    // 域完成加载 (备用机制)
    webContents.on('dom-ready', () => {
      console.log(`标签页DOM就绪 (${tab.id}): ${webContents.getURL()}`)
      if (tab.isLoading) {
        clearTimeout(loadingTimeout)
        tab.isLoading = false
        this.updateTab(tab.id, { isLoading: false })
        this.notifyNavigationStateChanged(tab.id)
      }
      
      // DOM就绪后强制验证布局
      setTimeout(() => this.triggerLayoutVerification(), 150)
    })

    // 页面导航完成 (另一个可靠的完成事件)
    webContents.on('did-navigate', () => {
      console.log(`标签页导航完成 (${tab.id}): ${webContents.getURL()}`)
      if (tab.isLoading) {
        clearTimeout(loadingTimeout)
        tab.isLoading = false
        tab.url = webContents.getURL()
        this.updateTab(tab.id, { isLoading: false, url: tab.url })
        this.notifyNavigationStateChanged(tab.id)
      }
      
      // 导航完成后强制验证布局
      setTimeout(() => this.triggerLayoutVerification(), 300)
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
      
      // 加载失败后也要验证布局
      setTimeout(() => this.triggerLayoutVerification(), 100)
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

    console.log(`🔄 开始切换到标签页: ${tab.title} (${tabId})`)

    // 隐藏所有其他标签页
    this.tabViews.forEach((otherView, otherTabId) => {
      if (otherTabId !== tabId) {
        // 通过设置bounds为0来隐藏BrowserView
        otherView.setBounds({ x: 0, y: 0, width: 0, height: 0 })
        console.log(`🙈 隐藏标签页视图: ${otherTabId}`)
        
        // 更新标签页状态
        const otherTab = this.tabs.get(otherTabId)
        if (otherTab && otherTab.isActive) {
          otherTab.isActive = false
          this.updateTab(otherTabId, { isActive: false })
        }
      }
    })

    // 激活新标签页
    tab.isActive = true
    tab.lastActivatedAt = new Date()
    this.activeTabId = tabId

    console.log(`✅ 设置活跃标签页: ${tabId}`)

    // 显示新标签页 - 计算正确的布局
    const contentBounds = this.mainWindow?.getContentBounds()
    if (!contentBounds) {
      console.error('❌ 无法获取窗口内容边界')
      return
    }

    const sidebarWidth = 350
    const tabHostHeight = this.tabAreaBounds.y

    const bounds = {
      x: 0,
      y: tabHostHeight,
      width: Math.max(100, contentBounds.width - sidebarWidth),
      height: Math.max(100, contentBounds.height - tabHostHeight)
    }

    console.log(`👁️  显示标签页视图 ${tabId}:`, bounds)
    view.setBounds(bounds)

    // 更新标签页数据
    this.updateTab(tabId, { 
      isActive: true, 
      lastActivatedAt: tab.lastActivatedAt 
    })

    // 通知导航状态变化
    this.notifyNavigationStateChanged(tabId)

    // 多重验证切换是否成功
    const verifySwitch = () => {
      const actualBounds = view.getBounds()
      console.log(`🔍 标签页切换验证 ${tabId}:`, actualBounds)
      
      if (actualBounds.width <= 0 || actualBounds.height <= 0 || actualBounds.y < tabHostHeight) {
        console.error(`⚠️  标签页切换失败，强制重新设置布局 ${tabId}`)
        view.setBounds(bounds)
        
        // 确保其他标签页保持隐藏
        this.tabViews.forEach((otherView, otherTabId) => {
          if (otherTabId !== tabId) {
            otherView.setBounds({ x: 0, y: 0, width: 0, height: 0 })
          }
        })
      }
    }
    
    // 多次验证，确保切换成功
    setTimeout(verifySwitch, 50)
    setTimeout(verifySwitch, 150)
    setTimeout(verifySwitch, 300)

    console.log(`🎉 标签页切换完成: ${tab.title} (${tabId})`)
  }

  private updateTabViewLayout(view: BrowserView): void {
    if (!this.mainWindow) return

    const contentBounds = this.mainWindow.getContentBounds()
    const sidebarWidth = 350 // 与WindowManager保持一致
    const tabHostHeight = this.tabAreaBounds.y

    // 确保BrowserView永远不会被TabHostApp区域覆盖
    const bounds = {
      x: 0, // 从左边开始
      y: tabHostHeight, // 从TabHostApp下方开始，留足间距
      width: Math.max(0, contentBounds.width - sidebarWidth), // 减去侧边栏宽度，确保不为负数
      height: Math.max(0, contentBounds.height - tabHostHeight) // 剩余高度，确保不为负数
    }

    // 多重边界验证 - 确保不会覆盖TabHostApp
    if (bounds.y < tabHostHeight) {
      console.error(`❌ BrowserView布局错误: y=${bounds.y} < ${tabHostHeight}`)
      bounds.y = tabHostHeight
    }

    if (bounds.width <= 0 || bounds.height <= 0) {
      console.error(`❌ BrowserView尺寸无效: width=${bounds.width}, height=${bounds.height}`)
      bounds.width = Math.max(100, bounds.width)
      bounds.height = Math.max(100, bounds.height)
    }

    console.log(`🎯 强制设置BrowserView布局:`, bounds)
    console.log(`   🛡️  TabHostApp保护高度: ${tabHostHeight}px`)
    console.log(`   📐 窗口内容边界:`, contentBounds)
    console.log(`   🌐 网页显示区域:`, bounds)

    // 设置bounds，通过正确的bounds控制显示区域，避免使用setTopBrowserView
    view.setBounds(bounds)
    
    // 验证设置是否生效
    setTimeout(() => {
      try {
        const actualBounds = view.getBounds()
        if (actualBounds.y < tabHostHeight) {
          console.error(`⚠️  BrowserView布局验证失败！实际bounds:`, actualBounds)
          console.error(`🚨 强制重新设置正确布局...`)
          view.setBounds(bounds)
        } else {
          console.log(`✅ BrowserView布局验证通过:`, actualBounds)
        }
      } catch (error) {
        console.warn('布局验证时出错:', error)
      }
    }, 100)
  }

  updateLayout(): void {
    if (this.activeTabId) {
      const view = this.tabViews.get(this.activeTabId)
      if (view) {
        this.updateTabViewLayout(view)
        console.log(`🔄 布局更新完成，TabHostApp受保护`)
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

  getTabViewById(tabId: string): BrowserView | null {
    return this.tabViews.get(tabId) || null
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

  // 布局验证和保护机制
  private startLayoutVerification(): void {
    if (!this.mainWindow) return

    // 更频繁的布局检查 - 每500ms检查一次
    const verificationInterval = setInterval(() => {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        clearInterval(verificationInterval)
        return
      }

      this.verifyAndFixLayout()
    }, 500)

    // 窗口焦点变化时强制验证
    this.mainWindow.on('focus', () => {
      setTimeout(() => this.verifyAndFixLayout(), 100)
    })

    // 窗口激活时强制验证
    this.mainWindow.on('show', () => {
      setTimeout(() => this.verifyAndFixLayout(), 100)
    })

    console.log('🔍 强化布局验证守护进程已启动 (500ms间隔)')
  }

  private verifyAndFixLayout(): void {
    if (!this.mainWindow) return

    const tabHostHeight = this.tabAreaBounds.y
    const sidebarWidth = 350
    let fixedCount = 0

    // 获取当前窗口边界
    const contentBounds = this.mainWindow.getContentBounds()
    const correctBounds = {
      x: 0,
      y: tabHostHeight,
      width: Math.max(100, contentBounds.width - sidebarWidth),
      height: Math.max(100, contentBounds.height - tabHostHeight)
    }

    // 检查所有BrowserView的布局
    this.tabViews.forEach((view, tabId) => {
      try {
        const bounds = view.getBounds()
        const isActiveTab = tabId === this.activeTabId
        
        if (isActiveTab) {
          // 活跃标签页必须显示在正确位置
          let needsFix = false
          
          if (bounds.y < tabHostHeight) {
            console.warn(`⚠️  活跃标签页Y坐标错误: ${bounds.y} < ${tabHostHeight} (${tabId})`)
            needsFix = true
          }
          
          if (bounds.width <= 0 || bounds.height <= 0) {
            console.warn(`⚠️  活跃标签页尺寸错误: ${bounds.width}x${bounds.height} (${tabId})`)
            needsFix = true
          }
          
          if (Math.abs(bounds.x - correctBounds.x) > 5 || 
              Math.abs(bounds.y - correctBounds.y) > 5 ||
              Math.abs(bounds.width - correctBounds.width) > 10 ||
              Math.abs(bounds.height - correctBounds.height) > 10) {
            console.warn(`⚠️  活跃标签页位置偏差过大: 期望${JSON.stringify(correctBounds)}, 实际${JSON.stringify(bounds)} (${tabId})`)
            needsFix = true
          }
          
          if (needsFix) {
            console.log(`🔧 强制修正活跃BrowserView布局 (${tabId})`)
            view.setBounds(correctBounds)
            fixedCount++
            
            // 修正后立即验证
            setTimeout(() => {
              const newBounds = view.getBounds()
              if (newBounds.y < tabHostHeight) {
                console.error(`❌ 修正失败，再次尝试 (${tabId})`)
                view.setBounds(correctBounds)
              }
            }, 50)
          }
        } else {
          // 非活跃标签页必须完全隐藏
          if (bounds.width > 0 || bounds.height > 0 || bounds.x !== 0 || bounds.y !== 0) {
            console.warn(`⚠️  非活跃标签页未完全隐藏: ${JSON.stringify(bounds)} (${tabId})`)
            view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
            console.log(`🙈 强制隐藏非活跃BrowserView (${tabId})`)
            fixedCount++
          }
        }
      } catch (error) {
        console.warn(`布局验证时出错 (${tabId}):`, error)
      }
    })

    if (fixedCount > 0) {
      console.log(`🛡️  强化布局验证完成，修正了 ${fixedCount} 个BrowserView`)
      
      // 如果连续多次修正仍有问题，触发应急重置
      if (fixedCount >= 3) {
        console.warn('⚠️  检测到严重布局问题，将在2秒后执行应急重置...')
        setTimeout(() => {
          this.emergencyLayoutReset()
        }, 2000)
      }
    }
  }

  // 手动触发布局验证
  public triggerLayoutVerification(): void {
    console.log('🔍 手动触发布局验证...')
    this.verifyAndFixLayout()
  }

  // 应急布局重置机制
  public emergencyLayoutReset(): void {
    console.log('🚨 执行应急布局重置...')
    
    if (!this.mainWindow) return

    const contentBounds = this.mainWindow.getContentBounds()
    const sidebarWidth = 350
    const tabHostHeight = this.tabAreaBounds.y
    
    const correctBounds = {
      x: 0,
      y: tabHostHeight,
      width: Math.max(100, contentBounds.width - sidebarWidth),
      height: Math.max(100, contentBounds.height - tabHostHeight)
    }

    // 强制重置所有BrowserView
    this.tabViews.forEach((view, tabId) => {
      const isActiveTab = tabId === this.activeTabId
      
      if (isActiveTab) {
        console.log(`🔧 应急重置活跃标签页布局: ${tabId}`)
        view.setBounds(correctBounds)
      } else {
        console.log(`🙈 应急隐藏非活跃标签页: ${tabId}`)
        view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      }
    })

    // 重置后验证
    setTimeout(() => {
      this.verifyAndFixLayout()
    }, 100)

    console.log('✅ 应急布局重置完成')
  }

  // 查找已存在的标签页
  private findTabByWebsite(websiteId: string, websiteUrl: string): AITab | null {
    for (const tab of this.tabs.values()) {
      // 优先通过websiteId匹配
      if (tab.websiteId === websiteId) {
        console.log(`📍 通过websiteId找到已存在标签页: ${websiteId}`)
        return tab
      }
      
      // 其次通过URL匹配（处理域名相同的情况）
      try {
        const tabUrl = new URL(tab.url)
        const targetUrl = new URL(websiteUrl)
        
        // 比较主域名（去掉子路径）
        if (tabUrl.origin === targetUrl.origin) {
          console.log(`📍 通过URL域名找到已存在标签页: ${tabUrl.origin}`)
          return tab
        }
      } catch (error) {
        // URL解析失败，跳过这个标签页
        console.warn(`URL解析失败: ${tab.url} 或 ${websiteUrl}`)
      }
    }
    
    return null
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