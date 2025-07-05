import { contextBridge, ipcRenderer } from 'electron'
import { ProxyConfig, SiteConfig, InjectionResult } from '../shared/types'

// 定义暴露给渲染进程的API
const electronAPI = {
  // 提示词相关
  injectPrompt: (prompt: string): Promise<InjectionResult> => 
    ipcRenderer.invoke('inject-prompt', prompt),
  
  getPrompts: (): Promise<any> => 
    ipcRenderer.invoke('get-prompts'),
  
  // 代理配置相关
  updateProxy: (config: ProxyConfig): Promise<void> => 
    ipcRenderer.invoke('update-proxy', config),
  
  getProxyConfig: (): Promise<ProxyConfig> => 
    ipcRenderer.invoke('get-proxy-config'),
  
  // 网站配置相关
  switchSite: (url: string): Promise<void> => 
    ipcRenderer.invoke('switch-site', url),
  
  getSiteConfig: (): Promise<SiteConfig[]> => 
    ipcRenderer.invoke('get-site-config'),
  
  updateSiteConfig: (config: SiteConfig): Promise<void> => 
    ipcRenderer.invoke('update-site-config', config),
  
  // 窗口控制
  minimizeWindow: (): void => 
    ipcRenderer.send('minimize-window'),
  
  maximizeWindow: (): void => 
    ipcRenderer.send('maximize-window'),
  
  closeWindow: (): void => 
    ipcRenderer.send('close-window'),
  
  // 事件监听
  onSiteChanged: (callback: (siteId: string) => void): void => {
    ipcRenderer.on('site-changed', (_, siteId) => callback(siteId))
  },
  
  onProxyStatusChanged: (callback: (status: { connected: boolean; error?: string }) => void): void => {
    ipcRenderer.on('proxy-status-changed', (_, status) => callback(status))
  },
  
  // 移除监听器
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  },

  // 调试工具
  toggleSidebarDevTools: (): void => 
    ipcRenderer.send('toggle-sidebar-devtools'),
  
  reloadSidebar: (): void => 
    ipcRenderer.send('reload-sidebar'),

  // 模态框相关
  showModal: (type: string, props?: any): void => {
    ipcRenderer.send('show-modal', type, props)
  },
  hideModal: (): void => {
    ipcRenderer.send('hide-modal')
  },
  onShowModal: (callback: (type: string, props: any) => void) => {
    ipcRenderer.on('show-modal-in-view', (_, type, props) => callback(type, props))
  },
}

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明，用于TypeScript支持
declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}