# VibeGhost - AI 提示词助手 🚀

<div align="center">

![VibeGhost Logo](https://img.shields.io/badge/VibeGhost-AI%20Assistant-blue?style=for-the-badge&logo=electron)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F?style=flat&logo=electron)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?style=flat&logo=typescript)](https://typescriptlang.org/)

**一款专为提升 AI 对话效率而设计的桌面端提示词管理工具**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用指南](#-使用指南) • [贡献指南](#-贡献指南) • [许可证](#-许可证)

</div>

## 📖 项目简介

VibeGhost 是一款革命性的桌面端 AI 提示词助手，专为提升 AI 对话效率而设计。通过创新的双视图布局，将丰富的提示词库与主流 AI 聊天平台无缝集成，让您的 AI 对话更加高效、专业。

### 🎯 核心价值

- **📈 效率提升**：一键注入专业提示词，告别重复输入
- **🎨 体验优化**：简洁直观的界面设计，专注核心功能
- **🌐 多平台支持**：兼容主流 AI 服务，统一管理体验
- **🔧 智能代理**：内置代理支持，轻松访问海外 AI 服务
- **📚 丰富资源**：内置 300+ 专业提示词，覆盖各行各业

## ✨ 功能特性

### 🖥️ 双视图布局
- **左侧**：智能提示词库，支持分类浏览和快速搜索
- **右侧**：内嵌 AI 聊天界面，支持多平台切换

### 🎯 一键注入
- 点击提示词即可自动填充到 AI 聊天输入框
- 支持智能识别不同平台的输入框结构
- 自动触发相应事件，确保框架正确响应

### 🌍 多平台支持
- **国内平台**：DeepSeek、Kimi、通义千问
- **海外平台**：ChatGPT、Claude、Gemini
- **自动适配**：智能识别平台特性，优化注入体验

### 🔗 智能代理
- **多协议支持**：HTTP/HTTPS/SOCKS5 代理
- **认证支持**：用户名密码认证
- **连接测试**：一键测试代理可用性
- **智能切换**：根据目标网站自动启用代理

### 📚 提示词管理
- **丰富分类**：编程、写作、分析、创意等多个领域
- **智能搜索**：支持关键词、标签、内容全文搜索
- **使用统计**：记录使用频率，优化推荐算法
- **自定义扩展**：支持添加个人提示词库

### 🎨 用户体验
- **响应式设计**：适配不同屏幕尺寸
- **主题支持**：明暗主题切换
- **快捷键支持**：提升操作效率
- **状态保持**：记住用户偏好设置

## 🛠️ 技术栈

### 前端技术
- **Electron 28.0.0** - 跨平台桌面应用框架
- **React 18.2.0** - 现代化 UI 框架
- **TypeScript 5.3.3** - 类型安全的 JavaScript 超集
- **Vite 5.0.10** - 快速的前端构建工具
- **Ant Design 5.12.8** - 企业级 UI 组件库

### 后端技术
- **Node.js** - JavaScript 运行时环境
- **Electron Store** - 数据持久化存储
- **Axios** - HTTP 客户端库

### 代理支持
- **https-proxy-agent** - HTTPS 代理支持
- **socks-proxy-agent** - SOCKS 代理支持

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Electron Builder** - 应用打包工具

## 🚀 快速开始

### 📋 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0 或 **yarn** >= 1.22.0
- **Git** >= 2.0.0

### 📦 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/your-username/vibeghost.git
cd vibeghost
```

2. **安装依赖**
```bash
npm install
# 或者使用 yarn
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **等待启动完成**
   - 主应用渲染进程（端口 8173）
   - 侧边栏应用（端口 8174）
   - Electron 主进程

### 🔧 开发模式说明

开发模式会同时启动三个进程：

- **主渲染进程**：主应用界面
- **侧边栏进程**：提示词库界面
- **Electron 主进程**：应用核心逻辑

请确保所有进程都成功启动后再进行开发。

## 🎮 使用指南

### 🚀 基本使用

1. **启动应用**
   - 双击应用图标或运行 `npm run dev`
   - 等待应用完全加载

2. **浏览提示词**
   - 左侧显示分类提示词库
   - 使用搜索框快速查找
   - 点击分类标签过滤内容

3. **使用提示词**
   - 点击任意提示词的"使用"按钮
   - 内容将自动填充到右侧 AI 聊天输入框
   - 可以编辑内容后发送

### 🌐 网站切换

点击右上角的网站选择器，可在不同 AI 平台间切换：

| 平台 | 访问方式 | 代理需求 | 特点 |
|------|----------|----------|------|
| **DeepSeek** | 直接访问 | ❌ | 国产 AI，响应快速 |
| **ChatGPT** | 需要代理 | ✅ | OpenAI 官方服务 |
| **Claude** | 需要代理 | ✅ | Anthropic AI 助手 |
| **Gemini** | 需要代理 | ✅ | Google AI 服务 |
| **Kimi** | 直接访问 | ❌ | 月之暗面 AI |
| **通义千问** | 直接访问 | ❌ | 阿里云 AI 服务 |

### 🔗 代理配置

对于需要代理访问的 AI 服务，请按以下步骤配置：

1. **打开代理设置**
   - 点击右上角的网络图标
   - 或使用快捷键 `Ctrl/Cmd + P`

2. **配置代理参数**
   ```
   代理类型：HTTP/HTTPS/SOCKS5
   服务器地址：例如 127.0.0.1
   端口号：例如 7890
   用户名：（可选）
   密码：（可选）
   ```

3. **测试连接**
   - 点击"测试连接"按钮
   - 确认代理服务可用
   - 保存设置

### 📚 提示词管理

#### 搜索功能
- **关键词搜索**：输入关键词快速查找
- **标签过滤**：点击标签查看相关提示词
- **全文搜索**：搜索提示词内容

#### 使用技巧
- **快速预览**：鼠标悬停查看完整内容
- **一键复制**：右键复制提示词内容
- **使用统计**：查看最常用的提示词
- **收藏功能**：标记常用提示词

## 📁 项目结构

```
vibeghost/
├── 📁 src/                    # 源代码目录
│   ├── 📁 main/               # Electron 主进程
│   │   ├── 📄 main.ts         # 主进程入口
│   │   ├── 📄 window-manager.ts # 窗口管理器
│   │   ├── 📄 proxy-manager.ts  # 代理管理器
│   │   ├── 📄 config-manager.ts # 配置管理器
│   │   ├── 📄 injection-manager.ts # 注入管理器
│   │   └── 📄 prompt-manager.ts # 提示词管理器
│   ├── 📁 renderer/           # 渲染进程
│   │   ├── 📁 src/
│   │   │   ├── 📄 App.tsx     # 主应用组件
│   │   │   ├── 📄 SidebarApp.tsx # 侧边栏组件
│   │   │   ├── 📁 components/ # UI 组件库
│   │   │   └── 📄 main.tsx    # 渲染进程入口
│   │   ├── 📄 index.html      # 主应用模板
│   │   └── 📄 sidebar.html    # 侧边栏模板
│   ├── 📁 preload/            # 预加载脚本
│   │   └── 📄 preload.ts      # IPC 通信桥梁
│   └── 📁 shared/             # 共享模块
│       └── 📄 types.ts        # TypeScript 类型定义
├── 📁 resources/              # 应用资源
├── 📁 scripts/                # 构建脚本
├── 📁 dist/                   # 构建输出
├── 📄 package.json            # 项目配置
├── 📄 electron.vite.config.ts # Vite 配置
├── 📄 tsconfig.json           # TypeScript 配置
└── 📄 README.md               # 项目文档
```

## ⚙️ 配置文件

### 📋 应用配置 (config.json)

应用配置保存在用户数据目录下：

```json
{
  "window": {
    "width": 1200,
    "height": 800,
    "x": 100,
    "y": 100
  },
  "proxy": {
    "enabled": false,
    "type": "http",
    "host": "127.0.0.1",
    "port": 7890,
    "auth": {
      "username": "",
      "password": ""
    }
  },
  "sites": {
    "current": "deepseek",
    "preferences": {
      "deepseek": { "autoFocus": true },
      "chatgpt": { "autoFocus": true }
    }
  },
  "theme": "light",
  "language": "zh-CN"
}
```

### 📚 提示词数据 (prompts.json)

```json
{
  "version": "1.0.0",
  "categories": [
    {
      "id": "programming",
      "name": "编程开发",
      "icon": "code",
      "prompts": [
        {
          "id": "code-review",
          "title": "代码审查",
          "content": "请帮我审查以下代码...",
          "tags": ["代码", "审查", "质量"],
          "usage": 15,
          "created": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

## 🔨 构建部署

### 🏗️ 构建项目

```bash
# 构建所有组件
npm run build

# 仅构建主进程
npm run build:main

# 仅构建渲染进程
npm run build:renderer
```

### 📦 打包应用

```bash
# 打包当前平台
npm run dist

# 打包 macOS
npm run dist:mac

# 打包 Windows
npm run dist:win

# 打包 Linux
npm run dist:linux
```

### 📋 系统要求

| 平台 | 最低版本 | 推荐版本 |
|------|----------|----------|
| **Windows** | Windows 7 | Windows 10+ |
| **macOS** | macOS 10.12 | macOS 12+ |
| **Linux** | Ubuntu 16.04 | Ubuntu 20.04+ |

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是报告 Bug、提出新功能建议，还是提交代码改进。

### 🐛 报告问题

1. **搜索现有 Issues**：确认问题未被报告
2. **创建详细报告**：包含复现步骤、环境信息
3. **提供日志信息**：帮助快速定位问题

### 💡 功能建议

1. **描述使用场景**：说明功能的实际需求
2. **提供设计思路**：如果有具体实现想法
3. **考虑兼容性**：确保不影响现有功能

### 🔧 代码贡献

1. **Fork 项目**
```bash
git clone https://github.com/your-username/vibeghost.git
```

2. **创建功能分支**
```bash
git checkout -b feature/amazing-feature
```

3. **开发和测试**
```bash
npm run dev
npm run test
```

4. **提交更改**
```bash
git commit -m 'feat: add amazing feature'
```

5. **推送分支**
```bash
git push origin feature/amazing-feature
```

6. **创建 Pull Request**
   - 详细描述更改内容
   - 关联相关 Issues
   - 确保 CI 通过

### 📝 代码规范

- **TypeScript**：使用严格类型检查
- **ESLint**：遵循项目 ESLint 配置
- **Prettier**：保持代码格式一致
- **Git Commit**：使用语义化提交信息

```bash
# 提交信息格式
<type>(<scope>): <description>

# 示例
feat(injection): add support for new AI platform
fix(proxy): resolve connection timeout issue
docs(readme): update installation guide
```

## 🧪 测试

### 🔍 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成覆盖率报告
npm run test:coverage
```

### 🐛 调试

```bash
# 启用调试模式
npm run dev:debug

# 查看详细日志
npm run dev -- --verbose

# 打开开发者工具
Ctrl/Cmd + Shift + I
```

## 📊 性能优化

### ⚡ 启动优化
- 预加载核心模块
- 延迟加载非关键组件
- 优化资源加载顺序

### 💾 内存管理
- 及时清理事件监听器
- 优化大型数据结构
- 实现智能缓存机制

### 🌐 网络优化
- 智能代理切换
- 请求去重和缓存
- 连接池管理

## 🔒 安全性

### 🛡️ 数据安全
- 本地数据加密存储
- 敏感信息脱敏处理
- 安全的 IPC 通信

### 🌐 网络安全
- HTTPS 强制验证
- 代理连接加密
- 防止 XSS 攻击

### 🔐 隐私保护
- 不收集用户数据
- 本地化数据存储
- 可选的使用统计

## 📈 路线图

### 🎯 近期计划 (v1.1.0)
- [ ] 支持更多 AI 平台
- [ ] 提示词模板系统
- [ ] 快捷键自定义
- [ ] 主题自定义

### 🚀 中期计划 (v1.2.0)
- [ ] 云同步功能
- [ ] 团队协作
- [ ] 插件系统
- [ ] 移动端支持

### 🌟 长期愿景 (v2.0.0)
- [ ] AI 智能推荐
- [ ] 语音交互
- [ ] 多语言支持
- [ ] 企业版功能

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。您可以自由地使用、修改和分发本软件。

```
MIT License

Copyright (c) 2024 VibeGhost Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 致谢

感谢以下开源项目和贡献者：

- **Electron** - 强大的跨平台桌面应用框架
- **React** - 现代化的用户界面库
- **Ant Design** - 优秀的企业级 UI 组件库
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 快速的前端构建工具

特别感谢所有为项目贡献代码、报告问题、提出建议的开发者们！

## 📞 联系我们

- **GitHub Issues**：[提交问题或建议](https://github.com/your-username/vibeghost/issues)
- **GitHub Discussions**：[参与社区讨论](https://github.com/your-username/vibeghost/discussions)
- **Email**：your-email@example.com

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/vibeghost&type=Date)](https://star-history.com/#your-username/vibeghost&Date)

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐ Star！**

**享受高效的 AI 提示词管理体验！** 🚀

Made with ❤️ by VibeGhost Team

</div>