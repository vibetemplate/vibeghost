import React, { useState } from 'react'
import { Modal } from 'antd'
import Header from './components/Header'
import FooterToolbar from './components/FooterToolbar'
import ProjectsView from './views/ProjectsView'
import PromptsView from './views/PromptsView'
import ConfigView from './views/ConfigView'

import './SidebarApp.css'

const SidebarApp: React.FC = () => {
  const [activeView, setActiveView] = useState('projects')

  const handleSiteChange = async (url: string) => {
    try {
      await window.electronAPI.switchSite(url)
    } catch (error) {
      console.error('Failed to switch site:', error)
      Modal.error({ title: '切换站点失败', content: (error as Error).message })
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleAction = (action: 'navigate' | 'clearCache' | 'proxy') => {
    switch (action) {
      case 'clearCache':
        handleRefresh();
        Modal.success({ title: '缓存已清除', content: '页面已刷新以获取最新数据。' });
        break;
      case 'navigate':
        window.electronAPI.showModal('navigate')
        break;
      case 'proxy':
        window.electronAPI.showModal('proxy')
        break;
    }
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'projects':
        return <ProjectsView />
      case 'prompts':
        return <PromptsView />
      case 'config':
        return <ConfigView />
      default:
        return <ProjectsView />
    }
  }

  return (
    <div className="sidebar-app-container">
      <Header onSiteChange={handleSiteChange} onRefresh={handleRefresh} />
      <main className="main-content">{renderActiveView()}</main>
      <FooterToolbar
        activeView={activeView}
        onViewChange={setActiveView}
        onAction={handleAction}
      />
    </div>
  )
}

export default SidebarApp