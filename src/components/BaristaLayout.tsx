import React, { useState, useEffect } from 'react'
import { LogOut, Coffee } from 'lucide-react'
import { useAuth } from '@/services/AuthContext'
import { supabase } from '@/utils/supabaseClient'
import StaffDashboard from '@/pages/StaffDashboard'

interface BaristaLayoutProps {
  onLogout: () => void
}

export const BaristaLayout: React.FC<BaristaLayoutProps> = ({ onLogout }) => {
  const { user } = useAuth()
  const branchId = localStorage.getItem('userBranchId') || ''
  const [branchName, setBranchName] = useState<string>('Chi nhánh')

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {/* ─── TOP HEADER ─── */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #f5d5e0',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Left: Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="https://tpwgbutlqmubdnnnfhdp.supabase.co/storage/v1/object/public/lamtra-media/products/LAMTRA_WP_FOOTER_LOGO-1.png"
            alt="LAM TRÀ"
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
          />
          <div>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '16px', color: '#2B3674', lineHeight: 1.2 }}>
              LAM TRÀ
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#f06192', lineHeight: 1.2 }}>
              {branchName}
            </p>
          </div>
        </div>

        {/* Center: KDS Title */}
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#f06192',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Coffee size={16} /> Trạm Pha Chế
          </span>
        </div>

        {/* Right: Staff name + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#8F9CB8' }}>
            {user?.name || 'Barista'}
          </span>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#E53E3E',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#C53030')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E53E3E')}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <StaffDashboard />
      </main>
    </div>
  )
}

export default BaristaLayout
