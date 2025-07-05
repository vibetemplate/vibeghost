import { BaseAdapter } from './base-adapter'

/**
 * Claude 平台适配器
 */
export class ClaudeAdapter extends BaseAdapter {
  readonly platformId = 'claude'
  readonly platformName = 'Claude'
  readonly platformUrl = 'https://claude.ai'
  readonly requiresProxy = true

  /**
   * Claude 特定的选择器
   */
  getSelectors(): string[] {
    return [
      // Claude 特有的选择器
      '[placeholder*="Talk to Claude"]',
      '[placeholder*="Message Claude"]',
      '[placeholder*="Type a message"]',
      'textarea[placeholder*="Talk to Claude"]',
      'textarea[placeholder*="Message Claude"]',
      
      // Anthropic 相关选择器
      '[placeholder*="Claude"]',
      '[placeholder*="Anthropic"]',
      
      // 基于 class 和 data 属性的选择器
      '.ProseMirror',
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
   * Claude 特定的页面检测
   */
  isCurrentPlatform(url: string): boolean {
    return url.includes('claude.ai') || 
           url.includes('anthropic.com')
  }
} 