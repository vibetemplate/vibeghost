import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import TabManager from './components/TabManager'
import BrowserToolbar from './components/BrowserToolbar'
import { AITab, WebsiteInfo, BrowserNavigationState } from '../../shared/types'
import './MainApp.css'

const MainApp: React.FC = () => {
  const [tabs, setTabs] = useState<AITab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [navigationState, setNavigationState] = useState<BrowserNavigationState | null>(null)

  useEffect(() => {
    loadExistingTabs()
    setupEventListeners()
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

  const setupEventListeners = () => {
    if (window.electronAPI) {
      // 监听标签页创建事件
      window.electronAPI.on('tab-created', (tab: AITab) => {
        setTabs(prev => [...prev, tab])
        if (tab.isActive) {
          setActiveTabId(tab.id)
        }
      })

      // 监听标签页关闭事件
      window.electronAPI.on('tab-closed', (data: { tabId: string }) => {
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
      })

      // 监听标签页更新事件
      window.electronAPI.on('tab-updated', (data: { tabId: string, updates: Partial<AITab> }) => {
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
      })

      // 监听导航状态变化
      window.electronAPI.on('navigation-state-changed', (data: { 
        tabId: string, 
        state: BrowserNavigationState 
      }) => {
        if (data.tabId === activeTabId) {
          setNavigationState(data.state)
        }
      })
    }
  }

  const handleTabCreate = async (website: WebsiteInfo) => {
    try {
      const result = await window.electronAPI.createTab(website)
      if (!result?.success) {
        message.error(result?.error || '创建标签页失败')
      }
    } catch (error) {
      console.error('Failed to create tab:', error)
      message.error('创建标签页失败')
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
      // 通过导航到新URL来更新当前标签页
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
    // 可以设置默认主页，或者显示欢迎页面
    message.info('主页功能暂未实现')
  }

  const getActiveTab = (): AITab | null => {
    return tabs.find(tab => tab.id === activeTabId) || null
  }

  return (
    <div className="main-app">
      <div className="tab-area">
        <TabManager
          tabs={tabs}
          activeTabId={activeTabId}
          onTabCreate={handleTabCreate}
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
      </div>

      {tabs.length === 0 && (
        <div className="welcome-screen">
          <div className="welcome-content">
            <h2>欢迎使用 VibeGhost</h2>
            <p>请在右侧网站列表中选择一个网站开始浏览</p>
            <div className="welcome-instructions">
              <div className="instruction-item">
                <span className="instruction-number">1</span>
                <span>在右侧选择网站分类</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">2</span>
                <span>点击网站名称创建新标签页</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">3</span>
                <span>使用多标签页比较不同AI模型</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainApp