import React, { useState, useMemo } from 'react'
import { Tree, Input, Button, Tooltip, Card, Empty } from 'antd'
import { SearchOutlined, FileTextOutlined, FolderOutlined, CopyOutlined } from '@ant-design/icons'
import { PromptNode } from '@shared/types'

const { Search } = Input

interface PromptLibraryProps {
  prompts: PromptNode[]
  onPromptSelect: (prompt: string) => void
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ prompts, onPromptSelect }) => {
  const [searchValue, setSearchValue] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<PromptNode | null>(null)

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
      onPromptSelect(node.prompt)
    }
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
  }

  const renderTitle = (node: any) => {
    const isHighlighted = searchValue && 
      node.title.toLowerCase().includes(searchValue.toLowerCase())

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ 
          color: isHighlighted ? '#1890ff' : undefined,
          fontWeight: isHighlighted ? 'bold' : 'normal'
        }}>
          {node.title}
        </span>
        {node.isLeaf && node.prompt && (
          <Tooltip title="复制提示词">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleCopyPrompt(node.prompt)
              }}
            />
          </Tooltip>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <Search
          placeholder="搜索提示词..."
          allowClear
          enterButton={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredTreeData.length > 0 ? (
          <Tree
            treeData={filteredTreeData}
            onSelect={handleSelect}
            showIcon
            defaultExpandAll={!!searchValue}
            titleRender={renderTitle}
          />
        ) : (
          <Empty 
            description="未找到匹配的提示词"
            style={{ marginTop: '50px' }}
          />
        )}
      </div>

      {selectedPrompt && (
        <Card
          size="small"
          style={{ 
            marginTop: '16px',
            maxHeight: '200px',
            overflow: 'auto'
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>预览</span>
              <Button
                type="primary"
                size="small"
                onClick={() => onPromptSelect(selectedPrompt.prompt!)}
              >
                使用
              </Button>
            </div>
          }
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            {selectedPrompt.description}
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            {selectedPrompt.prompt}
          </div>
          {selectedPrompt.tags && (
            <div style={{ marginTop: '8px' }}>
              {selectedPrompt.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    background: '#f0f0f0',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    marginRight: '4px'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default PromptLibrary