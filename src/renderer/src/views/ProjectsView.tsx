import React, { useState, useEffect, useMemo } from 'react'
import { Tree, Input, Button, Empty, Spin, Select, Divider, message } from 'antd'
import { FileTextOutlined, FolderOutlined, ImportOutlined, CopyOutlined } from '@ant-design/icons'

const { Search } = Input

// 定义新的数据结构类型
interface Chapter {
  id: string
  category: string
  name: string
  prompt: string
}

interface Project {
  id: string
  name: string
  chapters: Chapter[]
}

const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [loadState, setLoadState] = useState({
    status: 'loading',
    message: ''
  })

  useEffect(() => {
    const loadAndSetPrompts = async () => {
      setLoadState({ status: 'loading', message: '' })
      try {
        if (!window.electronAPI) {
          throw new Error('electronAPI not found. Please restart the application.')
        }

        console.log('Fetching projects...')
        const data: { projects: Project[] } = await window.electronAPI.getPrompts()
        console.log('Projects data received:', data)

        if (data?.projects && Array.isArray(data.projects)) {
          setProjects(data.projects)
          if (data.projects.length > 0) {
            setCurrentProjectId(data.projects[0].id)
          } else {
            setCurrentProjectId(null)
          }
          setLoadState({ status: 'success', message: '' })
        } else {
          throw new Error('Prompt data is empty or in an invalid format.')
        }
      } catch (error: any) {
        console.error('Failed to load prompts:', error)
        setLoadState({ status: 'error', message: `Load failed: ${error.message}` })
        setProjects([])
      }
    }
    loadAndSetPrompts()
  }, [])

  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === currentProjectId)
  }, [projects, currentProjectId])

  const categories = useMemo(() => {
    if (!currentProject) return []
    const uniqueCategories = [...new Set(currentProject.chapters.map((c) => c.category))]
    return ['所有分类', ...uniqueCategories]
  }, [currentProject])

  useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategory(categories[0])
    }
  }, [categories])

  const treeData = useMemo(() => {
    if (!currentProject) return []

    const chaptersToDisplay =
      selectedCategory && selectedCategory !== '所有分类'
        ? currentProject.chapters.filter((c) => c.category === selectedCategory)
        : currentProject.chapters

    const groupedByCategory = chaptersToDisplay.reduce(
      (acc, chapter) => {
        const { category } = chapter
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(chapter)
        return acc
      },
      {} as Record<string, Chapter[]>
    )

    return Object.entries(groupedByCategory).map(([category, chapters]) => ({
      title: category,
      key: category,
      icon: <FolderOutlined />,
      isLeaf: false,
      children: chapters.map((chapter) => ({
        title: chapter.name,
        key: chapter.id,
        icon: <FileTextOutlined />,
        isLeaf: true,
        prompt: chapter.prompt
      }))
    }))
  }, [currentProject, selectedCategory])

  const filteredTreeData = useMemo(() => {
    if (!searchValue) return treeData
    const lowercasedValue = searchValue.toLowerCase()

    return treeData
      .map((categoryNode) => {
        if (categoryNode.title.toLowerCase().includes(lowercasedValue)) {
          return categoryNode
        }

        const filteredChildren = categoryNode.children.filter((chapterNode) =>
          chapterNode.title.toLowerCase().includes(lowercasedValue)
        )

        if (filteredChildren.length > 0) {
          return { ...categoryNode, children: filteredChildren }
        }

        return null
      })
      .filter((node): node is NonNullable<typeof node> => node !== null)
  }, [treeData, searchValue])

  const handlePromptSelect = async (prompt: string) => {
    try {
      const result = await window.electronAPI.injectPrompt(prompt)
      if (result?.success) {
        message.success('提示词已注入')
      } else {
        message.error(result?.error || '未找到输入框，提示词注入失败')
      }
    } catch (error) {
      console.error('Error injecting prompt:', error)
      message.error('提示词注入失败，无法与主进程通信')
    }
  }

  const handleSelect = (_: React.Key[], info: any) => {
    if (info.node.isLeaf && info.node.prompt) {
      setSelectedPrompt(info.node.prompt)
    } else {
      setSelectedPrompt(null)
    }
  }

  const renderTitle = (node: any) => (
    <div className="tree-node-title">
      <span>{node.title}</span>
      {node.isLeaf && node.prompt && (
        <Button
          type="text"
          size="small"
          icon={<ImportOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handlePromptSelect(node.prompt)
          }}
          style={{ opacity: 0.7 }}
        />
      )}
    </div>
  )

  if (loadState.status === 'loading') {
    return (
      <div className="sidebar-container loading-container">
        <Spin />
        <span>正在加载...</span>
      </div>
    )
  }

  if (loadState.status === 'error') {
    return (
      <div className="sidebar-container error-container">
        <div>加载失败: {loadState.message}</div>
        <Button onClick={() => window.location.reload()} size="small">
          重试
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="sidebar-header">
        <Select
          value={currentProjectId}
          style={{ width: '100%', marginBottom: 8 }}
          onChange={(value) => setCurrentProjectId(value)}
          size="small"
          placeholder="请选择项目"
        >
          {projects.map((p) => (
            <Select.Option key={p.id} value={p.id}>
              {p.name}
            </Select.Option>
          ))}
        </Select>
        <Select
          value={selectedCategory}
          style={{ width: '100%' }}
          onChange={(value) => setSelectedCategory(value)}
          size="small"
          disabled={!currentProject}
          placeholder="请选择分类"
        >
          {categories.map((c) => (
            <Select.Option key={c} value={c}>
              {c}
            </Select.Option>
          ))}
        </Select>
        <Divider style={{ margin: '8px 0' }} />
        <Search
          placeholder="搜索提示词..."
          allowClear
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="sidebar-content">
        {filteredTreeData.length > 0 ? (
          <>
            <Tree
              treeData={filteredTreeData}
              onSelect={handleSelect}
              showIcon
              defaultExpandAll
              titleRender={renderTitle}
            />
            {selectedPrompt && (
              <div className="prompt-detail-card">
                <div className="prompt-detail-header">
                  <span>提示词内容</span>
                  <div className="prompt-detail-actions">
                    <Button
                      size="small"
                      icon={<ImportOutlined />}
                      onClick={() => handlePromptSelect(selectedPrompt)}
                    />
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => navigator.clipboard.writeText(selectedPrompt)}
                    />
                  </div>
                </div>
                <Divider style={{ margin: '6px 0' }} />
                <div className="prompt-detail-body">{selectedPrompt}</div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Empty
              description={!currentProject ? '请先选择一个项目' : '未找到匹配的提示词'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default ProjectsView 