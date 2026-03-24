import React from 'react'

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

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

export const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        border: 'none',
        background: active ? `linear-gradient(135deg, ${colors.primary} 0%, #5B31FF 100%)` : 'transparent',
        color: active ? '#FFFFFF' : colors.textLight,
        borderBottom: active ? 'none' : `1px solid ${colors.border}`,
        borderRadius: active ? '8px 8px 0 0' : '0',
        cursor: 'pointer',
        fontWeight: active ? '600' : '500',
        fontSize: '14px',
        transition: 'all 0.3s ease',
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  )
}
