import { BaseAdapter } from './base-adapter'

/**
 * DeepSeek AI 平台适配器
 */
export class DeepSeekAdapter extends BaseAdapter {
  readonly platformId = 'deepseek'
  readonly platformName = 'DeepSeek'
  readonly platformUrl = 'https://chat.deepseek.com'
  readonly requiresProxy = false

  /**
   * DeepSeek 特定的选择器
   * 基于实际测试和页面结构分析
   */
  getSelectors(): string[] {
    return [
      // DeepSeek 特有的选择器
      '[placeholder="给 DeepSeek 发送消息"]',
      'textarea[placeholder="给 DeepSeek 发送消息"]',
      'input[placeholder="给 DeepSeek 发送消息"]',
      
      // 通用 DeepSeek 相关选择器
      '[placeholder*="DeepSeek"]',
      '[placeholder*="发送消息"]',
      'textarea[placeholder*="DeepSeek"]',
      'textarea[placeholder*="发送消息"]',
      
      // Role 和 aria-label 选择器
      '[role="textbox"][aria-label*="DeepSeek"]',
      '[role="textbox"][aria-label*="发送消息"]',
      
      // 通用选择器作为后备
      ...this.commonSelectors
    ]
  }

  /**
   * DeepSeek 特定的页面检测
   */
  isCurrentPlatform(url: string): boolean {
    return url.includes('chat.deepseek.com') || 
           url.includes('deepseek.com')
  }
} 