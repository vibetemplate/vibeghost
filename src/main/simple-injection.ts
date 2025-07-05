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
    
    // 第三步：尝试注入到第一个可见的输入元素
    const injectScript = `
      (function() {
        console.log('开始注入...');
        
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
          target.focus();
          
          if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
            target.value = ${JSON.stringify(prompt)};
            target.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            target.textContent = ${JSON.stringify(prompt)};
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          console.log('注入成功');
          return { success: true, message: '注入成功' };
          
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