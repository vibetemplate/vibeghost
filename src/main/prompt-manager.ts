import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PromptNode } from '../shared/types'

export class PromptManager {
  private prompts: PromptNode[] = []
  private promptsPath: string

  constructor() {
    // 优先使用项目根目录的 prompts.json，如果不存在则使用用户数据目录
    const isDev = process.env.NODE_ENV === 'development'
    let projectPrompts: string
    
    if (isDev) {
      // 开发模式下，从源码目录向上查找
      projectPrompts = join(__dirname, '..', '..', 'prompts.json')
    } else {
      // 生产模式下，从app路径查找
      const appPath = app.getAppPath()
      projectPrompts = join(appPath, '..', '..', 'prompts.json')
    }
    
    const userDataPath = app.getPath('userData')
    const userPrompts = join(userDataPath, 'prompts.json')
    
    if (existsSync(projectPrompts)) {
      this.promptsPath = projectPrompts
      console.log('使用项目提示词文件:', projectPrompts)
    } else {
      this.promptsPath = userPrompts
      console.log('使用用户提示词文件:', userPrompts)
    }
  }

  async getPrompts(): Promise<PromptNode[]> {
    if (this.prompts.length === 0) {
      await this.loadPrompts()
    }
    return this.prompts
  }

  private async loadPrompts(): Promise<void> {
    try {
      console.log('尝试加载提示词文件:', this.promptsPath)
      if (existsSync(this.promptsPath)) {
        console.log('提示词文件存在，开始读取')
        const promptsData = readFileSync(this.promptsPath, 'utf-8')
        this.prompts = JSON.parse(promptsData)
        console.log('提示词加载成功，数量:', this.prompts.length)
      } else {
        console.log('提示词文件不存在，使用默认数据')
        // 如果文件不存在，创建默认提示词数据
        this.prompts = this.getDefaultPrompts()
        await this.savePrompts()
        console.log('默认提示词创建完成，数量:', this.prompts.length)
      }
    } catch (error) {
      console.error('加载提示词失败:', error)
      this.prompts = this.getDefaultPrompts()
      console.log('使用默认提示词作为后备，数量:', this.prompts.length)
    }
  }

  private async savePrompts(): Promise<void> {
    try {
      writeFileSync(this.promptsPath, JSON.stringify(this.prompts, null, 2))
    } catch (error) {
      console.error('保存提示词失败:', error)
    }
  }

  private getDefaultPrompts(): PromptNode[] {
    return [
      {
        id: "1",
        title: "📝 写作助手",
        children: [
          {
            id: "1-1",
            title: "创意写作",
            children: [
              {
                id: "1-1-1",
                title: "小说开头生成器",
                prompt: "你是一个专业的小说作家。请根据我提供的主题、类型和设定，为我创作一个引人入胜的小说开头。要求：1. 开头要有吸引力，能够立即抓住读者的注意力；2. 要体现出主要角色的特点；3. 要暗示故事的主要冲突或悬念；4. 字数控制在300-500字之间。请告诉我你需要什么信息来开始创作。",
                description: "根据主题和设定生成引人入胜的小说开头",
                tags: ["创意写作", "小说", "开头"],
                category: "写作",
                usageCount: 0,
                createdAt: new Date().toISOString()
              },
              {
                id: "1-1-2",
                title: "角色设定生成器",
                prompt: "你是一个专业的角色设定专家。请帮我创建一个详细的角色设定，包括：1. 基本信息（姓名、年龄、职业、外貌特征）；2. 性格特点（优点、缺点、习惯、恐惧）；3. 背景故事（成长经历、重要事件、人际关系）；4. 目标与动机（短期目标、长期目标、内心冲突）；5. 独特的说话方式或口头禅。请告诉我你想要什么类型的角色。",
                description: "创建详细的角色设定，包括性格、背景和动机",
                tags: ["角色设定", "创意写作", "人物"],
                category: "写作",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: "1-2",
            title: "商业写作",
            children: [
              {
                id: "1-2-1",
                title: "商业计划书助手",
                prompt: "你是一个资深的商业顾问和投资人。请帮我制定一份专业的商业计划书。我需要你按照以下结构来组织内容：1. 执行摘要；2. 公司描述；3. 市场分析；4. 产品或服务描述；5. 营销策略；6. 运营计划；7. 管理团队；8. 财务预测；9. 风险分析；10. 附录。请用专业、清晰、有说服力的语言，确保每个部分都详细且具有可操作性。",
                description: "制定专业的商业计划书",
                tags: ["商业计划", "投资", "创业"],
                category: "商业",
                usageCount: 0,
                createdAt: new Date().toISOString()
              },
              {
                id: "1-2-2",
                title: "邮件写作助手",
                prompt: "你是一个专业的商务沟通专家。请帮我写一封专业的商务邮件。我需要你考虑以下要素：1. 邮件的目的和背景；2. 收件人的身份和关系；3. 邮件的正式程度；4. 文化背景和沟通习惯。请确保邮件结构清晰（开头、主体、结尾），用词准确，语气得体，并且能够达到预期的沟通效果。",
                description: "撰写专业的商务邮件",
                tags: ["商务邮件", "沟通", "专业"],
                category: "商业",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      },
      {
        id: "2",
        title: "💻 编程助手",
        children: [
          {
            id: "2-1",
            title: "前端开发",
            children: [
              {
                id: "2-1-1",
                title: "React组件优化",
                prompt: "你是一个资深的React开发专家。请帮我优化这个React组件的性能和代码质量。我需要你从以下几个方面进行分析和改进：1. 性能优化（使用React.memo、useMemo、useCallback等）；2. 代码结构优化（组件拆分、逻辑分离）；3. 最佳实践（hooks使用、状态管理）；4. 可维护性（代码可读性、注释）；5. 错误处理和边界情况。请提供具体的改进建议和优化后的代码。",
                description: "优化React组件的性能和代码质量",
                tags: ["React", "性能优化", "前端"],
                category: "编程",
                usageCount: 0,
                createdAt: new Date().toISOString()
              },
              {
                id: "2-1-2",
                title: "CSS布局解决方案",
                prompt: "你是一个CSS布局专家。请帮我解决这个布局问题。我需要你提供：1. 多种实现方案（Flexbox、Grid、传统布局）；2. 各种方案的优缺点分析；3. 兼容性考虑；4. 响应式设计建议；5. 性能优化建议。请提供完整的HTML和CSS代码示例，并解释每种方案的适用场景。",
                description: "解决CSS布局问题并提供多种方案",
                tags: ["CSS", "布局", "响应式"],
                category: "编程",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: "2-2",
            title: "后端开发",
            children: [
              {
                id: "2-2-1",
                title: "API设计指南",
                prompt: "你是一个资深的后端架构师。请帮我设计一个RESTful API。我需要你考虑以下方面：1. API设计原则和最佳实践；2. 路由设计和命名规范；3. 请求和响应格式；4. 错误处理和状态码；5. 认证和授权机制；6. 版本控制策略；7. 文档规范；8. 性能优化和缓存策略。请提供详细的设计文档和代码示例。",
                description: "设计RESTful API并提供最佳实践",
                tags: ["API", "RESTful", "后端"],
                category: "编程",
                usageCount: 0,
                createdAt: new Date().toISOString()
              },
              {
                id: "2-2-2",
                title: "数据库设计助手",
                prompt: "你是一个数据库架构专家。请帮我设计一个高效的数据库结构。我需要你考虑：1. 数据模型设计（实体关系、范式化）；2. 索引策略；3. 查询优化；4. 数据完整性约束；5. 性能考虑；6. 扩展性设计；7. 安全性措施。请提供详细的建表语句、索引创建语句，以及相关的查询优化建议。",
                description: "设计高效的数据库结构",
                tags: ["数据库", "SQL", "架构"],
                category: "编程",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      },
      {
        id: "3",
        title: "🔍 数据分析",
        children: [
          {
            id: "3-1",
            title: "数据可视化",
            children: [
              {
                id: "3-1-1",
                title: "图表选择指南",
                prompt: "你是一个数据可视化专家。请帮我选择最适合的图表类型来展示我的数据。我需要你：1. 分析数据的特点和维度；2. 推荐最适合的图表类型；3. 解释选择理由；4. 提供设计建议（颜色、布局、交互）；5. 给出具体的实现方案（工具选择、代码示例）。请确保图表能够清晰、准确地传达数据信息。",
                description: "选择最适合的数据可视化图表类型",
                tags: ["数据可视化", "图表", "分析"],
                category: "数据分析",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: "3-2",
            title: "统计分析",
            children: [
              {
                id: "3-2-1",
                title: "数据清洗指南",
                prompt: "你是一个数据科学专家。请帮我制定一个完整的数据清洗策略。我需要你考虑：1. 数据质量评估（完整性、准确性、一致性）；2. 缺失值处理方法；3. 异常值检测和处理；4. 数据格式标准化；5. 重复数据处理；6. 数据验证规则；7. 清洗过程的文档记录。请提供具体的处理步骤和代码示例。",
                description: "制定完整的数据清洗策略",
                tags: ["数据清洗", "数据质量", "预处理"],
                category: "数据分析",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      },
      {
        id: "4",
        title: "🎨 设计创意",
        children: [
          {
            id: "4-1",
            title: "UI/UX设计",
            children: [
              {
                id: "4-1-1",
                title: "用户体验分析",
                prompt: "你是一个资深的UX设计师。请帮我分析这个产品的用户体验。我需要你从以下角度进行分析：1. 用户旅程分析（用户从认知到使用的完整流程）；2. 用户痛点识别；3. 界面可用性评估；4. 交互设计分析；5. 信息架构评估；6. 用户反馈分析；7. 改进建议和优化方案。请提供详细的分析报告和具体的改进建议。",
                description: "分析产品用户体验并提供改进建议",
                tags: ["UX", "用户体验", "可用性"],
                category: "设计",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: "4-2",
            title: "品牌设计",
            children: [
              {
                id: "4-2-1",
                title: "品牌定位策略",
                prompt: "你是一个品牌策略专家。请帮我制定一个完整的品牌定位策略。我需要你考虑：1. 目标市场分析（人群画像、需求分析）；2. 竞争对手分析；3. 品牌价值主张；4. 品牌个性和调性；5. 差异化定位；6. 品牌故事和核心信息；7. 传播策略建议。请提供详细的策略文档和执行建议。",
                description: "制定完整的品牌定位策略",
                tags: ["品牌", "定位", "策略"],
                category: "设计",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      },
      {
        id: "5",
        title: "📚 学习教育",
        children: [
          {
            id: "5-1",
            title: "知识总结",
            children: [
              {
                id: "5-1-1",
                title: "概念解释器",
                prompt: "你是一个专业的教育专家。请帮我解释这个概念或知识点。我需要你：1. 用简单易懂的语言解释核心概念；2. 提供具体的例子和类比；3. 分析相关的背景知识；4. 解释应用场景和重要性；5. 提供相关的延伸知识；6. 设计一些练习题或思考问题。请确保解释既准确又容易理解。",
                description: "深入浅出地解释复杂概念",
                tags: ["概念解释", "教育", "学习"],
                category: "教育",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: "5-2",
            title: "学习规划",
            children: [
              {
                id: "5-2-1",
                title: "学习计划制定",
                prompt: "你是一个学习规划专家。请帮我制定一个详细的学习计划。我需要你考虑：1. 学习目标设定（短期、中期、长期）；2. 当前水平评估；3. 学习资源推荐；4. 时间安排和进度规划；5. 学习方法建议；6. 评估和调整机制；7. 激励和坚持策略。请提供一个可执行的学习计划表。",
                description: "制定个性化的学习计划",
                tags: ["学习计划", "规划", "方法"],
                category: "教育",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      },
      {
        id: "6",
        title: "💼 职场办公",
        children: [
          {
            id: "6-1",
            title: "会议管理",
            children: [
              {
                id: "6-1-1",
                title: "会议纪要生成",
                prompt: "你是一个专业的会议管理专家。请帮我整理这次会议的纪要。我需要你：1. 总结会议的主要议题和讨论内容；2. 记录重要的决定和结论；3. 列出明确的行动项和负责人；4. 标注时间节点和截止日期；5. 识别需要跟进的问题；6. 整理会议资料和参考链接。请确保纪要结构清晰，便于后续跟踪执行。",
                description: "整理会议内容并生成结构化纪要",
                tags: ["会议纪要", "管理", "效率"],
                category: "职场",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: "6-2",
            title: "项目管理",
            children: [
              {
                id: "6-2-1",
                title: "项目计划制定",
                prompt: "你是一个资深的项目管理专家(PMP认证)。请帮我制定一个详细的项目计划。我需要你考虑：1. 项目范围和目标定义；2. 工作分解结构(WBS)；3. 里程碑和关键路径；4. 资源分配和预算；5. 风险识别和应对策略；6. 质量控制标准；7. 沟通计划；8. 进度监控机制。请提供详细的项目计划书。",
                description: "制定专业的项目管理计划",
                tags: ["项目管理", "PMP", "计划"],
                category: "职场",
                usageCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      }
    ]
  }

  // 添加提示词
  async addPrompt(prompt: PromptNode): Promise<void> {
    this.prompts.push(prompt)
    await this.savePrompts()
  }

  // 更新提示词
  async updatePrompt(id: string, updatedPrompt: Partial<PromptNode>): Promise<void> {
    const updateNode = (nodes: PromptNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === id) {
          Object.assign(node, updatedPrompt)
          return true
        }
        if (node.children && updateNode(node.children)) {
          return true
        }
      }
      return false
    }

    if (updateNode(this.prompts)) {
      await this.savePrompts()
    }
  }

  // 删除提示词
  async deletePrompt(id: string): Promise<void> {
    const deleteNode = (nodes: PromptNode[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
          nodes.splice(i, 1)
          return true
        }
        if (nodes[i].children && deleteNode(nodes[i].children)) {
          return true
        }
      }
      return false
    }

    if (deleteNode(this.prompts)) {
      await this.savePrompts()
    }
  }

  // 增加使用次数
  async incrementUsage(id: string): Promise<void> {
    const incrementNode = (nodes: PromptNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === id) {
          node.usageCount = (node.usageCount || 0) + 1
          return true
        }
        if (node.children && incrementNode(node.children)) {
          return true
        }
      }
      return false
    }

    if (incrementNode(this.prompts)) {
      await this.savePrompts()
    }
  }

  // 搜索提示词
  searchPrompts(query: string): PromptNode[] {
    const results: PromptNode[] = []
    const searchQuery = query.toLowerCase()

    const searchNode = (nodes: PromptNode[]): void => {
      for (const node of nodes) {
        const matches = 
          node.title.toLowerCase().includes(searchQuery) ||
          node.prompt?.toLowerCase().includes(searchQuery) ||
          node.description?.toLowerCase().includes(searchQuery) ||
          node.tags?.some(tag => tag.toLowerCase().includes(searchQuery))

        if (matches) {
          results.push(node)
        }

        if (node.children) {
          searchNode(node.children)
        }
      }
    }

    searchNode(this.prompts)
    return results
  }

  // 获取热门提示词
  getPopularPrompts(limit: number = 10): PromptNode[] {
    const allPrompts: PromptNode[] = []

    const collectPrompts = (nodes: PromptNode[]): void => {
      for (const node of nodes) {
        if (node.prompt) {
          allPrompts.push(node)
        }
        if (node.children) {
          collectPrompts(node.children)
        }
      }
    }

    collectPrompts(this.prompts)

    return allPrompts
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit)
  }

  // 导出提示词
  exportPrompts(): string {
    return JSON.stringify(this.prompts, null, 2)
  }

  // 导入提示词
  async importPrompts(promptsJson: string): Promise<void> {
    try {
      const importedPrompts = JSON.parse(promptsJson)
      this.prompts = importedPrompts
      await this.savePrompts()
    } catch (error) {
      console.error('导入提示词失败:', error)
      throw error
    }
  }
}