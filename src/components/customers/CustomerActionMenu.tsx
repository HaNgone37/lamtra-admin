import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Pencil, Star, Lock, Unlock } from 'lucide-react'

export interface CustomerForAction {
  customerid: string
  fullname: string
  isactive?: boolean
}

interface CustomerActionMenuProps {
  customer: CustomerForAction
  isSuperAdmin: boolean
  onEdit: (customer: CustomerForAction) => void
  onManagePoints: (customer: CustomerForAction) => void
  onToggleLock: (customer: CustomerForAction) => void
}

export default function CustomerActionMenu({
  customer,
  isSuperAdmin,
  onEdit,
  onManagePoints,
  onToggleLock,
}: CustomerActionMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const isActive = customer.isactive !== false

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
        type="button"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 origin-top-right">
          {/* Edit */}
          <button
            onClick={() => { onEdit(customer); setOpen(false) }}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            type="button"
          >
            <Pencil className="w-4 h-4 text-slate-400" />
            Sửa thông tin
          </button>

          {/* Manage Points - Super Admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => { onManagePoints(customer); setOpen(false) }}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              type="button"
            >
              <Star className="w-4 h-4 text-amber-400" />
              Điều chỉnh điểm
            </button>
          )}

          {/* Lock / Unlock - Super Admin only */}
          {isSuperAdmin && (
            <>
              <div className="my-1 mx-3 border-t border-slate-100" />
              <button
                onClick={() => { onToggleLock(customer); setOpen(false) }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2.5 transition-colors ${
                  isActive ? 'text-red-500' : 'text-emerald-600'
                }`}
                type="button"
              >
                {isActive ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Khóa tài khoản
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Mở khóa tài khoản
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
