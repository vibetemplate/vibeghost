import React from 'react'
import { Empty, Tooltip, Badge } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { WebsiteInfo, AITab } from '../../../shared/types'
import './WebsiteList.css'

interface WebsiteListProps {
  websites: WebsiteInfo[]
  openTabs?: AITab[]  // 已打开的标签页
  onWebsiteSelect: (website: WebsiteInfo) => void  // 新建Tab
}

const WebsiteList: React.FC<WebsiteListProps> = ({
  websites,
  openTabs = [],
  onWebsiteSelect
}) => {
  // 获取指定网站已打开的标签页数量
  const getWebsiteTabCount = (websiteId: string): number => {
    return openTabs.filter(tab => tab.websiteId === websiteId).length
  }

  // 检查网站是否已打开
  const isWebsiteOpen = (websiteId: string): boolean => {
    return openTabs.some(tab => tab.websiteId === websiteId)
  }

  const handleWebsiteClick = (website: WebsiteInfo) => {
    onWebsiteSelect(website)
  }

  if (websites.length === 0) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 500, 
          marginBottom: '8px',
          color: '#000000d9'
        }}>
          随书资源v1.0(网站)
        </div>
        <Empty 
          description="该分类下暂无网站" 
          style={{ 
            padding: '20px',
            backgroundColor: '#fafafa',
            borderRadius: '6px'
          }} 
        />
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: 500, 
        marginBottom: '8px',
        color: '#000000d9'
      }}>
        随书资源v1.0(网站)
      </div>
      
      <div className="website-list-container">
        {websites.map(website => {
          const tabCount = getWebsiteTabCount(website.id)
          const isOpened = isWebsiteOpen(website.id)
          
          return (
            <div
              key={website.id}
              className={`website-item ${isOpened ? 'opened' : ''}`}
              onClick={() => handleWebsiteClick(website)}
            >
              <div className="website-main">
                <span className="website-icon">{website.icon}</span>
                <div className="website-info">
                  <div className="website-name">{website.name}</div>
                  <div className="website-url">{website.url}</div>
                </div>
                
                <div className="website-actions">
                  {tabCount > 0 && (
                    <Badge 
                      count={tabCount} 
                      size="small" 
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  )}
                  <Tooltip title="新建标签页">
                    <PlusOutlined className="add-tab-icon" />
                  </Tooltip>
                </div>
              </div>
              
              {website.description && (
                <div className="website-description">{website.description}</div>
              )}
              
              {website.tags && website.tags.length > 0 && (
                <div className="website-tags">
                  {website.tags.map(tag => (
                    <span key={tag} className="website-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WebsiteList