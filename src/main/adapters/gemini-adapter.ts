import { BaseAdapter } from './base-adapter'

/**
 * Gemini 平台适配器
 */
export class GeminiAdapter extends BaseAdapter {
  readonly platformId = 'gemini'
  readonly platformName = 'Gemini'
  readonly platformUrl = 'https://gemini.google.com'
  readonly requiresProxy = true

  /**
   * Gemini 特定的选择器
   */
  getSelectors(): string[] {
    return [
      // Gemini 特有的选择器
      '[placeholder*="Enter a prompt here"]',
      '[placeholder*="Ask Gemini"]',
      '[placeholder*="Message Gemini"]',
      'textarea[placeholder*="Enter a prompt here"]',
      'textarea[placeholder*="Ask Gemini"]',
      
      // Google 相关选择器
      '[placeholder*="Gemini"]',
      '[placeholder*="Google"]',
      '[placeholder*="Bard"]', // 旧名称
      
      // 基于 class 和 data 属性的选择器
      '.ql-editor',
      '[data-testid="input-field"]',
      '[data-testid="chat-input"]',
      
      // Rich text editor 选择器
      '.ProseMirror',
      '[role="textbox"]',
      '[contenteditable="true"]',
      
      // 通用选择器作为后备
      ...this.commonSelectors
    ]
  }

  /**
   * Gemini 特定的页面检测
   */
  isCurrentPlatform(url: string): boolean {
    return url.includes('gemini.google.com') || 
           url.includes('bard.google.com') ||
           url.includes('ai.google.dev')
  }
} 