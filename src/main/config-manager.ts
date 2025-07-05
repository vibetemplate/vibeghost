import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { AppConfig, ProxyConfig, SiteConfig } from '../shared/types'

export class ConfigManager {
  private config: AppConfig | null = null
  private configPath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.configPath = join(userDataPath, 'config.json')
    this.ensureConfigDirectory()
  }

  private ensureConfigDirectory(): void {
    const userDataPath = app.getPath('userData')
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }
  }

  private getDefaultConfig(): AppConfig {
    return {
      defaultSite: 'deepseek',
      windowBounds: {
        width: 1400,
        height: 900
      },
      sidebarWidth: 350,
      theme: 'light',
      proxy: {
        enabled: false,
        type: 'http',
        host: '127.0.0.1',
        port: 7890
      },
      sites: [
        {
          id: 'deepseek',
          name: 'DeepSeek',
          url: 'https://chat.deepseek.com',
          injectionSelector: 'textarea[placeholder*="输入"], textarea[placeholder*="请输入"], .ant-input',
          loginRequired: false,
          icon: '🤖'
        },
        {
          id: 'chatgpt',
          name: 'ChatGPT',
          url: 'https://chat.openai.com',
          injectionSelector: '#prompt-textarea, [data-testid="prompt-textarea"], textarea[placeholder*="Message"]',
          loginRequired: true,
          icon: '🚀',
          proxy: {
            enabled: true,
            type: 'http',
            host: '127.0.0.1',
            port: 7890
          }
        },
        {
          id: 'claude',
          name: 'Claude',
          url: 'https://claude.ai',
          injectionSelector: '[contenteditable="true"], textarea[placeholder*="Talk to Claude"]',
          loginRequired: true,
          icon: '🎭',
          proxy: {
            enabled: true,
            type: 'http',
            host: '127.0.0.1',
            port: 7890
          }
        },
        {
          id: 'gemini',
          name: 'Gemini',
          url: 'https://gemini.google.com',
          injectionSelector: '[contenteditable="true"], textarea[placeholder*="Enter a prompt"]',
          loginRequired: true,
          icon: '💎',
          proxy: {
            enabled: true,
            type: 'http',
            host: '127.0.0.1',
            port: 7890
          }
        },
        {
          id: 'kimi',
          name: 'Kimi',
          url: 'https://kimi.moonshot.cn',
          injectionSelector: 'textarea[placeholder*="请输入"], .ant-input',
          loginRequired: false,
          icon: '🌙'
        },
        {
          id: 'tongyi',
          name: '通义千问',
          url: 'https://tongyi.aliyun.com',
          injectionSelector: 'textarea[placeholder*="请输入"], .ant-input',
          loginRequired: false,
          icon: '🔮'
        }
      ]
    }
  }

  async load(): Promise<AppConfig> {
    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf-8')
        const savedConfig = JSON.parse(configData)
        
        // 合并默认配置和保存的配置
        this.config = this.mergeConfigs(this.getDefaultConfig(), savedConfig)
      } else {
        this.config = this.getDefaultConfig()
        await this.save()
      }

      return this.config
    } catch (error) {
      console.error('加载配置失败:', error)
      this.config = this.getDefaultConfig()
      return this.config
    }
  }

  private mergeConfigs(defaultConfig: AppConfig, savedConfig: Partial<AppConfig>): AppConfig {
    // 深度合并配置
    const merged = { ...defaultConfig }
    
    if (savedConfig.defaultSite) merged.defaultSite = savedConfig.defaultSite
    if (savedConfig.windowBounds) merged.windowBounds = { ...merged.windowBounds, ...savedConfig.windowBounds }
    if (savedConfig.sidebarWidth) merged.sidebarWidth = savedConfig.sidebarWidth
    if (savedConfig.theme) merged.theme = savedConfig.theme
    if (savedConfig.proxy) merged.proxy = { ...merged.proxy, ...savedConfig.proxy }
    
    // 合并网站配置
    if (savedConfig.sites) {
      merged.sites = this.mergeSiteConfigs(merged.sites, savedConfig.sites)
    }

    return merged
  }

  private mergeSiteConfigs(defaultSites: SiteConfig[], savedSites: SiteConfig[]): SiteConfig[] {
    const merged = [...defaultSites]
    
    // 更新已存在的网站配置
    savedSites.forEach(savedSite => {
      const existingIndex = merged.findIndex(site => site.id === savedSite.id)
      if (existingIndex !== -1) {
        merged[existingIndex] = { ...merged[existingIndex], ...savedSite }
      } else {
        // 添加新的网站配置
        merged.push(savedSite)
      }
    })

    return merged
  }

  async save(): Promise<void> {
    try {
      if (this.config) {
        writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
      }
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  getConfig(): AppConfig | null {
    return this.config
  }

  // 代理配置相关
  getProxyConfig(): ProxyConfig {
    return this.config?.proxy || this.getDefaultConfig().proxy
  }

  async updateProxyConfig(proxyConfig: ProxyConfig): Promise<void> {
    if (this.config) {
      this.config.proxy = proxyConfig
      await this.save()
    }
  }

  // 网站配置相关
  getSiteConfigs(): SiteConfig[] {
    return this.config?.sites || this.getDefaultConfig().sites
  }

  getSiteConfig(siteId: string): SiteConfig | undefined {
    return this.getSiteConfigs().find(site => site.id === siteId)
  }

  async updateSiteConfig(siteConfig: SiteConfig): Promise<void> {
    if (this.config) {
      const index = this.config.sites.findIndex(site => site.id === siteConfig.id)
      if (index !== -1) {
        this.config.sites[index] = siteConfig
      } else {
        this.config.sites.push(siteConfig)
      }
      await this.save()
    }
  }

  async addSiteConfig(siteConfig: SiteConfig): Promise<void> {
    if (this.config) {
      this.config.sites.push(siteConfig)
      await this.save()
    }
  }

  async removeSiteConfig(siteId: string): Promise<void> {
    if (this.config) {
      this.config.sites = this.config.sites.filter(site => site.id !== siteId)
      await this.save()
    }
  }

  // 窗口配置相关
  getWindowBounds(): { width: number; height: number; x?: number; y?: number } {
    return this.config?.windowBounds || this.getDefaultConfig().windowBounds
  }

  async updateWindowBounds(bounds: { width: number; height: number; x?: number; y?: number }): Promise<void> {
    if (this.config) {
      this.config.windowBounds = bounds
      await this.save()
    }
  }

  // 侧边栏配置相关
  getSidebarWidth(): number {
    return this.config?.sidebarWidth || this.getDefaultConfig().sidebarWidth
  }

  async updateSidebarWidth(width: number): Promise<void> {
    if (this.config) {
      this.config.sidebarWidth = width
      await this.save()
    }
  }

  // 主题配置相关
  getTheme(): 'light' | 'dark' | 'system' {
    return this.config?.theme || this.getDefaultConfig().theme
  }

  async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    if (this.config) {
      this.config.theme = theme
      await this.save()
    }
  }

  // 默认网站配置
  getDefaultSite(): string {
    return this.config?.defaultSite || this.getDefaultConfig().defaultSite
  }

  async updateDefaultSite(siteId: string): Promise<void> {
    if (this.config) {
      this.config.defaultSite = siteId
      await this.save()
    }
  }

  // 重置配置
  async reset(): Promise<void> {
    this.config = this.getDefaultConfig()
    await this.save()
  }

  // 导出配置
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  // 导入配置
  async importConfig(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson)
      this.config = this.mergeConfigs(this.getDefaultConfig(), importedConfig)
      await this.save()
    } catch (error) {
      console.error('导入配置失败:', error)
      throw error
    }
  }
}