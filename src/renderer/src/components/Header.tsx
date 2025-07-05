import React from 'react'
import { Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface HeaderProps {
  onRefresh?: () => void
}

const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
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
            AI 多标签浏览器
          </span>
          <Button 
            type="text" 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            style={{ fontSize: '12px' }}
            title="刷新侧边栏"
          />
        </div>
        
        <div style={{
          fontSize: '12px',
          color: '#666',
          textAlign: 'center',
          padding: '4px 0'
        }}>
          点击下方网站列表创建新标签页
        </div>
      </Space>
    </div>
  )
}

export default Header