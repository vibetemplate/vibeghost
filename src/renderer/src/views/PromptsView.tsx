import React, { useEffect, useState } from 'react'
import { List, Collapse, Typography, Spin, Empty, message, Tag } from 'antd'
import { RocketOutlined } from '@ant-design/icons'

const { Panel } = Collapse
const { Text, Paragraph } = Typography

interface Prompt {
  name: string
  prompt: string
  tags?: string[]
}

interface PromptGroup {
  category: string
  prompts: Prompt[]
}

interface Project {
  project: string
  groups: PromptGroup[]
}

const PromptsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true)
        const result = await window.electronAPI.getPrompts()
        if (result && result.projects) {
          setProjects(result.projects)
        }
      } catch (error) {
        message.error('加载提示词失败')
        console.error('Failed to fetch prompts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrompts()
  }, [])

  const handlePromptClick = async (prompt: string) => {
    try {
      message.loading({ content: '正在注入提示词...', key: 'injecting' })
      const result = await window.electronAPI.injectPrompt(prompt)
      if (result.success) {
        message.success({ content: '注入成功！', key: 'injecting', duration: 2 })
      } else {
        message.error({ content: `注入失败: ${result.error}`, key: 'injecting', duration: 3 })
      }
    } catch (error) {
      message.error({ content: `注入时发生错误`, key: 'injecting', duration: 3 })
      console.error('Failed to inject prompt:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin tip="正在加载提示词..." />
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', height: '100%' }}>
        <Empty description="未找到任何提示词项目。请检查 prompts.json 文件。" />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px' }}>
      <Collapse defaultActiveKey={projects.map(p => p.project)} ghost>
        {projects.map((project) => (
          <Panel header={<Text strong>{project.project}</Text>} key={project.project}>
            <Collapse defaultActiveKey={project.groups.map(g => g.category)} ghost>
              {project.groups.map((group) => (
                <Panel header={group.category} key={group.category}>
                  <List
                    itemLayout="vertical"
                    dataSource={group.prompts}
                    renderItem={(prompt) => (
                      <List.Item
                        key={prompt.name}
                        onClick={() => handlePromptClick(prompt.prompt)}
                        style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '4px' }}
                        className="prompt-item"
                      >
                        <List.Item.Meta
                          avatar={<RocketOutlined />}
                          title={<Text>{prompt.name}</Text>}
                          description={
                            <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '更多' }} type="secondary">
                              {prompt.prompt}
                            </Paragraph>
                          }
                        />
                        {prompt.tags && (
                          <div style={{ marginTop: '8px' }}>
                            {prompt.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                          </div>
                        )}
                      </List.Item>
                    )}
                  />
                </Panel>
              ))}
            </Collapse>
          </Panel>
        ))}
      </Collapse>
      <style>{`
        .prompt-item:hover {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  )
}

export default PromptsView 