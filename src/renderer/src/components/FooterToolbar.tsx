import React from 'react'
import { Button, Tooltip } from 'antd'
import {
  AppstoreOutlined,
  SettingOutlined,
  CloudServerOutlined,
  ClearOutlined,
  HomeOutlined
} from '@ant-design/icons'
import './FooterToolbar.css'

interface FooterToolbarProps {
  activeView: string
  onViewChange: (view: string) => void
  onAction: (action: 'clearCache' | 'proxy') => void
}

const FooterToolbar: React.FC<FooterToolbarProps> = ({ activeView, onViewChange, onAction }) => {
  const topActions = [
    { key: 'clearCache', title: '缓存', icon: <ClearOutlined /> },
    { key: 'proxy', title: '代理', icon: <CloudServerOutlined /> }
  ]

  const bottomViews = [
    { key: 'websites', title: '网站', icon: <HomeOutlined /> },
    { key: 'projects', title: '项目', icon: <AppstoreOutlined /> },
    { key: 'config', title: '配置', icon: <SettingOutlined /> }
  ]

  return (
    <div className="footer-toolbar">
      <div className="toolbar-grid">
        {topActions.map((action) => (
          <Tooltip title={action.title} key={action.key} placement="top">
            <Button
              type="primary"
              ghost
              icon={action.icon}
              onClick={() => onAction(action.key as any)}
            >
              {action.title}
            </Button>
          </Tooltip>
        ))}
        {bottomViews.map((view) => (
          <Tooltip title={view.title} key={view.key} placement="top">
            <Button
              type={activeView === view.key ? 'primary' : 'default'}
              icon={view.icon}
              onClick={() => onViewChange(view.key)}
            >
              {view.title}
            </Button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

export default FooterToolbar 