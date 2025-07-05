import React, { useState, useEffect } from 'react'
import { Button, Input, Tooltip, message } from 'antd'
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  ReloadOutlined, 
  StopOutlined,
  HomeOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { BrowserNavigationState, AITab } from '../../../shared/types'
import './BrowserToolbar.css'

const { Search } = Input

interface BrowserToolbarProps {
  activeTab: AITab | null
  navigationState: BrowserNavigationState | null
  onNavigate: (action: 'back' | 'forward' | 'reload' | 'stop') => void
  onUrlChange: (url: string) => void
  onHome: () => void
  isCompact?: boolean
}

const BrowserToolbar: React.FC<BrowserToolbarProps> = ({
  activeTab,
  navigationState,
  onNavigate,
  onUrlChange,
  onHome,
  isCompact = false
}) => {
  const [urlInput, setUrlInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (activeTab && !isEditing) {
      setUrlInput(activeTab.url)
    }
  }, [activeTab, isEditing])

  const handleBack = () => {
    if (navigationState?.canGoBack) {
      onNavigate('back')
    }
  }

  const handleForward = () => {
    if (navigationState?.canGoForward) {
      onNavigate('forward')
    }
  }

  const handleRefresh = () => {
    if (navigationState?.isLoading) {
      onNavigate('stop')
    } else {
      onNavigate('reload')
    }
  }

  const handleUrlSubmit = (value: string) => {
    if (!value.trim()) {
      message.warning('请输入有效的URL')
      return
    }

    let url = value.trim()
    
    // 添加协议前缀
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // 如果看起来像是搜索查询，使用搜索引擎
      if (!url.includes('.') || url.includes(' ')) {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`
      } else {
        url = `https://${url}`
      }
    }

    onUrlChange(url)
    setIsEditing(false)
  }

  const handleUrlInputFocus = () => {
    setIsEditing(true)
    setUrlInput(activeTab?.url || '')
  }

  const handleUrlInputBlur = () => {
    setIsEditing(false)
    setUrlInput(activeTab?.url || '')
  }

  const isSecureUrl = activeTab?.url.startsWith('https://') || false
  const currentDomain = activeTab?.url ? new URL(activeTab.url).hostname : ''

  const getDisplayUrl = () => {
    if (isEditing) {
      return urlInput
    }
    return activeTab?.url || 'https://'
  }

  const getDisplayTitle = () => {
    if (activeTab?.title && activeTab.title !== activeTab.websiteName) {
      return activeTab.title
    }
    return activeTab?.websiteName || '未知页面'
  }

  if (!activeTab) {
    return (
      <div className={`browser-toolbar ${isCompact ? 'compact' : ''}`}>
        <div className="toolbar-content">
          <div className="navigation-controls">
            <Button icon={<ArrowLeftOutlined />} disabled size="small" />
            <Button icon={<ArrowRightOutlined />} disabled size="small" />
            <Button icon={<ReloadOutlined />} disabled size="small" />
            <Button icon={<HomeOutlined />} onClick={onHome} size="small" />
          </div>
          <div className="url-bar">
            <div className="url-input-wrapper">
              <span className="no-tab-message">请选择一个标签页</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`browser-toolbar ${isCompact ? 'compact' : ''}`}>
      <div className="toolbar-content">
        <div className="navigation-controls">
          <Tooltip title="后退">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              disabled={!navigationState?.canGoBack}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="前进">
            <Button 
              icon={<ArrowRightOutlined />} 
              onClick={handleForward}
              disabled={!navigationState?.canGoForward}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title={navigationState?.isLoading ? "停止加载" : "刷新页面"}>
            <Button 
              icon={navigationState?.isLoading ? <StopOutlined /> : <ReloadOutlined />} 
              onClick={handleRefresh}
              loading={navigationState?.isLoading}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="主页">
            <Button 
              icon={<HomeOutlined />} 
              onClick={onHome}
              size="small"
            />
          </Tooltip>
        </div>

        <div className="url-bar">
          <div className="url-input-wrapper">
            <div className="url-security-indicator">
              <Tooltip title={isSecureUrl ? "安全连接" : "不安全连接"}>
                {isSecureUrl ? (
                  <LockOutlined className="secure-icon" />
                ) : (
                  <UnlockOutlined className="insecure-icon" />
                )}
              </Tooltip>
            </div>
            
            <Search
              value={getDisplayUrl()}
              onChange={(e) => setUrlInput(e.target.value)}
              onSearch={handleUrlSubmit}
              onFocus={handleUrlInputFocus}
              onBlur={handleUrlInputBlur}
              placeholder="输入网址或搜索..."
              size="small"
              className="url-input"
              enterButton={<SearchOutlined />}
              allowClear
            />
          </div>
          
          {!isCompact && (
            <div className="page-info">
              <div className="page-title" title={getDisplayTitle()}>
                <span className="site-icon">{activeTab.websiteIcon}</span>
                <span className="title-text">{getDisplayTitle()}</span>
              </div>
              <div className="page-domain">{currentDomain}</div>
            </div>
          )}
        </div>

        <div className="toolbar-actions">
          <div className="loading-indicator">
            {navigationState?.isLoading && (
              <div className="loading-spinner" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrowserToolbar