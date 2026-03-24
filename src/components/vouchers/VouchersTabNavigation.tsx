import React from 'react'

const COLORS = {
  card: '#FFFFFF',
  textLight: '#A3AED0',
  primary: '#4318FF',
  border: '#E0E5F2',
}

interface TabItem {
  id: 'stats' | 'distribution' | 'points' | 'welcome'
  label: string
}

interface VouchersTabNavigationProps {
  activeTab: 'stats' | 'distribution' | 'points' | 'welcome'
  onTabChange: (tab: 'stats' | 'distribution' | 'points' | 'welcome') => void
}

const TAB_LIST: TabItem[] = [
  { id: 'stats', label: 'Thống Kê' },
  { id: 'distribution', label: 'Phát Hành' },
  { id: 'points', label: 'Đổi Điểm' },
  { id: 'welcome', label: 'Quà Tặng' },
]

export const VouchersTabNavigation: React.FC<VouchersTabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      borderBottom: `2px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      padding: '12px',
      borderRadius: '16px',
    }}>
      {TAB_LIST.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: activeTab === tab.id ? '600' : '500',
            color: activeTab === tab.id ? COLORS.card : COLORS.textLight,
            backgroundColor: activeTab === tab.id ? COLORS.primary : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
