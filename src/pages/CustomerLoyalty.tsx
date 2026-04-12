import { useCallback } from 'react'
import { Settings } from 'lucide-react'
import LoyalCustomersTab from '@/components/customers/LoyalCustomersTab'

export default function CustomerLoyaltyPage() {
  // ── Get user role from localStorage ──
  const rawRole = localStorage.getItem('userRole') || 'staff'

  const getRoleFlags = useCallback((rawRoleStr: string) => {
    const role = rawRoleStr.toLowerCase()
    const isSuperAdmin = role.includes('super')
    const isBranchManager = !isSuperAdmin && (role.includes('manager') || role.includes('branch'))
    return { isSuperAdmin, isBranchManager }
  }, [])

  const { isSuperAdmin, isBranchManager } = getRoleFlags(rawRole)

  // ── Permission check ──
  const hasAccess = isSuperAdmin || isBranchManager

  if (!hasAccess) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8">
          <div className="text-center">
            <Settings className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Không có quyền truy cập</h1>
            <p className="text-slate-600">Chỉ quản lý chi nhánh và Super Admin mới có thể xem trang này.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Khách hàng thân thiết</h1>
        <p className="text-slate-600 mt-1">Phân tích độ trung thành khách hàng & xếp hạng loyalty</p>
      </div>

      {/* ── Content ── */}
      <LoyalCustomersTab />
    </div>
  )
}
