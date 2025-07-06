import React, { useState, useEffect, useRef } from 'react'
import { 
  Card, 
  Button, 
  Select, 
  Input, 
  Space, 
  Empty,
  Tooltip,
  Badge
} from 'antd'
import { 
  UpOutlined, 
  DownOutlined, 
  ClearOutlined, 
  ExportOutlined,
} from '@ant-design/icons'
import { LogEntry } from '../../../shared/types'
import './LogPanel.css'

interface LogPanelProps {
  isVisible: boolean
  onToggle: () => void
}

const LogPanel: React.FC<LogPanelProps> = ({ isVisible, onToggle }) => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 模拟添加一些初始日志
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: 'VibeGhost 应用启动',
        details: { version: '1.0.0' }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 30000),
        level: 'info',
        category: 'website',
        message: '网站配置加载完成',
        details: { count: 13 }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 60000),
        level: 'warn',
        category: 'proxy',
        message: '代理连接检测超时',
        details: { timeout: 5000 }
      }
    ]
    setLogs(mockLogs)
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, filterLevel, searchText])

  useEffect(() => {
    // 自动滚动到底部
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs])

  const filterLogs = () => {
    let filtered = logs

    // 按级别过滤
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel)
    }

    // 按搜索文本过滤
    if (searchText) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchText.toLowerCase()) ||
        log.category.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    
    setLogs(prevLogs => {
      const updatedLogs = [...prevLogs, newLog]
      // 限制最大日志数量
      if (updatedLogs.length > 1000) {
        return updatedLogs.slice(-1000)
      }
      return updatedLogs
    })
  }

  const clearLogs = () => {
    setLogs([])
    setFilteredLogs([])
  }

  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp.toLocaleString()}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vibeghost-logs-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ff4d4f'
      case 'warn': return '#faad14'
      case 'info': return '#52c41a'
      case 'debug': return '#1890ff'
      default: return '#666666'
    }
  }

  const getLevelCount = (level: string) => {
    return logs.filter(log => log.level === level).length
  }

  if (!isVisible) {
    return (
      <div className="log-panel-collapsed">
        <Button 
          type="text" 
          icon={<UpOutlined />} 
          onClick={onToggle}
          style={{ width: '100%' }}
        >
          运行日志 ({logs.length})
        </Button>
      </div>
    )
  }

  return (
    <Card 
      className="log-panel-expanded"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>运行日志</span>
          <Button 
            type="text" 
            icon={<DownOutlined />} 
            onClick={onToggle}
            size="small"
          />
        </div>
      }
      size="small"
      style={{ margin: '8px 0' }}
    >
      <div className="log-controls">
        <Space wrap>
          <Select
            value={filterLevel}
            onChange={setFilterLevel}
            size="small"
            style={{ width: 120 }}
          >
            <Select.Option value="all">
              全部 ({logs.length})
            </Select.Option>
            <Select.Option value="error">
              <Badge color="#ff4d4f" text={`错误 (${getLevelCount('error')})`} />
            </Select.Option>
            <Select.Option value="warn">
              <Badge color="#faad14" text={`警告 (${getLevelCount('warn')})`} />
            </Select.Option>
            <Select.Option value="info">
              <Badge color="#52c41a" text={`信息 (${getLevelCount('info')})`} />
            </Select.Option>
            <Select.Option value="debug">
              <Badge color="#1890ff" text={`调试 (${getLevelCount('debug')})`} />
            </Select.Option>
          </Select>
          
          <Input.Search
            placeholder="搜索日志..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            style={{ width: 150 }}
          />
          
          <Tooltip title="清空日志">
            <Button 
              icon={<ClearOutlined />} 
              size="small" 
              onClick={clearLogs}
            />
          </Tooltip>
          
          <Tooltip title="导出日志">
            <Button 
              icon={<ExportOutlined />} 
              size="small" 
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
            />
          </Tooltip>
        </Space>
      </div>

      <div 
        ref={logContainerRef}
        className="log-container"
        style={{ 
          height: '200px', 
          overflowY: 'auto',
          border: '1px solid #f0f0f0',
          borderRadius: '4px',
          padding: '8px',
          backgroundColor: '#fafafa',
          fontFamily: 'Monaco, Consolas, monospace',
          fontSize: '11px'
        }}
      >
        {filteredLogs.length === 0 ? (
          <Empty 
            description="暂无日志" 
            style={{ margin: '20px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="log-entry">
              <span className="log-timestamp">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span 
                className="log-level"
                style={{ color: getLevelColor(log.level) }}
              >
                [{log.level.toUpperCase()}]
              </span>
              <span className="log-category">
                [{log.category}]
              </span>
              <span className="log-message">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export default LogPanel