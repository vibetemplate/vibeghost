import { BaseAdapter } from './base-adapter'

/**
 * ChatGPT 平台适配器
 */
export class ChatGPTAdapter extends BaseAdapter {
  readonly platformId = 'chatgpt'
  readonly platformName = 'ChatGPT'
  readonly platformUrl = 'https://chat.openai.com'
  readonly requiresProxy = true

  /**
   * ChatGPT 特定的选择器
   */
  getSelectors(): string[] {
    return [
      // ChatGPT 特有的选择器
      '[placeholder*="Message ChatGPT"]',
      '[placeholder*="Send a message"]',
      'textarea[placeholder*="Message ChatGPT"]',
      'textarea[placeholder*="Send a message"]',
      
      // OpenAI 相关选择器
      '[placeholder*="OpenAI"]',
      '[placeholder*="ChatGPT"]',
      
      // 基于 ID 和 class 的选择器
      '#prompt-textarea',
      '.ProseMirror',
      '[data-testid="textbox"]',
      
      // Role 和 contenteditable 选择器
      '[role="textbox"]',
      '[contenteditable="true"]',
      
      // 通用选择器作为后备
      ...this.commonSelectors
    ]
  }

  /**
   * ChatGPT 特定的页面检测
   */
  isCurrentPlatform(url: string): boolean {
    return url.includes('chat.openai.com') || 
           url.includes('chatgpt.com') ||
           url.includes('openai.com/chat')
  }
} 