import { BrowserView } from 'electron'

export async function simpleInject(browserView: BrowserView, prompt: string) {
  try {
    console.log('开始简单注入测试...')
    
    // 最简单的注入脚本，逐步增加复杂度
    const testScript = `
      console.log('脚本开始执行');
      'success';
    `
    
    const testResult = await browserView.webContents.executeJavaScript(testScript)
    console.log('基础脚本测试结果:', testResult)
    
    if (testResult !== 'success') {
      return { success: false, error: '基础脚本执行失败' }
    }
    
    // 第二步：尝试查找元素
    const findScript = `
      (function() {
        console.log('查找输入元素...');
        const textareas = document.querySelectorAll('textarea');
        const inputs = document.querySelectorAll('input[type="text"]');
        const editables = document.querySelectorAll('[contenteditable="true"]');
        
        console.log('找到 textarea:', textareas.length);
        console.log('找到 input[text]:', inputs.length);
        console.log('找到 contenteditable:', editables.length);
        
        // 返回元素信息
        return {
          textareas: textareas.length,
          inputs: inputs.length,
          editables: editables.length,
          total: textareas.length + inputs.length + editables.length
        };
      })()
    `
    
    const findResult = await browserView.webContents.executeJavaScript(findScript)
    console.log('查找元素结果:', findResult)
    
    if (findResult.total === 0) {
      return { success: false, error: '页面中没有找到输入元素' }
    }
    
    // 第三步：使用更安全的方式注入完整提示词
    const safePrompt = prompt
      .replace(/\\/g, '\\\\')  // 转义反斜杠
      .replace(/'/g, "\\'")    // 转义单引号
      .replace(/"/g, '\\"')    // 转义双引号
      .replace(/\n/g, '\\n')   // 转义换行符
      .replace(/\r/g, '\\r')   // 转义回车符
      .replace(/\t/g, '\\t')   // 转义制表符
    
    const injectScript = `
      (function() {
        console.log('开始注入提示词，原始长度: ${prompt.length}');
        
        // 查找所有可能的输入元素
        const elements = [
          ...document.querySelectorAll('textarea'),
          ...document.querySelectorAll('input[type="text"]'),
          ...document.querySelectorAll('[contenteditable="true"]')
        ];
        
        console.log('总共找到', elements.length, '个元素');
        
        // 找第一个可见的元素
        let target = null;
        for (let el of elements) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            target = el;
            console.log('选中元素:', el.tagName, el.placeholder || el.getAttribute('aria-label'));
            break;
          }
        }
        
        if (!target) {
          console.log('没有找到可见的输入元素');
          return { success: false, error: '没有找到可见的输入元素' };
        }
        
        // 尝试注入
        try {
          // 先聚焦
          target.focus();
          
          // 清空现有内容并注入完整提示词
          if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
            // 先清空
            target.value = '';
            target.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 直接设置完整内容
            target.value = '${safePrompt}';
            
            // 触发多种事件确保React能检测到变化
            const events = ['input', 'change', 'keyup', 'paste', 'focus'];
            events.forEach(eventType => {
              target.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
            
            // 特别触发 React 的合成事件
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            
            if (target.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
              nativeTextAreaValueSetter.call(target, '${safePrompt}');
            } else if (nativeInputValueSetter) {
              nativeInputValueSetter.call(target, '${safePrompt}');
            }
            
            // 再次触发事件
            target.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 设置光标位置到末尾
            if (target.setSelectionRange) {
              const len = target.value.length;
              target.setSelectionRange(len, len);
            }
            
            console.log('设置后内容长度:', target.value.length);
            console.log('内容预览:', target.value.substring(0, 100) + '...');
            
          } else {
            // contenteditable 元素
            target.textContent = '';
            target.dispatchEvent(new Event('input', { bubbles: true }));
            
            target.textContent = '${safePrompt}';
            target.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 设置光标到末尾
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(target);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            
            console.log('设置后内容长度:', target.textContent.length);
          }
          
          console.log('注入过程完成');
          return { success: true, message: '完整注入成功，长度: ${prompt.length}' };
          
        } catch (err) {
          console.error('注入时出错:', err);
          return { success: false, error: '注入时出错: ' + err.message };
        }
      })()
    `
    
    const injectResult = await browserView.webContents.executeJavaScript(injectScript)
    console.log('注入结果:', injectResult)
    
    return injectResult || { success: false, error: '注入脚本返回空结果' }
    
  } catch (error: any) {
    console.error('简单注入失败:', error)
    return {
      success: false,
      error: '简单注入失败: ' + error.message
    }
  }
}