import React from 'react'
import { Select, Empty, Tooltip } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { WebsiteInfo } from '../../../shared/types'
import './WebsiteList.css'

interface WebsiteListProps {
  websites: WebsiteInfo[]
  selectedWebsite?: string
  onWebsiteChange: (website: WebsiteInfo) => void
  loading?: boolean
}

const WebsiteList: React.FC<WebsiteListProps> = ({
  websites,
  selectedWebsite,
  onWebsiteChange,
  loading = false
}) => {
  const handleWebsiteSelect = (websiteId: string) => {
    const website = websites.find(w => w.id === websiteId)
    if (website) {
      onWebsiteChange(website)
    }
  }

  const renderWebsiteOption = (website: WebsiteInfo) => (
    <div className="website-option" key={website.id}>
      <div className="website-info">
        <span className="website-icon">{website.icon}</span>
        <div className="website-details">
          <div className="website-name">{website.name}</div>
          <div className="website-url">{website.url}</div>
        </div>
      </div>
      {website.description && (
        <div className="website-description">{website.description}</div>
      )}
    </div>
  )

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
      <Select
        value={selectedWebsite}
        onChange={handleWebsiteSelect}
        style={{ width: '100%' }}
        placeholder="选择AI网站"
        size="middle"
        loading={loading}
        dropdownStyle={{ maxHeight: '300px' }}
        optionLabelProp="label"
      >
        {websites.map(website => (
          <Select.Option 
            key={website.id} 
            value={website.id}
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{website.icon}</span>
                <span>{website.name}</span>
              </div>
            }
          >
            <div className="website-option-dropdown">
              <div className="website-main">
                <span className="website-icon">{website.icon}</span>
                <div className="website-text">
                  <div className="website-name">{website.name}</div>
                  <div className="website-url">{website.url}</div>
                </div>
                <Tooltip title="打开网站">
                  <LinkOutlined className="website-link-icon" />
                </Tooltip>
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
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}

export default WebsiteList