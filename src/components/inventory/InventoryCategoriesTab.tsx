import React from 'react'
import { Ingredient } from '@/types'

// ============ COLOR SCHEME ============
const colors = {
  primary: '#4318FF',
  text: '#2B3674',
  textLight: '#8F9CB8',
  border: '#E0E5F2',
  success: '#05B75D',
  error: '#F3685A',
  warning: '#FEC90F',
  background: '#F3F4F6',
}

interface InventoryCategoriesTabProps {
  ingredients: Ingredient[]
  searchIngredient: string
  onSearchChange: (value: string) => void
}

export const InventoryCategoriesTab: React.FC<InventoryCategoriesTabProps> = ({
  ingredients,
  searchIngredient,
  onSearchChange,
}) => {
  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchIngredient.toLowerCase())
  )

  const tableHeaderStyle = {
    backgroundColor: colors.background,
    color: colors.text,
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: '600',
    fontSize: '13px',
    borderBottom: `2px solid ${colors.border}`,
  }

  const tableCellStyle = {
    padding: '12px',
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: '14px',
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Tìm kiếm nguyên liệu..."
          value={searchIngredient}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>STT</th>
            <th style={tableHeaderStyle}>Tên</th>
            <th style={tableHeaderStyle}>Đơn vị</th>
            <th style={tableHeaderStyle}>Giá cơ bản</th>
          </tr>
        </thead>
        <tbody>
          {filteredIngredients.map((ing, idx) => (
            <tr key={ing.ingredientid}>
              <td style={tableCellStyle}>{idx + 1}</td>
              <td style={tableCellStyle}>{ing.name}</td>
              <td style={tableCellStyle}>{ing.unit}</td>
              <td style={tableCellStyle}>{ing.baseprice.toLocaleString('vi-VN')} đ</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredIngredients.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: colors.textLight }}>
          Không tìm thấy nguyên liệu
        </div>
      )}
    </div>
  )
}
