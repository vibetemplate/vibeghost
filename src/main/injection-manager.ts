import { BrowserView } from 'electron'
import { InjectionResult } from '../shared/types'
import { AdapterFactory } from './adapters'

/**
 * 注入管理器
 * 负责将提示词注入到不同AI平台的输入框中
 * 使用适配器模式支持多个AI平台
 */
export class InjectionManager {
  private static instance: InjectionManager
  private adapterFactory: AdapterFactory

  private constructor() {
    this.adapterFactory = AdapterFactory.getInstance()
  }

  static getInstance(): InjectionManager {
    if (!InjectionManager.instance) {
      InjectionManager.instance = new InjectionManager()
    }
    return InjectionManager.instance
  }

  /**
   * 注入提示词到当前页面
   * 自动检测AI平台并使用相应的适配器
   */
  async injectPrompt(browserView: BrowserView, prompt: string, siteId?: string): Promise<InjectionResult> {
    try {
      console.log('开始注入提示词，长度:', prompt.length)
      
      // 等待页面加载完成
      await this.waitForPageLoad(browserView)

      // 获取当前页面URL
      const currentUrl = browserView.webContents.getURL()
      console.log('当前页面URL:', currentUrl)

      // 根据URL或指定的siteId选择适配器
      let adapter
      if (siteId) {
        adapter = this.adapterFactory.getAdapter(siteId)
        console.log(`使用指定的适配器: ${siteId}`)
      } else {
        adapter = this.adapterFactory.getAdapterByUrl(currentUrl)
        console.log(`自动检测适配器: ${adapter?.platformName || '未找到'}`)
      }
      
      if (adapter) {
        console.log(`使用 ${adapter.platformName} 适配器进行注入`)
        
        // 检查页面是否已准备好
        const isReady = await adapter.isPageReady(browserView)
        if (!isReady) {
          console.log(`${adapter.platformName} 页面未准备好，等待加载...`)
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
        const result = await adapter.inject(browserView, prompt)
        console.log(`${adapter.platformName} 注入结果:`, result)
        return result
      } else {
        console.log('未找到匹配的适配器，使用通用注入策略')
        return await this.injectGeneric(browserView, prompt)
      }
    } catch (error: any) {
      console.error('注入失败:', error)
      return {
        success: false,
        error: error.message || '注入失败'
      }
    }
  }

  /**
   * 根据平台ID注入提示词
   */
  async injectPromptByPlatform(
    browserView: BrowserView, 
    prompt: string, 
    platformId: string
  ): Promise<InjectionResult> {
    try {
      const adapter = this.adapterFactory.getAdapter(platformId)
      
      if (adapter) {
        console.log(`使用指定的 ${adapter.platformName} 适配器进行注入`)
        return await adapter.inject(browserView, prompt)
      } else {
        return {
          success: false,
          error: `未找到平台 ${platformId} 的适配器`
        }
      }
    } catch (error: any) {
      console.error('注入失败:', error)
      return {
        success: false,
        error: error.message || '注入失败'
      }
    }
  }

  /**
   * 等待页面加载完成
   */
  private async waitForPageLoad(browserView: BrowserView): Promise<void> {
    return new Promise((resolve) => {
      if (browserView.webContents.isLoading()) {
        browserView.webContents.once('dom-ready', () => {
          setTimeout(resolve, 500) // 额外等待500ms确保DOM完全渲染
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * 通用注入方法（后备方案）
   */
  private async injectGeneric(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
        const selectors = [
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="请输入"]',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Enter"]',
          '[contenteditable="true"]',
          '.ant-input',
          'input[type="text"]',
      'textarea',
      '[role="textbox"]'
    ]

    return await this.executeGenericInjection(browserView, prompt, selectors)
  }

  /**
   * 执行通用注入操作
   */
  private async executeGenericInjection(
    browserView: BrowserView,
    prompt: string,
    selectors: string[]
  ): Promise<InjectionResult> {
    const escapedPrompt = prompt.replace(/'/g, "\\'").replace(/\n/g, '\\n')

    const injectionScript = `
      (function() {
        console.log('通用注入开始...');
        
        const selectors = ${JSON.stringify(selectors)};
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
            error: '未找到输入框，请检查页面是否完全加载' 
          };
        }
        
        console.log('开始注入到元素:', targetElement.tagName);
        
        // 清空现有内容并注入新内容
        if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
          targetElement.value = '';
          targetElement.value = '${escapedPrompt}';
          
          // 触发各种事件确保框架能检测到变化
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
          targetElement.dispatchEvent(new Event('change', { bubbles: true }));
          targetElement.dispatchEvent(new Event('keyup', { bubbles: true }));
          targetElement.dispatchEvent(new Event('paste', { bubbles: true }));
        } else if (targetElement.contentEditable === 'true') {
          targetElement.textContent = '${escapedPrompt}';
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
          targetElement.dispatchEvent(new Event('DOMCharacterDataModified', { bubbles: true }));
        }
        
        // 聚焦并设置光标位置
        targetElement.focus();
        if (targetElement.setSelectionRange) {
          const len = targetElement.value.length;
          targetElement.setSelectionRange(len, len);
        }
        
        console.log('通用注入完成');
      return {
          success: true, 
          message: '通用注入成功' 
        };
      })();
    `

    try {
      console.log('通用注入开始...')
      const result = await browserView.webContents.executeJavaScript(injectionScript)
      console.log('通用注入结果:', result)
      return result as InjectionResult
    } catch (error: any) {
      console.error('通用注入失败:', error)
      return {
        success: false,
        error: error.message || '注入失败'
      }
    }
  }

  /**
   * 获取所有支持的AI平台信息
   */
  getSupportedPlatforms(): Array<{
    id: string
    name: string
    url: string
    requiresProxy: boolean
  }> {
    return this.adapterFactory.getAllPlatforms()
  }

  /**
   * 检查平台是否需要代理
   */
  requiresProxy(platformId: string): boolean {
    return this.adapterFactory.requiresProxy(platformId)
  }

  /**
   * 从URL检测网站类型（向后兼容）
   */
  private detectSiteFromUrl(url: string): string {
    if (url.includes('chat.deepseek.com')) return 'deepseek'
    if (url.includes('chat.openai.com')) return 'chatgpt'
    if (url.includes('claude.ai')) return 'claude'
    if (url.includes('gemini.google.com')) return 'gemini'
    if (url.includes('kimi.moonshot.cn')) return 'kimi'
    if (url.includes('tongyi.aliyun.com')) return 'tongyi'
    
    return 'generic'
  }
}