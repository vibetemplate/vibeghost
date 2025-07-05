import React, { useState, useEffect, useMemo } from 'react'
import { Tree, Input, Button, Empty, Spin } from 'antd'
import { SearchOutlined, FileTextOutlined, FolderOutlined, CopyOutlined } from '@ant-design/icons'
import { PromptNode } from '@shared/types'
import Header from './components/Header'

const { Search } = Input

const SidebarApp: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptNode[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<PromptNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('SidebarApp 组件加载')
    console.log('window.electronAPI 是否存在:', !!window.electronAPI)
    
    // 添加延迟确保electronAPI已经注入
    const initTimeout = setTimeout(() => {
      if (window.electronAPI) {
        console.log('electronAPI 方法:', Object.keys(window.electronAPI))
        loadPrompts()
      } else {
        console.error('electronAPI 未找到')
        setError('electronAPI 未找到，请重新启动应用')
        setLoading(false)
      }
    }, 100)
    
    // 10秒后如果还在加载，显示错误
    const timeoutError = setTimeout(() => {
      if (loading) {
        setError('加载超时，请重新启动应用')
        setLoading(false)
      }
    }, 10000)
    
    return () => {
      clearTimeout(initTimeout)
      clearTimeout(timeoutError)
    }
  }, [])

  const loadPrompts = async () => {
    try {
      console.log('开始加载提示词...')
      const promptsData = await window.electronAPI.getPrompts()
      console.log('提示词数据:', promptsData)
      if (promptsData && Array.isArray(promptsData)) {
        setPrompts(promptsData)
        console.log('提示词加载成功，数量:', promptsData.length)
      } else {
        console.error('提示词数据格式错误:', promptsData)
        setPrompts([])
      }
      setLoading(false)
    } catch (error) {
      console.error('加载提示词失败:', error)
      setError('加载提示词失败: ' + error.message)
      setPrompts([])
      setLoading(false)
    }
  }

  // 将提示词数据转换为Tree组件所需的格式
  const treeData = useMemo(() => {
    const convertToTreeData = (nodes: PromptNode[]): any[] => {
      return nodes.map(node => ({
        title: node.title,
        key: node.id,
        icon: node.children ? <FolderOutlined /> : <FileTextOutlined />,
        children: node.children ? convertToTreeData(node.children) : undefined,
        isLeaf: !node.children || node.children.length === 0,
        prompt: node.prompt,
        description: node.description,
        tags: node.tags,
        usageCount: node.usageCount || 0
      }))
    }
    
    return convertToTreeData(prompts)
  }, [prompts])

  // 搜索过滤
  const filteredTreeData = useMemo(() => {
    if (!searchValue) return treeData

    const filterTree = (nodes: any[]): any[] => {
      return nodes.reduce((acc, node) => {
        const matchesSearch = node.title.toLowerCase().includes(searchValue.toLowerCase()) ||
                             node.prompt?.toLowerCase().includes(searchValue.toLowerCase()) ||
                             node.description?.toLowerCase().includes(searchValue.toLowerCase())

        if (node.children) {
          const filteredChildren = filterTree(node.children)
          if (filteredChildren.length > 0 || matchesSearch) {
            acc.push({
              ...node,
              children: filteredChildren
            })
          }
        } else if (matchesSearch) {
          acc.push(node)
        }

        return acc
      }, [])
    }

    return filterTree(treeData)
  }, [treeData, searchValue])

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    const node = info.node
    if (node.isLeaf && node.prompt) {
      setSelectedPrompt(node)
      handlePromptSelect(node.prompt)
    }
  }

  const handlePromptSelect = async (prompt: string) => {
    try {
      const result = await window.electronAPI.injectPrompt(prompt)
      if (!result.success) {
        console.error('注入提示词失败:', result.error)
      }
    } catch (error) {
      console.error('注入提示词时发生错误:', error)
    }
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
  }

  const handleSiteChange = async (url: string) => {
    try {
      await window.electronAPI.switchSite(url)
    } catch (error) {
      console.error('切换网站失败:', error)
    }
  }

  const handleRefresh = () => {
    // 可以添加刷新功能
    window.location.reload()
  }

  const renderTitle = (node: any) => {
    const isHighlighted = searchValue && 
      node.title.toLowerCase().includes(searchValue.toLowerCase())

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <span style={{ 
          color: isHighlighted ? '#1890ff' : undefined,
          fontWeight: isHighlighted ? 'bold' : 'normal',
          fontSize: '13px'
        }}>
          {node.title}
        </span>
        {node.isLeaf && node.prompt && (
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleCopyPrompt(node.prompt)
            }}
            style={{ 
              opacity: 0.6,
              fontSize: '12px',
              padding: '0 4px',
              height: '20px',
              minWidth: '20px'
            }}
          />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="sidebar-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          gap: '16px',
          padding: '20px'
        }}>
          <Spin size="large" />
          <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
            正在加载提示词库...
          </div>
          {error && (
            <div style={{ fontSize: '12px', color: '#ff4d4f', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              type="primary" 
              size="small" 
              onClick={loadPrompts}
              style={{ fontSize: '12px' }}
            >
              重新加载
            </Button>
            <Button 
              size="small" 
              onClick={() => window.location.reload()}
              style={{ fontSize: '12px' }}
            >
              刷新页面
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="sidebar-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          gap: '16px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '16px', color: '#ff4d4f', textAlign: 'center' }}>
            ⚠️ 加载失败
          </div>
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
            {error}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              type="primary" 
              size="small" 
              onClick={() => {
                setError('')
                setLoading(true)
                loadPrompts()
              }}
              style={{ fontSize: '12px' }}
            >
              重试
            </Button>
            <Button 
              size="small" 
              onClick={() => window.location.reload()}
              style={{ fontSize: '12px' }}
            >
              刷新页面
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar-container">
      {/* 网站切换头部 */}
      <Header onSiteChange={handleSiteChange} onRefresh={handleRefresh} />
      
      {/* 标题栏 */}
      <div className="sidebar-header">
        <div className="sidebar-title">提示词库</div>
        <Search
          placeholder="搜索提示词..."
          allowClear
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ fontSize: '12px' }}
        />
      </div>

      {/* 提示词树 */}
      <div className="sidebar-prompts">
        {!window.electronAPI ? (
          <div className="empty-state">
            <Empty 
              description="electronAPI 未找到，请重新启动应用"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : filteredTreeData.length > 0 ? (
          <Tree
            treeData={filteredTreeData}
            onSelect={handleSelect}
            showIcon
            defaultExpandAll={!!searchValue}
            titleRender={renderTitle}
            blockNode
          />
        ) : (
          <div className="empty-state">
            <Empty 
              description={prompts.length === 0 ? "提示词加载失败，请点击重新加载" : "未找到匹配的提示词"}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {prompts.length === 0 && (
                <Button type="primary" size="small" onClick={loadPrompts}>
                  重新加载
                </Button>
              )}
            </Empty>
          </div>
        )}
      </div>

      {/* 预览区域 */}
      {selectedPrompt && (
        <div className="sidebar-preview">
          <div className="preview-card">
            <div className="preview-title">
              <span>{selectedPrompt.title}</span>
              <Button
                type="primary"
                size="small"
                onClick={() => handlePromptSelect(selectedPrompt.prompt!)}
                style={{ fontSize: '12px', height: '24px' }}
              >
                使用
              </Button>
            </div>
            
            {selectedPrompt.description && (
              <div className="preview-description">
                {selectedPrompt.description}
              </div>
            )}
            
            <div className="preview-content">
              {selectedPrompt.prompt}
            </div>
            
            {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
              <div className="preview-tags">
                {selectedPrompt.tags.map(tag => (
                  <span key={tag} className="preview-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SidebarApp