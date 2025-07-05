import { BrowserView } from 'electron'
import { InjectionResult } from '../../shared/types'

/**
 * AI 平台适配器接口
 */
export interface IAIAdapter {
  /**
   * 平台标识
   */
  readonly platformId: string
  
  /**
   * 平台名称
   */
  readonly platformName: string
  
  /**
   * 平台官网 URL
   */
  readonly platformUrl: string
  
  /**
   * 是否需要代理访问
   */
  readonly requiresProxy: boolean
  
  /**
   * 检测当前页面是否为该平台
   */
  isCurrentPlatform(url: string): boolean
  
  /**
   * 注入提示词到输入框
   */
  inject(browserView: BrowserView, prompt: string): Promise<InjectionResult>
  
  /**
   * 获取输入框选择器
   */
  getSelectors(): string[]
  
  /**
   * 验证页面是否已加载完成
   */
  isPageReady(browserView: BrowserView): Promise<boolean>
}

/**
 * 基础适配器抽象类
 */
export abstract class BaseAdapter implements IAIAdapter {
  abstract readonly platformId: string
  abstract readonly platformName: string
  abstract readonly platformUrl: string
  abstract readonly requiresProxy: boolean
  
  /**
   * 默认的输入框选择器
   */
  protected readonly commonSelectors = [
    'textarea[placeholder*="输入"]',
    'textarea[placeholder*="请输入"]',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Enter"]',
    '[contenteditable="true"]',
    'input[type="text"]',
    'textarea',
    '[role="textbox"]'
  ]
  
  /**
   * 检测当前页面是否为该平台
   */
  isCurrentPlatform(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const platformUrlObj = new URL(this.platformUrl)
      return urlObj.hostname.includes(platformUrlObj.hostname)
    } catch {
      return false
    }
  }
  
  /**
   * 获取平台特定的选择器
   */
  abstract getSelectors(): string[]
  
  /**
   * 验证页面是否已加载完成
   */
  async isPageReady(browserView: BrowserView): Promise<boolean> {
    try {
      const result = await browserView.webContents.executeJavaScript(`
        document.readyState === 'complete' && 
        document.querySelector('${this.getSelectors()[0]}') !== null
      `)
      return result as boolean
    } catch {
      return false
    }
  }
  
  /**
   * 通用注入逻辑
   */
  async inject(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
    const injectionScript = this.generateInjectionScript(prompt)
    
    try {
      console.log(`${this.platformName} 注入开始...`)
      const result = await browserView.webContents.executeJavaScript(injectionScript)
      console.log(`${this.platformName} 注入结果:`, result)
      return result as InjectionResult
    } catch (error: any) {
      console.error(`${this.platformName} 注入失败:`, error)
      return {
        success: false,
        error: error.message || '注入失败'
      }
    }
  }
  
  /**
   * 生成注入脚本
   */
  protected generateInjectionScript(prompt: string): string {
    const selectors = this.getSelectors()
    const promptJson = JSON.stringify(prompt)

    return `
      (function() {
        console.log('${this.platformName} 注入开始...');
        
        const selectors = ${JSON.stringify(selectors)};
        const prompt = ${promptJson};
        let targetElement = null;
        
        // 逐个尝试选择器
        for (const selector of selectors) {
          console.log('尝试选择器:', selector);
          const elements = document.querySelectorAll(selector);
          console.log('找到元素数量:', elements.length);
          
          for (const element of elements) {
            // 检查元素是否可见且可编辑
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             style.display !== 'none' && 
                             style.visibility !== 'hidden';
            const isEditable = !element.disabled && !element.readOnly;
            
            console.log('元素检查:', {
              selector: selector,
              visible: isVisible,
              editable: isEditable,
              tagName: element.tagName,
              placeholder: element.placeholder || element.getAttribute('aria-label')
            });
            
            if (isVisible && isEditable) {
              targetElement = element;
              console.log('找到目标元素:', element);
              break;
            }
          }
          if (targetElement) break;
        }
        
        if (!targetElement) {
          console.error('未找到可用的输入框');
          // 输出页面中所有可能的输入元素
          const allInputs = document.querySelectorAll('input, textarea, [contenteditable], [role="textbox"]');
          console.log('页面中所有输入元素:', Array.from(allInputs).map(el => ({
            tagName: el.tagName,
            type: el.type,
            placeholder: el.placeholder,
            contentEditable: el.contentEditable,
            className: el.className,
            id: el.id,
            ariaLabel: el.getAttribute('aria-label')
          })));
          return { 
            success: false, 
            error: '未找到${this.platformName}输入框，请检查页面是否完全加载' 
          };
        }
        
        console.log('开始注入到元素:', targetElement.tagName);
        
        // 关键修复：使用原生setter来触发React的状态更新
        if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
          const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          ).set;
          nativeTextareaSetter.call(targetElement, prompt);

          // 触发input事件，确保框架能检测到变化
          const event = new Event('input', { bubbles: true, cancelable: true });
          targetElement.dispatchEvent(event);
        } else if (targetElement.contentEditable === 'true') {
          targetElement.textContent = prompt;
          const event = new Event('input', { bubbles: true, cancelable: true });
          targetElement.dispatchEvent(event);
        }
        
        // 聚焦并设置光标位置
        targetElement.focus();
        if (targetElement.setSelectionRange) {
          const len = targetElement.value.length;
          targetElement.setSelectionRange(len, len);
        }
        
        console.log('${this.platformName} 注入完成');
        return { 
          success: true, 
          message: '${this.platformName} 注入成功' 
        };
      })();
    `
  }
} 