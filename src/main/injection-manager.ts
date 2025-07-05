import { BrowserView } from 'electron'
import { InjectionResult } from '../shared/types'
import { simpleInject } from './simple-injection'

export class InjectionManager {
  private siteAdapters: Map<string, SiteAdapter> = new Map()

  constructor() {
    this.initializeAdapters()
  }

  private initializeAdapters(): void {
    // 注册各种网站的适配器
    this.siteAdapters.set('deepseek', new DeepSeekAdapter())
    this.siteAdapters.set('chatgpt', new ChatGPTAdapter())
    this.siteAdapters.set('claude', new ClaudeAdapter())
    this.siteAdapters.set('gemini', new GeminiAdapter())
    this.siteAdapters.set('kimi', new KimiAdapter())
    this.siteAdapters.set('tongyi', new TongyiAdapter())
    
    // 通用适配器作为后备
    this.siteAdapters.set('generic', new GenericAdapter())
  }

  async injectPrompt(browserView: BrowserView, prompt: string, siteId?: string): Promise<InjectionResult> {
    try {
      console.log('开始注入提示词，长度:', prompt.length)
      
      // 等待页面加载完成
      await this.waitForPageLoad(browserView)

      // 先尝试简单注入方法
      console.log('尝试简单注入方法...')
      const simpleResult = await simpleInject(browserView, prompt)
      
      if (simpleResult.success) {
        console.log('简单注入成功')
        return simpleResult
      }
      
      console.log('简单注入失败，尝试适配器方法...', simpleResult.error)
      
      // 如果简单注入失败，再尝试适配器方法
      const currentUrl = browserView.webContents.getURL()
      const detectedSiteId = siteId || this.detectSiteFromUrl(currentUrl)
      
      const adapter = this.siteAdapters.get(detectedSiteId) || this.siteAdapters.get('generic')
      
      if (!adapter) {
        return {
          success: false,
          error: '未找到适配器'
        }
      }

      const result = await adapter.inject(browserView, prompt)
      
      console.log(`提示词注入${result.success ? '成功' : '失败'}:`, detectedSiteId, result.message || result.error)
      
      return result
    } catch (error: any) {
      console.error('注入提示词时发生错误:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  private detectSiteFromUrl(url: string): string {
    if (url.includes('chat.deepseek.com')) return 'deepseek'
    if (url.includes('chat.openai.com')) return 'chatgpt'
    if (url.includes('claude.ai')) return 'claude'
    if (url.includes('gemini.google.com')) return 'gemini'
    if (url.includes('kimi.moonshot.cn')) return 'kimi'
    if (url.includes('tongyi.aliyun.com')) return 'tongyi'
    
    return 'generic'
  }

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
}

// 站点适配器接口
interface SiteAdapter {
  inject(browserView: BrowserView, prompt: string): Promise<InjectionResult>
}

// 通用适配器
class GenericAdapter implements SiteAdapter {
  async inject(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
    const injectionScript = `
      (function() {
        const selectors = [
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="请输入"]',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Enter"]',
          '[contenteditable="true"]',
          '.ant-input',
          'input[type="text"]',
          'textarea'
        ];
        
        let targetElement = null;
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (element.offsetWidth > 0 && element.offsetHeight > 0) {
              targetElement = element;
              break;
            }
          }
          if (targetElement) break;
        }
        
        if (!targetElement) {
          return { success: false, error: '未找到输入框' };
        }
        
        // 清空现有内容
        if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
          targetElement.value = '${prompt.replace(/'/g, "\\'")}';
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
          targetElement.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          targetElement.textContent = '${prompt.replace(/'/g, "\\'")}';
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // 聚焦到输入框
        targetElement.focus();
        
        // 设置光标到末尾
        if (targetElement.setSelectionRange) {
          targetElement.setSelectionRange(targetElement.value.length, targetElement.value.length);
        }
        
        return { success: true, message: '注入成功' };
      })();
    `

    try {
      const result = await browserView.webContents.executeJavaScript(injectionScript)
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// DeepSeek适配器
class DeepSeekAdapter implements SiteAdapter {
  async inject(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
    // 先运行调试脚本，获取页面的实际结构
    const debugScript = `
      (function() {
        console.log('=== DeepSeek DOM 调试开始 ===');
        console.log('页面 URL:', window.location.href);
        console.log('页面标题:', document.title);
        
        // 查找所有可能的输入元素
        const allInputs = document.querySelectorAll('input, textarea, [contenteditable], [role="textbox"]');
        console.log('所有输入元素数量:', allInputs.length);
        
        allInputs.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           window.getComputedStyle(el).display !== 'none' &&
                           window.getComputedStyle(el).visibility !== 'hidden';
          
          console.log('输入元素 ' + index + ':', {
            tagName: el.tagName,
            type: el.type,
            placeholder: el.placeholder,
            value: el.value,
            textContent: el.textContent?.substring(0, 50),
            className: el.className,
            id: el.id,
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            contentEditable: el.contentEditable,
            visible: isVisible,
            rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
            disabled: el.disabled,
            readOnly: el.readOnly
          });
        });
        
        // 特别查找包含 "DeepSeek" 或 "发送消息" 的元素
        const deepseekElements = document.querySelectorAll('*');
        const candidates = [];
        deepseekElements.forEach(el => {
          const text = el.textContent || '';
          const placeholder = el.placeholder || '';
          const ariaLabel = el.getAttribute('aria-label') || '';
          
          if (text.includes('DeepSeek') || text.includes('发送消息') || 
              placeholder.includes('DeepSeek') || placeholder.includes('发送消息') ||
              ariaLabel.includes('DeepSeek') || ariaLabel.includes('发送消息')) {
            const rect = el.getBoundingClientRect();
            candidates.push({
              element: el,
              tagName: el.tagName,
              text: text.substring(0, 100),
              placeholder: placeholder,
              ariaLabel: ariaLabel,
              className: el.className,
              id: el.id,
              rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left }
            });
          }
        });
        
        console.log('包含 DeepSeek/发送消息 的元素:', candidates);
        
        // 查找最可能的输入框
        const textboxes = document.querySelectorAll('[role="textbox"]');
        console.log('role="textbox" 元素:', Array.from(textboxes).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          ariaLabel: el.getAttribute('aria-label'),
          placeholder: el.placeholder,
          textContent: el.textContent?.substring(0, 50),
          rect: el.getBoundingClientRect()
        })));
        
        console.log('=== DeepSeek DOM 调试结束 ===');
        return { success: true, debug: true };
      })();
    `;
    
    try {
      // 先运行调试脚本
      await browserView.webContents.executeJavaScript(debugScript);
      
      // 然后尝试实际注入
      const injectionScript = `
        (function() {
          console.log('DeepSeek注入开始...');
          
          // 基于调试信息的精确选择器
          const selectors = [
            // 最直接的选择器
            '[role="textbox"]',
            'textarea[placeholder*="DeepSeek"]',
            'textarea[placeholder*="发送消息"]',
            '[placeholder*="DeepSeek"]',
            '[placeholder*="发送消息"]',
            // 通用选择器
            'textarea',
            'input[type="text"]',
            '[contenteditable="true"]',
            '.ant-input'
          ];
          
          let targetElement = null;
          
          // 逐个尝试选择器
          for (const selector of selectors) {
            console.log('尝试选择器:', selector);
            const elements = document.querySelectorAll(selector);
            console.log('找到元素数量:', elements.length);
            
            for (const element of elements) {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              const isVisible = rect.width > 0 && rect.height > 0 && 
                               style.display !== 'none' && style.visibility !== 'hidden';
              const isEditable = !element.disabled && !element.readOnly;
              
              console.log('元素检查:', {
                selector: selector,
                tagName: element.tagName,
                visible: isVisible,
                editable: isEditable,
                placeholder: element.placeholder,
                rect: { width: rect.width, height: rect.height }
              });
              
              if (isVisible && isEditable) {
                targetElement = element;
                console.log('选中目标元素:', element);
                break;
              }
            }
            if (targetElement) break;
          }
          
          if (!targetElement) {
            console.error('未找到可用的输入框');
            return { success: false, error: '未找到DeepSeek输入框' };
          }
          
          console.log('开始注入提示词到:', targetElement.tagName, targetElement.placeholder);
          
          // 注入提示词
          try {
            // 聚焦元素
            targetElement.focus();
            
            // 清空并设置内容
            if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
              targetElement.value = '';
              targetElement.value = '${prompt.replace(/'/g, "\\'")}';
              
              // 触发事件
              targetElement.dispatchEvent(new Event('input', { bubbles: true }));
              targetElement.dispatchEvent(new Event('change', { bubbles: true }));
              targetElement.dispatchEvent(new Event('keyup', { bubbles: true }));
              
              // 设置光标
              if (targetElement.setSelectionRange) {
                const len = targetElement.value.length;
                targetElement.setSelectionRange(len, len);
              }
            } else {
              // contenteditable 元素
              targetElement.textContent = '${prompt.replace(/'/g, "\\'")}';
              targetElement.dispatchEvent(new Event('input', { bubbles: true }));
              
              // 设置光标到末尾
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(targetElement);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            
            console.log('注入完成，内容:', targetElement.value || targetElement.textContent);
            return { success: true, message: 'DeepSeek注入成功' };
            
          } catch (injectError) {
            console.error('注入过程出错:', injectError);
            return { success: false, error: '注入过程出错: ' + injectError.message };
          }
        })();
      `;
      
      const result = await browserView.webContents.executeJavaScript(injectionScript);
      console.log('注入结果:', result);
      return result || { success: false, error: '注入脚本返回空结果' };
      
    } catch (error: any) {
      console.error('执行注入脚本失败:', error);
      return {
        success: false,
        error: '执行注入脚本失败: ' + error.message
      };
    }
  }
}

// ChatGPT适配器
class ChatGPTAdapter implements SiteAdapter {
  async inject(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
    const injectionScript = `
      (function() {
        const selectors = [
          '#prompt-textarea',
          '[data-testid="prompt-textarea"]',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Send a message"]',
          'div[contenteditable="true"]'
        ];
        
        let targetElement = null;
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
            targetElement = element;
            break;
          }
        }
        
        if (!targetElement) {
          return { success: false, error: '未找到ChatGPT输入框' };
        }
        
        if (targetElement.tagName === 'TEXTAREA') {
          targetElement.value = '${prompt.replace(/'/g, "\\'")}';
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          targetElement.textContent = '${prompt.replace(/'/g, "\\'")}';
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        targetElement.focus();
        
        return { success: true, message: 'ChatGPT注入成功' };
      })();
    `

    try {
      const result = await browserView.webContents.executeJavaScript(injectionScript)
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Claude适配器
class ClaudeAdapter implements SiteAdapter {
  async inject(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
    const injectionScript = `
      (function() {
        const selectors = [
          '[contenteditable="true"]',
          'textarea[placeholder*="Talk to Claude"]',
          'div[data-testid="chat-input"]'
        ];
        
        let targetElement = null;
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
            targetElement = element;
            break;
          }
        }
        
        if (!targetElement) {
          return { success: false, error: '未找到Claude输入框' };
        }
        
        if (targetElement.tagName === 'TEXTAREA') {
          targetElement.value = '${prompt.replace(/'/g, "\\'")}';
        } else {
          targetElement.textContent = '${prompt.replace(/'/g, "\\'")}';
        }
        
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        targetElement.focus();
        
        return { success: true, message: 'Claude注入成功' };
      })();
    `

    try {
      const result = await browserView.webContents.executeJavaScript(injectionScript)
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Gemini适配器
class GeminiAdapter implements SiteAdapter {
  async inject(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
    const injectionScript = `
      (function() {
        const selectors = [
          '[contenteditable="true"]',
          'textarea[placeholder*="Enter a prompt"]',
          'div[data-testid="input-field"]'
        ];
        
        let targetElement = null;
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
            targetElement = element;
            break;
          }
        }
        
        if (!targetElement) {
          return { success: false, error: '未找到Gemini输入框' };
        }
        
        if (targetElement.tagName === 'TEXTAREA') {
          targetElement.value = '${prompt.replace(/'/g, "\\'")}';
        } else {
          targetElement.textContent = '${prompt.replace(/'/g, "\\'")}';
        }
        
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        targetElement.focus();
        
        return { success: true, message: 'Gemini注入成功' };
      })();
    `

    try {
      const result = await browserView.webContents.executeJavaScript(injectionScript)
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Kimi适配器
class KimiAdapter implements SiteAdapter {
  async inject(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
    const injectionScript = `
      (function() {
        const selectors = [
          'textarea[placeholder*="请输入"]',
          '.ant-input',
          'textarea'
        ];
        
        let targetElement = null;
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
            targetElement = element;
            break;
          }
        }
        
        if (!targetElement) {
          return { success: false, error: '未找到Kimi输入框' };
        }
        
        targetElement.value = '${prompt.replace(/'/g, "\\'")}';
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        targetElement.dispatchEvent(new Event('change', { bubbles: true }));
        targetElement.focus();
        
        return { success: true, message: 'Kimi注入成功' };
      })();
    `

    try {
      const result = await browserView.webContents.executeJavaScript(injectionScript)
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// 通义千问适配器
class TongyiAdapter implements SiteAdapter {
  async inject(browserView: BrowserView, prompt: string): Promise<InjectionResult> {
    const injectionScript = `
      (function() {
        const selectors = [
          'textarea[placeholder*="请输入"]',
          '.ant-input',
          'textarea'
        ];
        
        let targetElement = null;
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
            targetElement = element;
            break;
          }
        }
        
        if (!targetElement) {
          return { success: false, error: '未找到通义千问输入框' };
        }
        
        targetElement.value = '${prompt.replace(/'/g, "\\'")}';
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        targetElement.dispatchEvent(new Event('change', { bubbles: true }));
        targetElement.focus();
        
        return { success: true, message: '通义千问注入成功' };
      })();
    `

    try {
      const result = await browserView.webContents.executeJavaScript(injectionScript)
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}