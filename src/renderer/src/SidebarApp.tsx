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

  const handleAction = async (action: 'navigate' | 'clearCache' | 'proxy') => {
    switch (action) {
      case 'clearCache':
        try {
          const result = await window.electronAPI.clearCache();
          if (result.success) {
            Modal.success({ title: '缓存已清除', content: '应用缓存已成功清除，包括网站数据、Cookie等。' });
          } else {
            Modal.error({ title: '清除缓存失败', content: result.error || '未知错误' });
          }
        } catch (error) {
          Modal.error({ title: '清除缓存失败', content: '无法连接到主进程' });
        }
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