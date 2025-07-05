# AI 平台适配器架构

## 概述

VibeGhost 使用适配器模式来支持多个 AI 平台的提示词注入功能。每个 AI 平台都有独立的适配器，负责处理该平台特定的 DOM 结构和注入逻辑。

## 架构设计

### 核心组件

1. **基础适配器 (BaseAdapter)**
   - 提供通用的注入逻辑
   - 定义标准的适配器接口
   - 包含常用的选择器和事件处理

2. **平台适配器 (Platform Adapters)**
   - 每个 AI 平台的专用适配器
   - 包含平台特定的选择器和注入策略
   - 继承自 BaseAdapter

3. **适配器工厂 (AdapterFactory)**
   - 管理所有适配器实例
   - 提供适配器的创建和获取
   - 支持基于 URL 的自动检测

4. **注入管理器 (InjectionManager)**
   - 协调适配器的使用
   - 提供统一的注入接口
   - 处理失败回退逻辑

### 文件结构

```
src/main/adapters/
├── base-adapter.ts          # 基础适配器和接口定义
├── deepseek-adapter.ts      # DeepSeek 适配器
├── chatgpt-adapter.ts       # ChatGPT 适配器
├── claude-adapter.ts        # Claude 适配器
├── gemini-adapter.ts        # Gemini 适配器
├── kimi-adapter.ts          # Kimi 适配器
├── tongyi-adapter.ts        # 通义千问适配器
├── adapter-factory.ts       # 适配器工厂
└── index.ts                 # 模块导出
```

## 支持的 AI 平台

| 平台 | 适配器 | URL 匹配 | 需要代理 |
|------|--------|----------|----------|
| DeepSeek | DeepSeekAdapter | `chat.deepseek.com` | ❌ |
| ChatGPT | ChatGPTAdapter | `chat.openai.com` | ✅ |
| Claude | ClaudeAdapter | `claude.ai` | ✅ |
| Gemini | GeminiAdapter | `gemini.google.com` | ✅ |
| Kimi | KimiAdapter | `kimi.moonshot.cn` | ❌ |
| 通义千问 | TongyiAdapter | `tongyi.aliyun.com` | ❌ |

## 使用方法

### 1. 自动检测注入

```typescript
const injectionManager = InjectionManager.getInstance()
const result = await injectionManager.injectPrompt(browserView, prompt)
```

### 2. 指定平台注入

```typescript
const result = await injectionManager.injectPromptByPlatform(
  browserView, 
  prompt, 
  'deepseek'
)
```

### 3. 获取平台信息

```typescript
const platforms = injectionManager.getSupportedPlatforms()
console.log(platforms)
// [
//   { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', requiresProxy: false },
//   { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com', requiresProxy: true },
//   ...
// ]
```

## 添加新平台

### 1. 创建适配器

```typescript
// src/main/adapters/newai-adapter.ts
import { BaseAdapter } from './base-adapter'

export class NewAIAdapter extends BaseAdapter {
  readonly platformId = 'newai'
  readonly platformName = 'NewAI'
  readonly platformUrl = 'https://newai.com'
  readonly requiresProxy = false

  getSelectors(): string[] {
    return [
      // 平台特定选择器
      '[placeholder*="Send to NewAI"]',
      'textarea[placeholder*="NewAI"]',
      
      // 通用选择器作为后备
      ...this.commonSelectors
    ]
  }

  isCurrentPlatform(url: string): boolean {
    return url.includes('newai.com')
  }
}
```

### 2. 注册适配器

```typescript
// src/main/adapters/adapter-factory.ts
import { NewAIAdapter } from './newai-adapter'

private initializeAdapters(): void {
  const adapterInstances = [
    // ... 现有适配器
    new NewAIAdapter()
  ]
  // ...
}
```

### 3. 导出适配器

```typescript
// src/main/adapters/index.ts
export { NewAIAdapter } from './newai-adapter'
```

## 注入机制

### 选择器优先级

1. **平台特定选择器** - 最高优先级
2. **通用选择器** - 中等优先级
3. **后备选择器** - 最低优先级

### 元素检查

每个元素都会经过以下检查：
- ✅ 元素可见性 (width > 0, height > 0)
- ✅ 元素可编辑性 (!disabled, !readOnly)
- ✅ 元素显示状态 (display !== 'none')

### 事件触发

注入成功后会触发以下事件：
- `input` - 输入事件
- `change` - 变化事件
- `keyup` - 按键事件
- `paste` - 粘贴事件 (适用于某些框架)

## 调试功能

### 1. 控制台日志

每个适配器都会输出详细的调试信息：
```
DeepSeek 注入开始...
尝试选择器: [placeholder="给 DeepSeek 发送消息"]
找到元素数量: 1
元素检查: { selector: ..., visible: true, editable: true, ... }
找到目标元素: <textarea>
开始注入到元素: TEXTAREA
DeepSeek 注入完成
```

### 2. 错误诊断

当注入失败时，会输出页面中所有可能的输入元素：
```
页面中所有输入元素: [
  { tagName: 'TEXTAREA', placeholder: '...', className: '...', ... },
  { tagName: 'INPUT', type: 'text', ... },
  ...
]
```

## 最佳实践

### 1. 选择器设计

- 使用最具体的选择器（如 placeholder 文本）
- 提供多个备选选择器
- 包含通用选择器作为后备

### 2. 错误处理

- 提供详细的错误信息
- 实现失败回退机制
- 记录调试信息

### 3. 性能优化

- 使用单例模式管理适配器
- 缓存适配器实例
- 避免重复创建对象

## 故障排除

### 常见问题

1. **注入失败**
   - 检查选择器是否正确
   - 确认页面已完全加载
   - 查看控制台调试信息

2. **元素找不到**
   - 更新选择器列表
   - 检查页面 DOM 结构变化
   - 使用浏览器开发者工具验证

3. **事件不触发**
   - 添加更多事件类型
   - 检查框架特定的事件需求
   - 验证元素的事件监听器

### 调试步骤

1. 打开开发者工具
2. 查看控制台日志
3. 检查元素选择器
4. 验证注入脚本执行
5. 测试不同的选择器组合

## 扩展性

适配器架构具有良好的扩展性：

- **新平台支持** - 轻松添加新的 AI 平台
- **功能增强** - 可以为特定平台添加特殊功能
- **维护性** - 每个平台的逻辑独立，便于维护
- **测试性** - 可以单独测试每个适配器

## 总结

通过适配器模式，VibeGhost 实现了：
- 🎯 **精确注入** - 每个平台都有专门的注入策略
- 🔧 **易于维护** - 模块化设计，便于更新和修复
- 📈 **可扩展性** - 轻松添加新的 AI 平台支持
- 🐛 **调试友好** - 详细的日志和错误诊断
- 🚀 **高性能** - 单例模式和缓存机制 