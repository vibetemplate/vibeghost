import { session } from 'electron'
import { ProxyConfig } from '../shared/types'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'

export class ProxyManager {
  private currentConfig: ProxyConfig | null = null
  private isProxyActive = false

  async applyProxy(config: ProxyConfig): Promise<boolean> {
    try {
      if (!config.enabled) {
        return this.disableProxy()
      }

      // 构建代理URL
      const proxyUrl = this.buildProxyUrl(config)
      
      // 应用代理到默认session
      await session.defaultSession.setProxy({
        proxyRules: proxyUrl,
        proxyBypassRules: 'localhost,127.0.0.1,::1'
      })

      // 测试代理连接
      const isConnected = await this.testProxyConnection(config)
      
      if (isConnected) {
        this.currentConfig = config
        this.isProxyActive = true
        console.log('代理配置成功:', proxyUrl)
        return true
      } else {
        console.error('代理连接测试失败')
        await this.disableProxy()
        return false
      }
    } catch (error) {
      console.error('应用代理配置失败:', error)
      return false
    }
  }

  async disableProxy(): Promise<boolean> {
    try {
      // 清除代理设置
      await session.defaultSession.setProxy({
        proxyRules: '',
        proxyBypassRules: ''
      })

      this.currentConfig = null
      this.isProxyActive = false
      console.log('代理已禁用')
      return true
    } catch (error) {
      console.error('禁用代理失败:', error)
      return false
    }
  }

  private buildProxyUrl(config: ProxyConfig): string {
    const { type, host, port, auth } = config
    
    let proxyUrl = `${type}://`
    
    if (auth && auth.username && auth.password) {
      proxyUrl += `${encodeURIComponent(auth.username)}:${encodeURIComponent(auth.password)}@`
    }
    
    proxyUrl += `${host}:${port}`
    
    return proxyUrl
  }

  private async testProxyConnection(config: ProxyConfig): Promise<boolean> {
    try {
      const proxyUrl = this.buildProxyUrl(config)
      
      // 创建代理Agent
      let agent: any
      if (config.type === 'http') {
        agent = new HttpsProxyAgent(proxyUrl)
      } else if (config.type === 'socks5') {
        agent = new SocksProxyAgent(proxyUrl)
      } else {
        throw new Error('不支持的代理类型')
      }

      // 测试连接
      const testUrls = [
        'https://www.google.com',
        'https://chat.openai.com',
        'https://www.cloudflare.com'
      ]

      for (const url of testUrls) {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(5000) // 5秒超时
          })

          if (response.ok) {
            console.log(`代理连接测试成功: ${url}`)
            return true
          }
        } catch (error) {
          console.log(`测试URL失败: ${url}`, (error as any).message)
          continue
        }
      }

      return false
    } catch (error) {
      console.error('代理连接测试异常:', error)
      return false
    }
  }

  // 获取当前代理状态
  getProxyStatus(): { active: boolean; config: ProxyConfig | null } {
    return {
      active: this.isProxyActive,
      config: this.currentConfig
    }
  }

  // 检查代理是否可用
  async checkProxyAvailability(config: ProxyConfig): Promise<boolean> {
    return this.testProxyConnection(config)
  }

  // 获取推荐的代理配置
  getRecommendedConfigs(): ProxyConfig[] {
    return [
      {
        enabled: true,
        type: 'http',
        host: '127.0.0.1',
        port: 7890
      },
      {
        enabled: true,
        type: 'socks5',
        host: '127.0.0.1',
        port: 1080
      },
      {
        enabled: true,
        type: 'http',
        host: '127.0.0.1',
        port: 8080
      }
    ]
  }

  // 自动检测本地代理
  async autoDetectProxy(): Promise<ProxyConfig | null> {
    const commonConfigs = this.getRecommendedConfigs()
    
    for (const config of commonConfigs) {
      const isAvailable = await this.checkProxyAvailability(config)
      if (isAvailable) {
        console.log('自动检测到可用代理:', config)
        return config
      }
    }

    return null
  }

  // 获取代理统计信息
  async getProxyStats(): Promise<{
    connected: boolean;
    latency: number;
    lastTestTime: Date;
    connectionCount: number;
  }> {
    const stats = {
      connected: this.isProxyActive,
      latency: 0,
      lastTestTime: new Date(),
      connectionCount: 0
    }

    if (this.currentConfig && this.isProxyActive) {
      const startTime = Date.now()
      const connected = await this.testProxyConnection(this.currentConfig)
      const endTime = Date.now()
      
      stats.connected = connected
      stats.latency = endTime - startTime
    }

    return stats
  }
}