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
    
    // 定期同步状态，确保前后端一致（但不要太频繁）
    const syncInterval = setInterval(() => {
      // 只在没有用户交互时同步，避免干扰用户操作
      if (document.hasFocus()) {
        loadExistingTabs()
      }
    }, 5000) // 每5秒同步一次
    
    // 清理函数，移除事件监听器和定时器
    return () => {
      clearInterval(syncInterval)
      if (window.electronAPI) {
        window.electronAPI.off('tab-created', handleTabCreated)
        window.electronAPI.off('tab-closed', handleTabClosed)
        window.electronAPI.off('tab-updated', handleTabUpdated)
        window.electronAPI.off('navigation-state-changed', handleNavigationStateChanged)
      }
    }
  }, [])

  // 监听activeTabId变化，确保状态一致性
  useEffect(() => {
    console.log(`🎯 activeTabId变化: ${activeTabId}`)
    console.log(`📊 当前tabs数量: ${tabs.length}`)
    
    // 如果有activeTabId但找不到对应的tab，重新同步
    if (activeTabId && !tabs.find(tab => tab.id === activeTabId)) {
      console.warn('⚠️  activeTabId对应的tab不存在，重新同步状态')
      setTimeout(() => loadExistingTabs(), 100)
    }
    
    // 如果activeTabId为空但有活跃的tab，更新activeTabId
    if (!activeTabId && tabs.length > 0) {
      const activeTab = tabs.find(tab => tab.isActive)
      if (activeTab) {
        console.log(`🔄 发现未设置的活跃标签页，更新: ${activeTab.id}`)
        setActiveTabId(activeTab.id)
      }
    }
  }, [activeTabId, tabs])

  const loadExistingTabs = async () => {
    try {
      console.log('🔄 前端加载现有标签页...')
      const result = await window.electronAPI.getTabs()
      console.log('📥 前端收到标签页数据:', result)
      
      if (result?.tabs && Array.isArray(result.tabs)) {
        // 强制状态更新，确保React重新渲染
        setTabs([...result.tabs])
        
        // 优先使用后端提供的activeTabId
        let newActiveTabId = result.activeTabId
        
        // 如果后端没有提供activeTabId，从tabs中找到活跃的
        if (!newActiveTabId) {
          const activeTab = result.tabs.find(tab => tab.isActive)
          newActiveTabId = activeTab?.id || null
          console.log(`🔍 前端从tabs中找到活跃标签页: ${newActiveTabId}`)
        }
        
        // 强制更新activeTabId
        if (newActiveTabId !== activeTabId) {
          console.log(`✅ 前端强制更新活跃标签页ID: ${activeTabId} -> ${newActiveTabId}`)
          setActiveTabId(newActiveTabId)
        }
        
        // 确保导航状态同步
        if (newActiveTabId) {
          const activeTab = result.tabs.find(tab => tab.id === newActiveTabId)
          console.log(`📊 活跃标签页详情:`, activeTab?.websiteName, activeTab?.url)
        }
      } else {
        console.warn('⚠️  前端未收到有效的标签页数据')
        setTabs([])
        setActiveTabId(null)
      }
    } catch (error) {
      console.error('❌ 前端加载标签页失败:', error)
      setTabs([])
      setActiveTabId(null)
    }
  }

  const handleTabCreated = (tab: AITab) => {
    console.log(`🆕 前端收到标签页创建事件:`, tab.id, tab.websiteName, 'isActive:', tab.isActive)
    
    setTabs(prev => {
      // 避免重复添加
      if (prev.find(t => t.id === tab.id)) {
        console.log(`⚠️  标签页已存在，跳过添加: ${tab.id}`)
        return prev
      }
      
      const newTabs = [...prev, tab]
      
      // 如果新标签页是活跃的，更新activeTabId
      if (tab.isActive) {
        console.log(`✅ 前端设置新建活跃标签页: ${tab.id}`)
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
    console.log(`🔄 前端收到标签页更新事件:`, data.tabId, data.updates)
    
    setTabs(prev => {
      let hasActiveTab = false
      let newActiveTabId = activeTabId
      
      const newTabs = prev.map(tab => {
        if (tab.id === data.tabId) {
          const updatedTab = { ...tab, ...data.updates }
          
          // 如果这个标签页变成活跃状态
          if (updatedTab.isActive) {
            hasActiveTab = true
            if (activeTabId !== data.tabId) {
              console.log(`✅ 前端通过更新事件设置活跃标签页: ${data.tabId}`)
              newActiveTabId = data.tabId
            }
          }
          
          return updatedTab
        } else {
          // 检查其他标签页是否有活跃状态
          if (tab.isActive) {
            hasActiveTab = true
          }
          return tab
        }
      })
      
      // 更新 activeTabId
      if (newActiveTabId !== activeTabId) {
        setActiveTabId(newActiveTabId)
      }
      
      return newTabs
    })
  }

  const handleNavigationStateChanged = (data: { 
    tabId: string, 
    state: BrowserNavigationState 
  }) => {
    console.log(`🧭 前端收到导航状态变化: ${data.tabId}, 当前activeTabId: ${activeTabId}`)
    
    // 检查是否是当前活跃标签页
    if (data.tabId === activeTabId) {
      setNavigationState(data.state)
    } else {
      // 如果activeTabId为空但有导航状态变化，可能需要更新activeTabId
      if (!activeTabId) {
        const tab = tabs.find(t => t.id === data.tabId)
        if (tab && tab.isActive) {
          console.log(`🔄 前端通过导航事件发现活跃标签页: ${data.tabId}`)
          setActiveTabId(data.tabId)
          setNavigationState(data.state)
        }
      }
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
      console.log(`🔄 前端请求切换标签页: ${tabId}`)
      const result = await window.electronAPI.switchTab(tabId)
      if (result?.success) {
        console.log(`✅ 前端切换标签页成功: ${tabId}`)
        // 立即更新前端状态
        setActiveTabId(tabId)
        // 然后重新同步以确保一致
        setTimeout(() => loadExistingTabs(), 100)
      } else {
        console.error(`❌ 前端切换标签页失败: ${result?.error}`)
        message.error(result?.error || '切换标签页失败')
      }
    } catch (error) {
      console.error('❌ 前端切换标签页异常:', error)
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
    // 优先通过 activeTabId 查找
    let activeTab = tabs.find(tab => tab.id === activeTabId) || null
    
    // 如果没找到，通过 isActive 属性查找
    if (!activeTab) {
      activeTab = tabs.find(tab => tab.isActive) || null
      if (activeTab && activeTab.id !== activeTabId) {
        console.log(`🔄 前端通过isActive找到活跃标签页，更新activeTabId: ${activeTab.id}`)
        setActiveTabId(activeTab.id)
      }
    }
    
    return activeTab
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
        fontWeight: 'bold',
        maxWidth: '600px',
        wordBreak: 'break-all'
      }}>
        🚀 TabHost: {tabs.length} tabs | Active: {activeTabId?.slice(0, 8) || 'NONE'} | Found: {(() => {
          const active = tabs.find(tab => tab.id === activeTabId) || tabs.find(tab => tab.isActive);
          return active?.websiteName || 'NULL';
        })()}
      </div>
    </div>
  )
}

export default TabHostApp