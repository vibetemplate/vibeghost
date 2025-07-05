import React, { useState } from 'react'
import { Modal } from 'antd'
import Header from './components/Header'
import FooterToolbar from './components/FooterToolbar'
import LogPanel from './components/LogPanel'
import WebsiteView from './views/WebsiteView'
import ProjectsView from './views/ProjectsView'
import PromptsView from './views/PromptsView'
import ConfigView from './views/ConfigView'

import './SidebarApp.css'

const SidebarApp: React.FC = () => {
  const [activeView, setActiveView] = useState('websites')
  const [showLogPanel, setShowLogPanel] = useState(false)

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
      case 'websites':
        return <WebsiteView />
      case 'projects':
        return <ProjectsView />
      case 'prompts':
        return <PromptsView />
      case 'config':
        return <ConfigView />
      default:
        return <WebsiteView />
    }
  }

  const handleToggleLogPanel = () => {
    setShowLogPanel(!showLogPanel)
  }

  return (
    <div className="sidebar-app-container">
      <Header onRefresh={handleRefresh} />
      <main className={`main-content ${showLogPanel ? 'with-log-panel' : ''}`}>
        {renderActiveView()}
        {showLogPanel && (
          <LogPanel 
            isVisible={showLogPanel} 
            onToggle={handleToggleLogPanel}
          />
        )}
      </main>
      <FooterToolbar
        activeView={activeView}
        onViewChange={setActiveView}
        onAction={handleAction}
      />
      {!showLogPanel && (
        <div className="log-panel-toggle">
          <LogPanel 
            isVisible={false} 
            onToggle={handleToggleLogPanel}
          />
        </div>
      )}
    </div>
  )
}

export default SidebarApp