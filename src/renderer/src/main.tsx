import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import TabHostApp from './TabHostApp'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// 应用配置
const appConfig = {
  locale: zhCN,
  theme: {
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    components: {
      Button: {
        borderRadius: 4,
      },
      Input: {
        borderRadius: 4,
      },
      Card: {
        borderRadius: 6,
      },
      Tabs: {
        borderRadius: 4,
      }
    }
  }
}

root.render(
  <React.StrictMode>
    <ConfigProvider {...appConfig}>
      <TabHostApp />
    </ConfigProvider>
  </React.StrictMode>
)

// 通知应用已就绪
window.dispatchEvent(new CustomEvent('app-ready'))

// 错误边界处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
  event.preventDefault()
})