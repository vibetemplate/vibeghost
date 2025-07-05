import React from 'react'

const App: React.FC = () => {
  return (
    <div style={{ 
      height: '100vh',
      width: '100vw',
      background: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      color: '#666'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h3>VibeGhost 主应用</h3>
        <p>这个窗口不应该被显示</p>
        <p style={{ marginTop: '10px', fontSize: '14px' }}>
          左侧是AI网站，右侧是提示词库
        </p>
      </div>
    </div>
  )
}

export default App