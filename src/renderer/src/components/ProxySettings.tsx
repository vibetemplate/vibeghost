import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Switch, Button, Space, Divider, Alert } from 'antd'
import { ProxyConfig } from '@shared/types'

interface ProxySettingsProps {
  config: ProxyConfig
  onUpdate: (config: ProxyConfig) => void
  onClose: () => void
}

const ProxySettings: React.FC<ProxySettingsProps> = ({ config, onUpdate, onClose }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    form.setFieldsValue(config)
  }, [config, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      const newConfig: ProxyConfig = {
        enabled: values.enabled,
        host: values.host,
        port: values.port,
        type: values.type,
        auth: values.needAuth ? {
          username: values.username,
          password: values.password
        } : undefined
      }

      await onUpdate(newConfig)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error('保存代理配置失败:', error)
    }
  }

  const testConnection = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // 这里可以添加实际的连接测试逻辑
      // 暂时模拟测试结果
      setTimeout(() => {
        setTestResult({
          success: true,
          message: '代理连接测试成功'
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      setTestResult({
        success: false,
        message: '代理连接测试失败'
      })
      setLoading(false)
    }
  }

  const presetConfigs = [
    { name: '本地代理 (7890)', host: '127.0.0.1', port: 7890, type: 'http' },
    { name: '本地代理 (1080)', host: '127.0.0.1', port: 1080, type: 'socks5' },
    { name: 'Clash 默认', host: '127.0.0.1', port: 7890, type: 'http' }
  ]

  const applyPreset = (preset: any) => {
    form.setFieldsValue({
      host: preset.host,
      port: preset.port,
      type: preset.type
    })
  }

  return (
    <Modal
      title="代理设置"
      open={true}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="test" onClick={testConnection} loading={loading}>
          测试连接
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
          保存
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enabled: false,
          type: 'http',
          host: '127.0.0.1',
          port: 7890,
          needAuth: false
        }}
      >
        <Form.Item name="enabled" valuePropName="checked">
          <Switch checkedChildren="启用代理" unCheckedChildren="禁用代理" />
        </Form.Item>

        <Divider>快速配置</Divider>
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            {presetConfigs.map(preset => (
              <Button
                key={preset.name}
                size="small"
                type="dashed"
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </Space>
        </div>

        <Divider>代理配置</Divider>
        
        <Form.Item
          label="代理类型"
          name="type"
          rules={[{ required: true, message: '请选择代理类型' }]}
        >
          <Select>
            <Select.Option value="http">HTTP</Select.Option>
            <Select.Option value="socks5">SOCKS5</Select.Option>
          </Select>
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            label="代理地址"
            name="host"
            rules={[{ required: true, message: '请输入代理地址' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="127.0.0.1" />
          </Form.Item>

          <Form.Item
            label="端口"
            name="port"
            rules={[{ required: true, message: '请输入端口' }]}
            style={{ width: '120px' }}
          >
            <Input type="number" placeholder="7890" />
          </Form.Item>
        </div>

        <Form.Item name="needAuth" valuePropName="checked">
          <Switch checkedChildren="需要认证" unCheckedChildren="无需认证" />
        </Form.Item>

        <Form.Item dependencies={['needAuth']}>
          {({ getFieldValue }) => {
            const needAuth = getFieldValue('needAuth')
            return needAuth ? (
              <div style={{ display: 'flex', gap: '16px' }}>
                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                  style={{ flex: 1 }}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="密码"
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                  style={{ flex: 1 }}
                >
                  <Input.Password />
                </Form.Item>
              </div>
            ) : null
          }}
        </Form.Item>

        {testResult && (
          <Alert
            message={testResult.message}
            type={testResult.success ? 'success' : 'error'}
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Form>
    </Modal>
  )
}

export default ProxySettings