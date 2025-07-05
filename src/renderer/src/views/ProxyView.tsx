import React, { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, Switch, Button, Spin, message } from 'antd'
import { ProxyConfig } from '../../../shared/types'
import './ProxyView.css'

const { Option } = Select

const ProxyView: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchProxyConfig = async () => {
      try {
        setLoading(true)
        if (!window.electronAPI.getProxyConfig) {
          throw new Error('getProxyConfig function is not defined on electronAPI.')
        }
        const config = await window.electronAPI.getProxyConfig()
        if (config) {
          form.setFieldsValue(config)
        }
      } catch (error) {
        message.error(`加载代理配置失败: ${(error as Error).message}`)
        console.error('Failed to fetch proxy config:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProxyConfig()
  }, [form])

  const onFinish = async (values: ProxyConfig) => {
    try {
      setSaving(true)
      await window.electronAPI.updateProxy(values)
      message.success('代理配置已保存')
    } catch (error) {
      message.error('保存代理配置失败')
      console.error('Failed to save proxy config:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="proxy-view-container center-content">
        <Spin tip="正在加载代理配置..." />
      </div>
    )
  }

  return (
    <div className="proxy-view-container">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ type: 'http', enabled: false }}
      >
        <Form.Item name="enabled" label="启用代理" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="type" label="代理类型" rules={[{ required: true }]}>
          <Select>
            <Option value="http">HTTP</Option>
            <Option value="socks5">SOCKS5</Option>
          </Select>
        </Form.Item>
        <Form.Item name="host" label="代理服务器" rules={[{ required: true, message: '请输入服务器地址' }]}>
          <Input placeholder="例如: 127.0.0.1" />
        </Form.Item>
        <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口号' }]}>
          <InputNumber style={{ width: '100%' }} min={1} max={65535} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ProxyView 