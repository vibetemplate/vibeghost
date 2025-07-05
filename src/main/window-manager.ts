import { BrowserWindow, BrowserView, screen, ipcMain, shell } from 'electron'
import { join } from 'path'
import { AppConfig } from '../shared/types'
import { app } from 'electron'

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
      show: true
    })

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
      this.mainWindow?.focus()
      this.mainWindow?.moveTop()
    })

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
      this.mainView = null
      this.sideView = null
    })

    this.mainWindow.on('resize', () => {
      this.updateViewLayout()
    })

    return this.mainWindow
  }

  async setupViews(mainWindow: BrowserWindow): Promise<void> {
    if (!mainWindow) return

    this.sideView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js'),
        webSecurity: true
      }
    })

    this.mainView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        webSecurity: false,
        allowRunningInsecureContent: true,
        partition: 'persist:main'
      }
    })

    this.mainView.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')
    
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

    mainWindow.addBrowserView(this.sideView)
    mainWindow.addBrowserView(this.mainView)

    this.updateViewLayout()
    await this.loadViewContents()
    this.setupViewEvents()
  }

  private async loadViewContents(): Promise<void> {
    if (!this.sideView || !this.mainView) return

    try {
      if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        await this.sideView.webContents.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/sidebar.html`)
      } else {
        await this.sideView.webContents.loadFile(
          join(__dirname, '../renderer/sidebar.html')
        )
      }
      await this.mainView.webContents.loadURL('https://chat.deepseek.com')
    } catch (error) {
      console.error('加载视图内容失败:', error)
    }
  }

  private updateViewLayout(): void {
    if (!this.mainWindow || !this.sideView || !this.mainView) return

    const contentBounds = this.mainWindow.getContentBounds()

    this.mainView.setBounds({
      x: 0,
      y: 0,
      width: contentBounds.width - this.sidebarWidth,
      height: contentBounds.height
    })

    this.sideView.setBounds({
      x: contentBounds.width - this.sidebarWidth,
      y: 0,
      width: this.sidebarWidth,
      height: contentBounds.height
    })
  }

  private setupViewEvents(): void {
    if (!this.sideView || !this.mainView) return

    this.sideView.webContents.on('dom-ready', () => {
      console.log('侧边栏加载完成')
      if (process.env.NODE_ENV === 'development') {
        this.sideView?.webContents.openDevTools({ mode: 'detach' })
      }
    })

    this.sideView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('侧边栏加载失败:', errorCode, errorDescription)
    })

    this.mainView.webContents.on('dom-ready', () => {
      console.log('主视图加载完成')
    })

    this.mainView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('主视图加载失败:', errorCode, errorDescription)
    })

    this.mainView.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    this.mainView.webContents.on('will-navigate', (event, navigationUrl) => {
      console.log('导航到:', navigationUrl)
    })
  }

  setSidebarWidth(width: number): void {
    this.sidebarWidth = Math.max(200, Math.min(600, width))
    this.updateViewLayout()
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  getMainView(): BrowserView | null {
    return this.mainView
  }

  getSideView(): BrowserView | null {
    return this.sideView
  }

  async switchToSite(url: string): Promise<void> {
    if (this.mainView) {
      await this.mainView.webContents.loadURL(url)
    }
  }

  refreshMainView(): void {
    if (this.mainView) {
      this.mainView.webContents.reload()
    }
  }

  refreshSideView(): void {
    if (this.sideView) {
      this.sideView.webContents.reload()
    }
  }

  getViewState() {
    return {
      mainViewUrl: this.mainView?.webContents.getURL() || '',
      sideViewUrl: this.sideView?.webContents.getURL() || '',
      sidebarWidth: this.sidebarWidth,
      windowBounds: this.mainWindow?.getBounds() || null
    }
  }
}