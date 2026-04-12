import React, { useState, useEffect } from 'react'
import { LogOut, Coffee, BarChart3 } from 'lucide-react'
import { useAuth } from '@/services/AuthContext'
import { supabase } from '@/utils/supabaseClient'
import StaffDashboard from '@/pages/StaffDashboard'
import StaffPOS from '@/pages/StaffPOS'

interface BaristaLayoutProps {
  onLogout: () => void
}

// ═════════════════════════════════════════════════════════════════
// STAFF NAVIGATION TABS
// ═════════════════════════════════════════════════════════════════

const STAFF_TABS = [
  { id: 'dashboard', label: 'Tổng quan', icon: BarChart3 },
  { id: 'pos', label: 'Quầy bán hàng', icon: Coffee }
]

// ═════════════════════════════════════════════════════════════════
// BARISTA LAYOUT COMPONENT
// ═════════════════════════════════════════════════════════════════

export const BaristaLayout: React.FC<BaristaLayoutProps> = ({ onLogout }) => {
  const { user } = useAuth()
  const branchId = localStorage.getItem('userBranchId') || ''
  const [branchName, setBranchName] = useState<string>('Chi nhánh')
  const [currentTab, setCurrentTab] = useState<string>('dashboard')

  // ─────────────────────────────────────────────────────────────
  // FETCH BRANCH INFO
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!branchId) return
    supabase
      .from('branches')
      .select('name')
      .eq('branchid', Number(branchId))
      .single()
      .then(({ data }) => {
        if (data?.name) setBranchName(data.name)
      })
  }, [branchId])

  // ─────────────────────────────────────────────────────────────
  // RENDER CURRENT PAGE
  // ─────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <StaffDashboard />
      case 'pos':
        return <StaffPOS />
      default:
        return <StaffDashboard />
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER LAYOUT
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7FE', display: 'flex', flexDirection: 'column' }}>
      {/* ─── TOP HEADER ─── */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E8EAEF',
          padding: '0 24px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {/* Left: Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="https://tpwgbutlqmubdnnnfhdp.supabase.co/storage/v1/object/public/lamtra-media/products/LAMTRA_WP_FOOTER_LOGO-1.png"
            alt="LAM TRÀ"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <div>
            <p style={{ margin: 0, fontWeight: '900', fontSize: '18px', color: '#2B3674', lineHeight: 1 }}>
              LAM TRÀ
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#4318FF', fontWeight: '600', lineHeight: 1 }}>
              {branchName}
            </p>
          </div>
        </div>

        {/* Right: Staff name + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#2B3674' }}>
              {user?.name || 'Nhân viên'}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#8F9CB8' }}>
              👤 Pha chế
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#E53E3E',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C53030')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E53E3E')}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </header>

      {/* ─── NAVIGATION TABS ─── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E8EAEF',
          padding: '0 24px',
          display: 'flex',
          gap: '24px',
          height: '60px',
          alignItems: 'center',
          overflow: 'x',
        }}
      >
        {STAFF_TABS.map((tab) => {
          const IconComponent = tab.icon
          const isActive = currentTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                borderBottom: isActive ? '3px solid #4318FF' : '3px solid transparent',
                backgroundColor: 'transparent',
                fontSize: '14px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#4318FF' : '#8F9CB8',
                cursor: 'pointer',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#2B3674'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#8F9CB8'
                }
              }}
            >
              <IconComponent size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#F4F7FE' }}>
        {renderContent()}
      </main>
    </div>
  )
}

export default BaristaLayout
