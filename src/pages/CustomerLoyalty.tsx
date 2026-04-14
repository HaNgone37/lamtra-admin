import { useCallback } from 'react'
import { Settings } from 'lucide-react'
import LoyalCustomersTab from '@/components/customers/LoyalCustomersTab'

export default function CustomerLoyaltyPage() {
  // ΓöÇΓöÇ Get user role from localStorage ΓöÇΓöÇ
  const rawRole = localStorage.getItem('userRole') || 'staff'

  const getRoleFlags = useCallback((rawRoleStr: string) => {
    const role = rawRoleStr.toLowerCase()
    const isSuperAdmin = role.includes('super')
    const isBranchManager = !isSuperAdmin && (role.includes('manager') || role.includes('branch'))
    return { isSuperAdmin, isBranchManager }
  }, [])

  const { isSuperAdmin, isBranchManager } = getRoleFlags(rawRole)

  // ΓöÇΓöÇ Permission check ΓöÇΓöÇ
  const hasAccess = isSuperAdmin || isBranchManager

  if (!hasAccess) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8">
          <div className="text-center">
            <Settings className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Kh├┤ng c├│ quyß╗ün truy cß║¡p</h1>
            <p className="text-slate-600">Chß╗ë quß║ún l├╜ chi nh├ính v├á Super Admin mß╗¢i c├│ thß╗â xem trang n├áy.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* ΓöÇΓöÇ Page Header ΓöÇΓöÇ */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Kh├ích h├áng th├ón thiß║┐t</h1>
        <p className="text-slate-600 mt-1">Ph├ón t├¡ch ─æß╗Ö trung th├ánh kh├ích h├áng & xß║┐p hß║íng loyalty</p>
      </div>

      {/* ΓöÇΓöÇ Content ΓöÇΓöÇ */}
      <LoyalCustomersTab />
    </div>
  )
}