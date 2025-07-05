import React, { useState, useEffect, useRef } from 'react'
import { Button, Tooltip, message } from 'antd'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { AITab, WebsiteInfo } from '../../../shared/types'
import './TabManager.css'

interface TabManagerProps {
  tabs: AITab[]
  activeTabId: string | null
  onTabClose: (tabId: string) => void
  onTabSwitch: (tabId: string) => void
  maxTabs?: number
}

const TabManager: React.FC<TabManagerProps> = ({
  tabs,
  activeTabId,
  onTabClose,
  onTabSwitch,
  maxTabs = 8
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        // Cmd/Ctrl + 1-9: 切换到指定标签页
        if (event.key >= '1' && event.key <= '9') {
          event.preventDefault()
          const index = parseInt(event.key) - 1
          if (tabs[index]) {
            onTabSwitch(tabs[index].id)
          }
        }
        // Cmd/Ctrl + W: 关闭当前标签页
        else if (event.key === 'w') {
          event.preventDefault()
          if (activeTabId) {
            handleCloseTab(activeTabId)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, onTabSwitch])

  const handleCloseTab = (tabId: string) => {
    if (tabs.length === 1) {
      message.warning('至少需要保留一个标签页')
      return
    }
    onTabClose(tabId)
  }

  const handleTabClick = (tabId: string) => {
    onTabSwitch(tabId)
  }

  const handleNewTab = () => {
    if (tabs.length >= maxTabs) {
      message.warning(`最多只能打开${maxTabs}个标签页`)
      return
    }
    // 这里可以打开一个默认网站，或者显示网站选择器
    message.info('请在右侧网站列表中选择要打开的网站')
  }

  const formatTabTitle = (tab: AITab): string => {
    if (tab.title && tab.title !== tab.websiteName) {
      return `${tab.websiteIcon} ${tab.title}`
    }
    return `${tab.websiteIcon} ${tab.websiteName}`
  }

  const getTabTooltip = (tab: AITab): string => {
    const parts = [
      `网站: ${tab.websiteName}`,
      `地址: ${tab.url}`,
      `创建时间: ${tab.createdAt.toLocaleTimeString()}`
    ]
    if (tab.lastActivatedAt) {
      parts.push(`最后访问: ${tab.lastActivatedAt.toLocaleTimeString()}`)
    }
    return parts.join('\n')
  }

  const renderTab = (tab: AITab) => {
    const isActive = tab.id === activeTabId
    
    return (
      <div
        key={tab.id}
        className={`tab-item ${isActive ? 'active' : ''} ${tab.isLoading ? 'loading' : ''}`}
        onClick={() => handleTabClick(tab.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          // 可以在这里添加右键菜单
        }}
      >
        <Tooltip title={getTabTooltip(tab)} placement="bottom">
          <div className="tab-content">
            <span className="tab-icon">{tab.websiteIcon}</span>
            <span className="tab-title">{tab.websiteName}</span>
            {tab.isLoading && (
              <span className="tab-loading-indicator">
                <div className="loading-spinner" />
              </span>
            )}
          </div>
        </Tooltip>
        
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          className="tab-close-button"
          onClick={(e) => {
            e.stopPropagation()
            handleCloseTab(tab.id)
          }}
          style={{ 
            opacity: isActive || tabs.length === 1 ? 1 : 0.5,
            visibility: tabs.length === 1 ? 'hidden' : 'visible'
          }}
        />
      </div>
    )
  }

  if (tabs.length === 0) {
    return (
      <div className="tab-manager empty">
        <div className="empty-state">
          <span>暂无标签页</span>
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={handleNewTab}
            size="small"
          >
            新建标签页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="tab-manager">
      <div className="tabs-container" ref={tabsContainerRef}>
        <div className="tabs-list">
          {tabs.map((tab) => renderTab(tab))}
        </div>
        
        <div className="tab-controls">
          <Tooltip title={`新建标签页 (${tabs.length}/${maxTabs})`}>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleNewTab}
              disabled={tabs.length >= maxTabs}
              className="new-tab-button"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default TabManager