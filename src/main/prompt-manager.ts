import { app } from 'electron'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export class PromptManager {
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
      console.log('使用项目提示词文件:', this.promptsPath)
    } else {
      this.promptsPath = userPrompts
      console.log('使用用户提示词文件:', this.promptsPath)
    }
  }

  async getPrompts(): Promise<any> {
    try {
      console.log('尝试加载提示词文件:', this.promptsPath)
      if (existsSync(this.promptsPath)) {
        console.log('提示词文件存在，开始读取')
        const promptsData = readFileSync(this.promptsPath, 'utf-8')
        const jsonData = JSON.parse(promptsData)
        console.log('提示词加载成功.')
        return jsonData
      } else {
        console.error('提示词文件不存在:', this.promptsPath)
        // 如果文件不存在，返回空的项目数组结构
        return { projects: [] }
      }
    } catch (error) {
      console.error('加载提示词失败:', error)
      // 出错时也返回后备的空结构
      return { projects: [] }
    }
  }
}