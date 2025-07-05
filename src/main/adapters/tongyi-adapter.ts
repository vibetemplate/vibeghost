import { BaseAdapter } from './base-adapter'

/**
 * 通义千问平台适配器
 */
export class TongyiAdapter extends BaseAdapter {
  readonly platformId = 'tongyi'
  readonly platformName = '通义千问'
  readonly platformUrl = 'https://tongyi.aliyun.com'
  readonly requiresProxy = false

  /**
   * 通义千问特定的选择器
   */
  getSelectors(): string[] {
    return [
      // 通义千问特有的选择器
      '[placeholder*="请输入你的问题"]',
      '[placeholder*="输入你想问的问题"]',
      '[placeholder*="和通义千问聊天"]',
      'textarea[placeholder*="请输入你的问题"]',
      'textarea[placeholder*="输入你想问的问题"]',
      
      // 阿里云相关选择器
      '[placeholder*="通义千问"]',
      '[placeholder*="通义"]',
      '[placeholder*="千问"]',
      '[placeholder*="阿里云"]',
      
      // 基于 class 和 data 属性的选择器
      '.chat-input',
      '.message-input',
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
   * 通义千问特定的页面检测
   */
  isCurrentPlatform(url: string): boolean {
    return url.includes('tongyi.aliyun.com') || 
           url.includes('qianwen.aliyun.com') ||
           url.includes('dashscope.aliyun.com')
  }
} 