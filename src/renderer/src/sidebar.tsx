import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import SidebarApp from './SidebarApp'
import SidebarAppDebug from './SidebarAppDebug'
import './sidebar.css'

// 切换到正常版本测试
const DEBUG_MODE = false

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      {DEBUG_MODE ? <SidebarAppDebug /> : <SidebarApp />}
    </ConfigProvider>
  </React.StrictMode>
)