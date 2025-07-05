import React, { useState, useEffect } from 'react'
import { Button, Spin } from 'antd'

const SidebarAppDebug: React.FC = () => {
  const [step, setStep] = useState('初始化')
  const [prompts, setPrompts] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    debugLoad()
  }, [])

  const debugLoad = async () => {
    try {
      setStep('检查 electronAPI')
      
      if (!window.electronAPI) {
        setError('electronAPI 不存在')
        return
      }
      
      setStep('electronAPI 存在，准备调用 getPrompts')
      
      const promptsData = await window.electronAPI.getPrompts()
      setStep('getPrompts 调用成功')
      
      setPrompts(promptsData || [])
      setStep('完成')
      
    } catch (err: any) {
      setError('错误: ' + err.message)
      setStep('失败')
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>调试信息</h3>
      <p><strong>状态:</strong> {step}</p>
      <p><strong>错误:</strong> {error || '无'}</p>
      <p><strong>提示词数量:</strong> {prompts.length}</p>
      
      <div style={{ margin: '20px 0' }}>
        <Button onClick={debugLoad} type="primary">
          重新测试
        </Button>
      </div>
      
      {step === '完成' && prompts.length > 0 && (
        <div>
          <h4>提示词数据:</h4>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(prompts, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>测试完成后，我们会切换回正常的提示词库界面</p>
      </div>
    </div>
  )
}

export default SidebarAppDebug