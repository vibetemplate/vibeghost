import React, { useState } from 'react'
import { Select, Button, Space } from 'antd'
import { GlobalOutlined, ReloadOutlined } from '@ant-design/icons'

const { Option } = Select

interface HeaderProps {
  onSiteChange?: (url: string) => void
  onRefresh?: () => void
}

const Header: React.FC<HeaderProps> = ({ onSiteChange, onRefresh }) => {
  const [selectedSite, setSelectedSite] = useState('deepseek')

  const aiSites = [
    { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com' },
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai' },
    { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
    { id: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn' },
    { id: 'tongyi', name: '通义千问', url: 'https://tongyi.aliyun.com' }
  ]

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId)
    const site = aiSites.find(s => s.id === siteId)
    if (site && onSiteChange) {
      onSiteChange(site.url)
    }
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  return (
    <div style={{ 
      padding: '8px 12px', 
      borderBottom: '1px solid #e8e8e8',
      background: '#fafafa'
    }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#262626' 
          }}>
            AI 网站切换
          </span>
          <Button 
            type="text" 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            style={{ fontSize: '12px' }}
          />
        </div>
        
        <Select
          value={selectedSite}
          onChange={handleSiteChange}
          style={{ width: '100%' }}
          size="small"
          suffixIcon={<GlobalOutlined />}
        >
          {aiSites.map(site => (
            <Option key={site.id} value={site.id}>
              {site.name}
            </Option>
          ))}
        </Select>
      </Space>
    </div>
  )
}

export default Header