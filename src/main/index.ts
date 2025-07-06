import { app, BrowserWindow, ipcMain, session } from 'electron'
import { WindowManager } from './window-manager'
import { ConfigManager } from './config-manager'
import { PromptManager } from './prompt-manager'
import { InjectionManager } from './injection-manager'
import { ProxyManager } from './proxy-manager'
import { AdapterFactory } from './adapters'
import { ModalManager } from './modal-manager'

class MainApp {
  private windowManager: WindowManager
  private configManager: ConfigManager
  private promptManager: PromptManager
  private injectionManager: InjectionManager
  private proxyManager: ProxyManager
  private adapterFactory: AdapterFactory
  private modalManager: ModalManager | null = null

  constructor() {
    this.windowManager = new WindowManager()
    this.configManager = new ConfigManager()
    this.promptManager = new PromptManager()
    this.injectionManager = new InjectionManager(this.windowManager)
    this.proxyManager = new ProxyManager()
    this.adapterFactory = AdapterFactory.getInstance()

    this.setupAppListeners()
    this.setupIPCHandlers()
  }

  private setupIPCHandlers(): void {
    ipcMain.handle('get-prompts', () => this.promptManager.getPrompts())
    ipcMain.handle('inject-prompt', (event, prompt) => this.injectionManager.injectPrompt(prompt))

    // 获取代理配置
    ipcMain.handle('get-proxy-config', () => {
      return this.configManager.getProxyConfig()
    })

    // 更新代理配置并应用
    ipcMain.handle('update-proxy', async (event, proxyConfig) => {
      try {
        await this.configManager.updateProxyConfig(proxyConfig)
        const success = await this.proxyManager.applyProxy(proxyConfig)
        return { success }
      } catch (error) {
        console.error('更新代理配置失败:', error)
        return { success: false, error: (error as any)?.message || '未知错误' }
      }
    })

    // 清理应用缓存
    ipcMain.handle('clear-cache', async () => {
      try {
        await session.defaultSession.clearCache()
        return { success: true }
      } catch (error) {
        console.error('清除缓存失败:', error)
        return { success: false, error: (error as any)?.message || '未知错误' }
      }
    })
  }

  private setupAppListeners(): void {
    app.whenReady().then(async () => {
      app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        event.preventDefault()
        callback(true)
      })

      await this.createMainWindow()

      app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          await this.createMainWindow()
        }
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }

  private async createMainWindow(): Promise<void> {
    try {
      await this.windowManager.createMainWindow()
      const mainWindow = this.windowManager.getMainWindow()
      if (mainWindow) {
        this.modalManager = new ModalManager(mainWindow)
      }
      console.log('✅ 主窗口创建成功')
    } catch (error) {
      console.error('❌ 创建主窗口失败:', error)
    }
  }
}

new MainApp()

// 防止应用被垃圾回收
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason, promise)
})