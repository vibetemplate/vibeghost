import { app, BrowserWindow, BrowserView, ipcMain, session } from 'electron'
import { join } from 'path'
import { WindowManager } from './window-manager'
import { ProxyManager } from './proxy-manager'
import { ConfigManager } from './config-manager'
import { InjectionManager } from './injection-manager'
import { PromptManager } from './prompt-manager'

class MainApp {
  private windowManager: WindowManager
  private proxyManager: ProxyManager
  private configManager: ConfigManager
  private injectionManager: InjectionManager
  private promptManager: PromptManager

  constructor() {
    this.windowManager = new WindowManager()
    this.proxyManager = new ProxyManager()
    this.configManager = new ConfigManager()
    this.injectionManager = InjectionManager.getInstance()
    this.promptManager = new PromptManager()

    this.initialize()
  }

  private initialize() {
    this.setupAppEvents()
    this.setupIpcHandlers()
  }

  private setupAppEvents() {
    app.whenReady().then(() => {
      // 忽略证书相关错误，修复开发环境中的SSL问题
      app.commandLine.appendSwitch('ignore-certificate-errors');
      
      this.createMainWindow()

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.windowManager.createMainWindow()
        }
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }

  private async createMainWindow() {
    try {
      // 加载配置
      await this.configManager.load()
      
      // 应用代理设置
      const proxyConfig = this.configManager.getProxyConfig()
      if (proxyConfig.enabled) {
        await this.proxyManager.applyProxy(proxyConfig)
      }

      // 创建主窗口
      const mainWindow = await this.windowManager.createMainWindow()
      
      // 设置双视图布局
      await this.windowManager.setupDualViews(mainWindow)

      console.log('主窗口创建成功')
    } catch (error) {
      console.error('创建主窗口失败:', error)
    }
  }

  private setupIpcHandlers() {
    // 提示词注入
    ipcMain.handle('inject-prompt', async (event, prompt: string) => {
      try {
        const mainView = this.windowManager.getMainView()
        if (mainView) {
          return await this.injectionManager.injectPrompt(mainView, prompt)
        }
        return { success: false, error: '主视图未找到' }
      } catch (error: any) {
        console.error('注入提示词失败:', error)
        return { success: false, error: error.message }
      }
    })

    // 获取提示词数据
    ipcMain.handle('get-prompts', async () => {
      try {
        console.log('主进程收到 get-prompts 请求')
        const prompts = await this.promptManager.getPrompts()
        console.log('主进程返回提示词数量:', prompts.length)
        return prompts
      } catch (error: any) {
        console.error('获取提示词失败:', error)
        return []
      }
    })

    // 代理配置
    ipcMain.handle('get-proxy-config', async () => {
      return this.configManager.getProxyConfig()
    })

    ipcMain.handle('update-proxy', async (event, config) => {
      try {
        await this.configManager.updateProxyConfig(config)
        if (config.enabled) {
          await this.proxyManager.applyProxy(config)
        } else {
          await this.proxyManager.disableProxy()
        }
        return { success: true }
      } catch (error: any) {
        console.error('更新代理配置失败:', error)
        return { success: false, error: error.message }
      }
    })

    // 网站配置
    ipcMain.handle('get-site-config', async () => {
      return this.configManager.getSiteConfigs()
    })

    ipcMain.handle('switch-site', async (event, url: string) => {
      try {
        const mainView = this.windowManager.getMainView()
        if (mainView) {
          await mainView.webContents.loadURL(url)
          console.log('切换到网站:', url)
          return { success: true }
        }
        return { success: false, error: '主视图未找到' }
      } catch (error: any) {
        console.error('切换网站失败:', error)
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('update-site-config', async (event, config) => {
      try {
        await this.configManager.updateSiteConfig(config)
        return { success: true }
      } catch (error: any) {
        console.error('更新网站配置失败:', error)
        return { success: false, error: error.message }
      }
    })

    // 窗口控制
    ipcMain.on('minimize-window', () => {
      const mainWindow = this.windowManager.getMainWindow()
      if (mainWindow) {
        mainWindow.minimize()
      }
    })

    ipcMain.on('maximize-window', () => {
      const mainWindow = this.windowManager.getMainWindow()
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
      }
    })

    ipcMain.on('close-window', () => {
      const mainWindow = this.windowManager.getMainWindow()
      if (mainWindow) {
        mainWindow.close()
      }
    })

    // 调试工具
    ipcMain.on('toggle-sidebar-devtools', () => {
      const sideView = this.windowManager.getSideView()
      if (sideView) {
        if (sideView.webContents.isDevToolsOpened()) {
          sideView.webContents.closeDevTools()
        } else {
          sideView.webContents.openDevTools({ mode: 'detach' })
        }
      }
    })

    ipcMain.on('reload-sidebar', () => {
      const sideView = this.windowManager.getSideView()
      if (sideView) {
        sideView.webContents.reload()
      }
    })
  }
}

// 启动应用
new MainApp()

// 防止应用被垃圾回收
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason, promise)
})