import { BaseAdapter } from './base-adapter'

/**
 * Kimi 平台适配器
 */
export class KimiAdapter extends BaseAdapter {
  readonly platformId = 'kimi'
  readonly platformName = 'Kimi'
  readonly platformUrl = 'https://kimi.moonshot.cn'
  readonly requiresProxy = false

  /**
   * Kimi 特定的选择器
   */
  getSelectors(): string[] {
    return [
      // Kimi 特有的选择器
      '[placeholder*="请输入你想问的问题"]',
      '[placeholder*="输入你的问题"]',
      '[placeholder*="和 Kimi 聊天"]',
      'textarea[placeholder*="请输入你想问的问题"]',
      'textarea[placeholder*="输入你的问题"]',
      
      // Moonshot 相关选择器
      '[placeholder*="Kimi"]',
      '[placeholder*="moonshot"]',
      '[placeholder*="月之暗面"]',
      
      // 基于 class 和 data 属性的选择器
      '.chat-input',
      '[data-testid="chat-input"]',
      '[data-testid="message-input"]',
      
      // Role 和 contenteditable 选择器
      '[role="textbox"]',
      '[contenteditable="true"]',
      
      // 通用选择器作为后备
      ...this.commonSelectors
    ]
  }

  /**
   * Kimi 特定的页面检测
   */
  isCurrentPlatform(url: string): boolean {
    return url.includes('kimi.moonshot.cn') || 
           url.includes('moonshot.cn')
  }
} 