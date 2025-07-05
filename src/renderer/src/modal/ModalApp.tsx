import React, { useState, useEffect, useRef } from 'react'
import { Input, Button, message } from 'antd'
import ProxyView, { ProxyViewRef } from '../views/ProxyView'
import './ModalApp.css'

type ModalType = 'proxy' | 'navigate' | null

const ModalApp: React.FC = () => {
  const [modalType, setModalType] = useState<ModalType>(null)
  const [navigateUrl, setNavigateUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const proxyViewRef = useRef<ProxyViewRef>(null)

  useEffect(() => {
    const handleShowModal = (type: string, props: any) => {
      console.log(`ModalApp received show-modal-in-view: ${type}`, props)
      if (type === 'proxy' || type === 'navigate') {
        setModalType(type as ModalType)
      } else {
        console.warn(`Unknown modal type received: ${type}`)
      }
    }
    
    window.electronAPI.onShowModal(handleShowModal)
    
    return () => {
      window.electronAPI.removeAllListeners('show-modal-in-view')
    }
  }, [])

  const handleClose = () => {
    setModalType(null)
    window.electronAPI.hideModal()
  }
  
  const handleNavigate = () => {
    if (navigateUrl) {
        window.electronAPI.switchSite(navigateUrl)
    }
    handleClose()
  }

  const handleProxySave = async () => {
    if (!proxyViewRef.current) return
    
    try {
      setSaving(true)
      await proxyViewRef.current.save()
      message.success('代理配置已保存')
      handleClose()
    } catch (error) {
      message.error('保存代理配置失败')
      console.error('Failed to save proxy config:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderModalContent = () => {
    switch (modalType) {
      case 'proxy':
        return <ProxyView ref={proxyViewRef} />
      case 'navigate':
        return (
          <div style={{ padding: '24px' }}>
            <Input 
              placeholder="请输入完整的 URL，例如 https://www.google.com" 
              onChange={(e) => setNavigateUrl(e.target.value)}
              onPressEnter={handleNavigate}
              size="large"
            />
          </div>
        )
      default:
        return null
    }
  }

  const getModalTitle = () => {
    switch (modalType) {
      case 'proxy':
        return '代理服务器设置'
      case 'navigate':
        return '导航到新页面'
      default:
        return ''
    }
  }

  const getModalFooter = () => {
    if (modalType === 'proxy') {
      return [
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleProxySave} loading={saving}>
          保存配置
        </Button>
      ]
    }
    if (modalType === 'navigate') {
      return [
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button key="ok" type="primary" onClick={handleNavigate}>
          跳转
        </Button>
      ]
    }
    return null
  }

  if (!modalType) {
    return null
  }

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{getModalTitle()}</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
          {renderModalContent()}
        </div>
        <div className="modal-footer">
          {getModalFooter()}
        </div>
      </div>
    </div>
  )
}

export default ModalApp 