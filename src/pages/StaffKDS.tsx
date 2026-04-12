import React, { useEffect, useState } from 'react'
import { KDSBoard } from '@/components/staff/KDSBoard'

// ═════════════════════════════════════════════════════════════════
// STAFF KDS PAGE
// ═════════════════════════════════════════════════════════════════

export const StaffKDS: React.FC = () => {
  const [branchId, setBranchId] = useState<number>(0)

  // ─────────────────────────────────────────────────────────────
  // GET BRANCH ID FROM LOCALSTORAGE
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem('userBranchId')
    if (stored) {
      setBranchId(parseInt(stored, 10))
    }
  }, [])

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (branchId === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang khởi tạo KDS...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-black text-white">🍜 KITCHEN DISPLAY SYSTEM (KDS)</h1>
          <p className="text-gray-300 text-sm mt-2">
            📍 Chi nhánh <span className="font-bold text-primary">#{branchId}</span> | 
            <span className="ml-2">⏰ {new Date().toLocaleTimeString('vi-VN')}</span>
          </p>
        </div>

        {/* KDS Board */}
        <KDSBoard branchId={branchId} />

        {/* Footer Info */}
        <div className="mt-8 px-4 py-3 bg-gray-800 rounded-[15px] text-center border border-gray-700">
          <p className="text-gray-400 text-xs font-medium">
            ℹ️ Hệ thống tự động cập nhật mỗi 5 giây | 🔊 Có thông báo âm thanh khi có đơn hàng mới
          </p>
        </div>
      </div>
    </div>
  )
}

export default StaffKDS
