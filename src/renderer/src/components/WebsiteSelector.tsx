import React, { useState, useEffect } from 'react'
import { Select, Spin } from 'antd'
import { WebsiteCategory } from '../../../shared/types'

interface WebsiteSelectorProps {
  categories: WebsiteCategory[]
  selectedCategory?: string
  onCategoryChange: (categoryId: string) => void
  loading?: boolean
}

const WebsiteSelector: React.FC<WebsiteSelectorProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  loading = false
}) => {
  const [currentCategory, setCurrentCategory] = useState<string>(selectedCategory || '')

  useEffect(() => {
    if (selectedCategory) {
      setCurrentCategory(selectedCategory)
    } else if (categories.length > 0) {
      setCurrentCategory(categories[0].id)
      onCategoryChange(categories[0].id)
    }
  }, [selectedCategory, categories, onCategoryChange])

  const handleCategoryChange = (value: string) => {
    setCurrentCategory(value)
    onCategoryChange(value)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '20px' 
      }}>
        <Spin tip="加载网站分类..." />
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <Select
        value={currentCategory}
        onChange={handleCategoryChange}
        style={{ width: '100%' }}
        placeholder="选择网站分类"
        size="middle"
      >
        {categories.map(category => (
          <Select.Option key={category.id} value={category.id}>
            {category.displayName}
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}

export default WebsiteSelector