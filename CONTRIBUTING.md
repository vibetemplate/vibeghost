# 贡献指南

感谢您对 VibeGhost 项目的关注！我们欢迎所有形式的贡献，无论是报告 Bug、提出新功能建议，还是提交代码改进。

## 🤝 贡献方式

### 🐛 报告问题

在报告问题之前，请先：

1. **搜索现有 Issues**：确认问题尚未被报告
2. **检查版本**：确保使用的是最新版本
3. **重现问题**：尝试在不同环境中重现问题

#### 创建 Issue 时请包含：

- **问题描述**：清晰描述遇到的问题
- **复现步骤**：详细的操作步骤
- **预期行为**：期望的正确行为
- **实际行为**：实际发生的错误行为
- **环境信息**：
  - 操作系统版本
  - Node.js 版本
  - 应用版本
  - 相关截图或错误日志

#### Issue 模板示例：

```markdown
**问题描述**
简要描述问题

**复现步骤**
1. 打开应用
2. 点击 '...'
3. 查看错误

**预期行为**
应该发生什么

**实际行为**
实际发生了什么

**环境信息**
- OS: [例如 macOS 12.0]
- Node.js: [例如 16.14.0]
- 应用版本: [例如 1.0.0]

**附加信息**
其他相关信息、截图或日志
```

### 💡 功能建议

我们欢迎新功能建议！请：

1. **描述使用场景**：说明为什么需要这个功能
2. **提供详细说明**：功能应该如何工作
3. **考虑替代方案**：是否有其他解决方案
4. **评估影响**：功能对现有用户的影响

### 🔧 代码贡献

#### 开发环境设置

1. **Fork 仓库**
```bash
git clone https://github.com/your-username/vibeghost.git
cd vibeghost
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **运行测试**
```bash
npm test
```

#### 开发流程

1. **创建功能分支**
```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

2. **进行开发**
   - 遵循项目代码规范
   - 添加必要的测试
   - 更新相关文档

3. **提交更改**
```bash
git add .
git commit -m "feat: add your feature description"
```

4. **推送分支**
```bash
git push origin feature/your-feature-name
```

5. **创建 Pull Request**
   - 提供清晰的标题和描述
   - 关联相关 Issues
   - 确保 CI 检查通过

## 📝 代码规范

### TypeScript 规范

- 使用严格的 TypeScript 配置
- 为所有函数和变量提供类型注解
- 避免使用 `any` 类型
- 优先使用接口而不是类型别名

```typescript
// ✅ 好的示例
interface UserConfig {
  name: string;
  age: number;
  preferences: Record<string, boolean>;
}

function createUser(config: UserConfig): User {
  // 实现
}

// ❌ 避免的示例
function createUser(config: any): any {
  // 实现
}
```

### React 组件规范

- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- Props 接口以组件名 + Props 命名
- 使用 TypeScript 严格模式

```typescript
// ✅ 好的示例
interface ButtonProps {
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ title, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {title}
    </button>
  );
};
```

### 文件和目录命名

- 组件文件：`PascalCase.tsx`
- 工具函数：`kebab-case.ts`
- 常量文件：`UPPER_CASE.ts`
- 目录：`kebab-case`

### 代码格式化

项目使用 ESLint 和 Prettier 进行代码格式化：

```bash
# 检查代码规范
npm run lint

# 自动修复格式问题
npm run lint:fix

# 格式化代码
npm run format
```

### Git 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### 提交类型

- `feat`: 新功能
- `fix`: 问题修复
- `docs`: 文档更新
- `style`: 代码格式修改
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例

```bash
feat(injection): add support for new AI platform
fix(proxy): resolve connection timeout issue
docs(readme): update installation guide
style(components): fix indentation in Button component
refactor(utils): extract common validation logic
test(injection): add unit tests for DeepSeek adapter
chore(deps): update electron to v28.0.0
```

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- injection-manager.test.ts

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 编写测试

- 为新功能编写相应的测试
- 测试文件命名：`*.test.ts` 或 `*.spec.ts`
- 使用描述性的测试名称
- 遵循 AAA 模式（Arrange, Act, Assert）

```typescript
// 示例测试
describe('InjectionManager', () => {
  describe('injectPrompt', () => {
    it('should successfully inject prompt to DeepSeek', async () => {
      // Arrange
      const manager = new InjectionManager();
      const mockBrowserView = createMockBrowserView();
      const prompt = 'Test prompt';

      // Act
      const result = await manager.injectPrompt(mockBrowserView, prompt, 'deepseek');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('注入成功');
    });
  });
});
```

## 📚 文档贡献

### 文档类型

- **README.md**: 项目概述和快速开始
- **API.md**: API 文档
- **CONTRIBUTING.md**: 贡献指南
- **CHANGELOG.md**: 版本更新记录

### 文档规范

- 使用 Markdown 格式
- 提供中英文版本（如适用）
- 包含代码示例
- 保持内容简洁明了
- 定期更新过时信息

### 文档更新流程

1. 识别需要更新的文档
2. 创建文档更新分支
3. 进行必要的修改
4. 提交 Pull Request
5. 等待审核和合并

## 🎯 开发最佳实践

### 性能优化

- **懒加载**：对非关键组件使用懒加载
- **内存管理**：及时清理事件监听器和定时器
- **缓存策略**：合理使用缓存减少重复计算
- **资源优化**：压缩图片和其他静态资源

### 错误处理

- **异常捕获**：使用 try-catch 处理可能的异常
- **用户友好**：提供清晰的错误信息
- **日志记录**：记录详细的错误日志
- **优雅降级**：在出错时提供备选方案

### 安全考虑

- **输入验证**：验证所有用户输入
- **XSS 防护**：防止跨站脚本攻击
- **敏感信息**：不在代码中硬编码敏感信息
- **依赖安全**：定期更新依赖包

## 🔄 Pull Request 流程

### 创建 PR 前的检查清单

- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 提交信息符合规范
- [ ] 没有合并冲突

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能
- [ ] 问题修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化

## 变更描述
简要描述此 PR 的变更内容

## 关联 Issue
关闭 #123

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

## 截图（如适用）
添加相关截图

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 自测通过
- [ ] 文档已更新
- [ ] 无破坏性变更
```

### 代码审查

所有 PR 都需要经过代码审查：

1. **自动检查**：CI 流水线自动运行
2. **同行审查**：至少一位维护者审查
3. **测试验证**：确保功能正常工作
4. **文档检查**：确保文档完整准确

## 🏷️ 发布流程

### 版本管理

- 遵循 [语义化版本](https://semver.org/) 规范
- 主版本：不兼容的 API 修改
- 次版本：向下兼容的功能性新增
- 修订版本：向下兼容的问题修正

### 发布步骤

1. **更新版本号**：修改 `package.json`
2. **更新变更日志**：记录此版本的变更
3. **创建发布标签**：`git tag v1.0.0`
4. **构建和测试**：确保发布版本正常
5. **发布到平台**：发布到相应平台

## 🎉 认可贡献者

我们会在以下地方认可贡献者：

- **README.md** 贡献者列表
- **CHANGELOG.md** 版本更新记录
- **GitHub Releases** 发布说明
- **项目网站**（如有）

## 📞 获得帮助

如果您在贡献过程中遇到问题，可以通过以下方式获得帮助：

- **GitHub Issues**：提出问题或建议
- **GitHub Discussions**：参与社区讨论
- **Email**：发送邮件到 your-email@example.com

## 🙏 致谢

感谢所有为 VibeGhost 项目做出贡献的开发者！您的贡献让这个项目变得更好。

---

**再次感谢您的贡献！** 🚀

让我们一起打造更好的 AI 提示词管理工具！ 