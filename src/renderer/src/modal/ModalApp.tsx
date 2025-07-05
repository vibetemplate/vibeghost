import React, { useState, useEffect } from 'react'
import { Modal, Input, Form } from 'antd'
import ProxyView from '../views/ProxyView'
import './ModalApp.css'

type ModalType = 'proxy' | 'navigate' | null

const ModalApp: React.FC = () => {
  const [modalType, setModalType] = useState<ModalType>(null)
  const [navigateUrl, setNavigateUrl] = useState('')

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

  const renderModalContent = () => {
    switch (modalType) {
      case 'proxy':
        return <ProxyView />
      case 'navigate':
        return (
            <Input 
              placeholder="请输入完整的 URL，例如 https://www.google.com" 
              onChange={(e) => setNavigateUrl(e.target.value)}
              onPressEnter={handleNavigate}
            />
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

  return (
    <div className="modal-container">
      <Modal
        title={getModalTitle()}
        open={!!modalType}
        onCancel={handleClose}
        onOk={modalType === 'navigate' ? handleNavigate : undefined}
        okText={modalType === 'navigate' ? '跳转' : '确定'}
        cancelText="取消"
        destroyOnClose
        maskClosable={true}
        footer={modalType === 'navigate' ? undefined : null}
        centered
        width={520}
      >
        {renderModalContent()}
      </Modal>
    </div>
  )
}

export default ModalApp 