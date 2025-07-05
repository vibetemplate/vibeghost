import { IAIAdapter } from './base-adapter'
import { DeepSeekAdapter } from './deepseek-adapter'
import { ChatGPTAdapter } from './chatgpt-adapter'
import { ClaudeAdapter } from './claude-adapter'
import { GeminiAdapter } from './gemini-adapter'
import { KimiAdapter } from './kimi-adapter'
import { TongyiAdapter } from './tongyi-adapter'

/**
 * 适配器工厂类
 * 负责创建和管理所有AI平台适配器
 */
export class AdapterFactory {
  private static instance: AdapterFactory
  private adapters: Map<string, IAIAdapter> = new Map()

  private constructor() {
    this.initializeAdapters()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AdapterFactory {
    if (!AdapterFactory.instance) {
      AdapterFactory.instance = new AdapterFactory()
    }
    return AdapterFactory.instance
  }

  /**
   * 初始化所有适配器
   */
  private initializeAdapters(): void {
    const adapterInstances = [
      new DeepSeekAdapter(),
      new ChatGPTAdapter(),
      new ClaudeAdapter(),
      new GeminiAdapter(),
      new KimiAdapter(),
      new TongyiAdapter()
    ]

    adapterInstances.forEach(adapter => {
      this.adapters.set(adapter.platformId, adapter)
    })

    console.log(`已加载 ${this.adapters.size} 个AI平台适配器:`, 
      Array.from(this.adapters.keys()))
  }

  /**
   * 根据平台ID获取适配器
   */
  getAdapter(platformId: string): IAIAdapter | undefined {
    return this.adapters.get(platformId)
  }

  /**
   * 根据URL自动检测并获取适配器
   */
  getAdapterByUrl(url: string): IAIAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.isCurrentPlatform(url)) {
        console.log(`检测到平台: ${adapter.platformName} (${url})`)
        return adapter
      }
    }
    console.log(`未找到匹配的适配器: ${url}`)
    return undefined
  }

  /**
   * 获取所有可用的适配器
   */
  getAllAdapters(): IAIAdapter[] {
    return Array.from(this.adapters.values())
  }

  /**
   * 获取所有平台信息
   */
  getAllPlatforms(): Array<{
    id: string
    name: string
    url: string
    requiresProxy: boolean
  }> {
    return Array.from(this.adapters.values()).map(adapter => ({
      id: adapter.platformId,
      name: adapter.platformName,
      url: adapter.platformUrl,
      requiresProxy: adapter.requiresProxy
    }))
  }

  /**
   * 检查平台是否需要代理
   */
  requiresProxy(platformId: string): boolean {
    const adapter = this.getAdapter(platformId)
    return adapter?.requiresProxy || false
  }
} 