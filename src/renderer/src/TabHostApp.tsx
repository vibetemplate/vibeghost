import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import TabManager from './components/TabManager'
import BrowserToolbar from './components/BrowserToolbar'
import { AITab, WebsiteInfo, BrowserNavigationState } from '../../shared/types'
import './TabHostApp.css'

const TabHostApp: React.FC = () => {
  const [tabs, setTabs] = useState<AITab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [navigationState, setNavigationState] = useState<BrowserNavigationState | null>(null)

  useEffect(() => {
    loadExistingTabs()
    setupEventListeners()
    
    // 清理函数，移除事件监听器
    return () => {
      if (window.electronAPI) {
        window.electronAPI.off('tab-created', handleTabCreated)
        window.electronAPI.off('tab-closed', handleTabClosed)
        window.electronAPI.off('tab-updated', handleTabUpdated)
        window.electronAPI.off('navigation-state-changed', handleNavigationStateChanged)
      }
    }
  }, [])

  const loadExistingTabs = async () => {
    try {
      const result = await window.electronAPI.getTabs()
      if (result?.tabs) {
        setTabs(result.tabs)
        setActiveTabId(result.activeTabId)
      }
    } catch (error) {
      console.error('Failed to load existing tabs:', error)
    }
  }

  const handleTabCreated = (tab: AITab) => {
    setTabs(prev => {
      // 避免重复添加
      if (prev.find(t => t.id === tab.id)) {
        return prev
      }
      const newTabs = [...prev, tab]
      if (tab.isActive) {
        setActiveTabId(tab.id)
      }
      return newTabs
    })
  }

  const handleTabClosed = (data: { tabId: string }) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== data.tabId)
      // 如果关闭的是当前活跃标签，需要切换到其他标签
      if (activeTabId === data.tabId && newTabs.length > 0) {
        const nextActiveTab = newTabs.find(tab => tab.isActive) || newTabs[0]
        setActiveTabId(nextActiveTab.id)
      } else if (newTabs.length === 0) {
        setActiveTabId(null)
      }
      return newTabs
    })
  }

  const handleTabUpdated = (data: { tabId: string, updates: Partial<AITab> }) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === data.tabId) {
        const updatedTab = { ...tab, ...data.updates }
        if (updatedTab.isActive && activeTabId !== data.tabId) {
          setActiveTabId(data.tabId)
        }
        return updatedTab
      }
      return tab
    }))
  }

  const handleNavigationStateChanged = (data: { 
    tabId: string, 
    state: BrowserNavigationState 
  }) => {
    if (data.tabId === activeTabId) {
      setNavigationState(data.state)
    }
  }

  const setupEventListeners = () => {
    if (window.electronAPI) {
      // 监听标签页创建事件
      window.electronAPI.on('tab-created', handleTabCreated)

      // 监听标签页关闭事件
      window.electronAPI.on('tab-closed', handleTabClosed)

      // 监听标签页更新事件
      window.electronAPI.on('tab-updated', handleTabUpdated)

      // 监听导航状态变化
      window.electronAPI.on('navigation-state-changed', handleNavigationStateChanged)
    }
  }

  const handleTabClose = async (tabId: string) => {
    try {
      const result = await window.electronAPI.closeTab(tabId)
      if (!result?.success) {
        message.error(result?.error || '关闭标签页失败')
      }
    } catch (error) {
      console.error('Failed to close tab:', error)
      message.error('关闭标签页失败')
    }
  }

  const handleTabSwitch = async (tabId: string) => {
    try {
      const result = await window.electronAPI.switchTab(tabId)
      if (!result?.success) {
        message.error(result?.error || '切换标签页失败')
      }
    } catch (error) {
      console.error('Failed to switch tab:', error)
      message.error('切换标签页失败')
    }
  }

  const handleNavigate = async (action: 'back' | 'forward' | 'reload' | 'stop') => {
    if (!activeTabId) return

    try {
      const result = await window.electronAPI.navigateTab(activeTabId, action)
      if (!result?.success) {
        message.error(result?.error || '导航操作失败')
      }
    } catch (error) {
      console.error('Failed to navigate:', error)
      message.error('导航操作失败')
    }
  }

  const handleUrlChange = async (url: string) => {
    if (!activeTabId) return

    try {
      const result = await window.electronAPI.navigateTab(activeTabId, 'navigate', url)
      if (!result?.success) {
        message.error(result?.error || '跳转失败')
      }
    } catch (error) {
      console.error('Failed to navigate to URL:', error)
      message.error('跳转失败')
    }
  }

  const handleHome = () => {
    message.info('请在右侧网站列表中选择网站')
  }

  const getActiveTab = (): AITab | null => {
    return tabs.find(tab => tab.id === activeTabId) || null
  }

  return (
    <div className="tab-host-app" style={{ 
      display: 'flex !important',
      visibility: 'visible !important',
      opacity: 1,
      zIndex: 9999,
      backgroundColor: '#ffffff !important',
      position: 'fixed !important',
      top: 0,
      left: 0,
      right: '350px',
      height: 'auto'
    }}>
      <TabManager
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClose={handleTabClose}
        onTabSwitch={handleTabSwitch}
        maxTabs={8}
      />
      
      <BrowserToolbar
        activeTab={getActiveTab()}
        navigationState={navigationState}
        onNavigate={handleNavigate}
        onUrlChange={handleUrlChange}
        onHome={handleHome}
        isCompact={false}
      />
      
      {/* 始终显示调试信息确保组件渲染 */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        background: 'rgba(255, 0, 0, 0.9)',
        color: 'white',
        padding: '4px 12px',
        fontSize: '12px',
        zIndex: 999999,
        border: '2px solid red',
        fontWeight: 'bold'
      }}>
        🚀 TabHost Active: {tabs.length} tabs, Current: {activeTabId?.slice(0, 8) || 'none'}
      </div>
    </div>
  )
}

export default TabHostApp