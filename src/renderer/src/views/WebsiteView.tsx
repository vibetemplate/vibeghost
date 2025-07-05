import React, { useState, useEffect } from 'react'
import { Divider, message, Spin } from 'antd'
import WebsiteSelector from '../components/WebsiteSelector'
import WebsiteList from '../components/WebsiteList'
import { WebsiteCategory, WebsiteInfo } from '../../../shared/types'

const WebsiteView: React.FC = () => {
  const [categories, setCategories] = useState<WebsiteCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedWebsite, setSelectedWebsite] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWebsiteCategories()
  }, [])

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
    setSelectedWebsite('') // 重置选中的网站
  }

  const handleWebsiteChange = async (website: WebsiteInfo) => {
    try {
      setSelectedWebsite(website.id)
      
      // 调用网站切换功能
      if (window.electronAPI && window.electronAPI.switchSite) {
        await window.electronAPI.switchSite(website.url)
        message.success(`已切换到 ${website.name}`)
      } else {
        message.warning('网站切换功能暂不可用')
      }
    } catch (error) {
      console.error('Failed to switch website:', error)
      message.error('切换网站失败')
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
        selectedWebsite={selectedWebsite}
        onWebsiteChange={handleWebsiteChange}
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