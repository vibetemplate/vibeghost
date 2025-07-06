import React, { useState, useEffect } from 'react'
import { 
  Form, 
  Select, 
  Switch, 
  InputNumber, 
  Button, 
  Divider, 
  message,
  Card,
  Space
} from 'antd'
import { AppSettings } from '../../../shared/types'
import LogPanel from '../components/LogPanel'

const ConfigView: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    language: 'zh-CN',
    logLevel: 'info',
    maxLogEntries: 1000,
    autoSaveConfig: true,
    showLogPanel: false,
    defaultCategory: 'domestic'
  })

  const [logPanelVisible, setLogPanelVisible] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // 这里应该从本地存储或配置文件加载设置
      // 目前使用默认值
      form.setFieldsValue(settings)
    } catch (error) {
      console.error('Failed to load settings:', error)
      message.error('加载配置失败')
    }
  }

  const handleSave = async (values: AppSettings) => {
    try {
      setLoading(true)
      
      // 这里应该保存设置到本地存储或配置文件
      setSettings(values)
      
      message.success('配置已保存')
      setLoading(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
      message.error('保存配置失败')
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    message.info('配置已重置为默认值')
  }

  const showLogPanelValue = Form.useWatch('showLogPanel', form) ?? false

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        fontSize: '16px', 
        fontWeight: 'bold', 
        marginBottom: '16px',
        color: '#000000d9'
      }}>
        应用配置
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={settings}
      >
        <Card title="外观设置" size="small" style={{ marginBottom: '16px' }}>
          <Form.Item label="主题" name="theme">
            <Select>
              <Select.Option value="light">亮色主题</Select.Option>
              <Select.Option value="dark">暗色主题</Select.Option>
              <Select.Option value="system">跟随系统</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="语言" name="language">
            <Select>
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="功能设置" size="small" style={{ marginBottom: '16px' }}>
          <Form.Item label="默认网站分类" name="defaultCategory">
            <Select>
              <Select.Option value="domestic">国内大模型</Select.Option>
              <Select.Option value="international">国外大模型</Select.Option>
              <Select.Option value="coding">编程助手</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="autoSaveConfig" 
            valuePropName="checked"
            style={{ marginBottom: '8px' }}
          >
            <Switch checkedChildren="自动保存配置" unCheckedChildren="手动保存配置" />
          </Form.Item>

          <Form.Item 
            name="showLogPanel" 
            valuePropName="checked"
          >
            <Switch checkedChildren="显示日志面板" unCheckedChildren="隐藏日志面板" />
          </Form.Item>
        </Card>

        <Card title="日志设置" size="small" style={{ marginBottom: '16px' }}>
          <Form.Item label="日志级别" name="logLevel">
            <Select>
              <Select.Option value="debug">调试 (Debug)</Select.Option>
              <Select.Option value="info">信息 (Info)</Select.Option>
              <Select.Option value="warn">警告 (Warning)</Select.Option>
              <Select.Option value="error">错误 (Error)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            label="最大日志条数" 
            name="maxLogEntries"
            help="超过此数量时会自动清理旧日志"
          >
            <InputNumber 
              min={100} 
              max={10000} 
              step={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>

        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button onClick={handleReset}>
            重置默认
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存配置
          </Button>
        </Space>

        {/* 日志面板显示 */}
        {showLogPanelValue && (
          <>
            <Divider />
            <LogPanel isVisible={logPanelVisible} onToggle={() => setLogPanelVisible(!logPanelVisible)} />
          </>
        )}
      </Form>
    </div>
  )
}

export default ConfigView 