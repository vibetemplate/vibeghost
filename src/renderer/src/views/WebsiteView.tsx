import React, { useState, useEffect } from 'react'
import { Divider, message, Spin } from 'antd'
import WebsiteSelector from '../components/WebsiteSelector'
import WebsiteList from '../components/WebsiteList'
import { WebsiteCategory, WebsiteInfo, AITab } from '../../../shared/types'

const WebsiteView: React.FC = () => {
  const [categories, setCategories] = useState<WebsiteCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [openTabs, setOpenTabs] = useState<AITab[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWebsiteCategories()
    loadExistingTabs()
    setupTabEventListeners()
    
    // 清理函数，移除事件监听器
    return () => {
      if (window.electronAPI) {
        window.electronAPI.off('tab-created', handleTabCreated)
        window.electronAPI.off('tab-closed', handleTabClosed)
        window.electronAPI.off('tab-updated', handleTabUpdated)
      }
    }
  }, [])

  const loadExistingTabs = async () => {
    try {
      const result = await window.electronAPI.getTabs()
      if (result?.tabs) {
        setOpenTabs(result.tabs)
      }
    } catch (error) {
      console.error('Failed to load existing tabs:', error)
    }
  }

  const handleTabCreated = (tab: AITab) => {
    setOpenTabs(prev => {
      // 避免重复添加
      if (prev.find(t => t.id === tab.id)) {
        return prev
      }
      return [...prev, tab]
    })
  }

  const handleTabClosed = (data: { tabId: string }) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== data.tabId))
  }

  const handleTabUpdated = (data: { tabId: string, updates: Partial<AITab> }) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.id === data.tabId ? { ...tab, ...data.updates } : tab
    ))
  }

  const setupTabEventListeners = () => {
    if (window.electronAPI) {
      // 监听标签页创建事件
      window.electronAPI.on('tab-created', handleTabCreated)

      // 监听标签页关闭事件
      window.electronAPI.on('tab-closed', handleTabClosed)

      // 监听标签页更新事件
      window.electronAPI.on('tab-updated', handleTabUpdated)
    }
  }

  const loadWebsiteCategories = async () => {
    try {
      setLoading(true)
      
      // 模拟从配置文件加载数据
      // 在实际实现中，这里应该调用 electronAPI 来读取配置文件
      const websiteData = await import('../../../../resources/websites.json')
      const categoriesData = websiteData.categories as WebsiteCategory[]
      
      setCategories(categoriesData)
      
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to load website categories:', error)
      message.error('加载网站分类失败')
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleWebsiteSelect = async (website: WebsiteInfo) => {
    try {
      // 创建新标签页
      const result = await window.electronAPI.createTab(website)
      if (result?.success) {
        message.success(`已为 ${website.name} 创建新标签页`)
      } else {
        message.error(result?.error || '创建标签页失败')
      }
    } catch (error) {
      console.error('Failed to create tab:', error)
      message.error('创建标签页失败')
    }
  }

  const getCurrentCategoryWebsites = (): WebsiteInfo[] => {
    const category = categories.find(cat => cat.id === selectedCategory)
    return category ? category.websites.filter(w => w.isActive) : []
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <Spin tip="加载网站资源..." />
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        fontSize: '16px', 
        fontWeight: 'bold', 
        marginBottom: '16px',
        color: '#000000d9'
      }}>
        功能区
      </div>
      
      <WebsiteSelector
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        loading={loading}
      />
      
      <WebsiteList
        websites={getCurrentCategoryWebsites()}
        openTabs={openTabs}
        onWebsiteSelect={handleWebsiteSelect}
        loading={loading}
      />
      
      <Divider style={{ margin: '16px 0' }} />
      
      <div style={{ 
        fontSize: '12px', 
        color: '#00000073',
        textAlign: 'center'
      }}>
        共 {getCurrentCategoryWebsites().length} 个可用网站
      </div>
    </div>
  )
}

export default WebsiteView