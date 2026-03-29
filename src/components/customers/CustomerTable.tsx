import { Users, Mail, Phone, CreditCard, Star, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import CustomerActionMenu, { type CustomerForAction } from './CustomerActionMenu'

export interface CustomerRow {
  customerid: string
  fullname: string
  phone: string
  email: string
  totalpoints: number
  membership: string
  birthday: string | null
  ordercount: number
  totalspent: number
  lastorderdate: string
  authid?: string
  isactive?: boolean
}

interface CustomerTableProps {
  customers: CustomerRow[]
  loading: boolean
  isSuperAdmin: boolean
  isBranchManager: boolean
  onEdit: (customer: CustomerForAction) => void
  onManagePoints: (customer: CustomerForAction) => void
  onToggleLock: (customer: CustomerForAction) => void
}

const MEMBERSHIP_STYLE: Record<string, { badge: string }> = {
  VIP:     { badge: 'bg-violet-100 text-violet-700' },
  Gold:    { badge: 'bg-amber-100  text-amber-700' },
  Silver:  { badge: 'bg-slate-100  text-slate-600' },
  Thường:  { badge: 'bg-green-100  text-green-700' },
}

function getMembershipStyle(membership: string) {
  return (MEMBERSHIP_STYLE[membership] ?? MEMBERSHIP_STYLE['Thường']).badge
}

export default function CustomerTable({
  customers,
  loading,
  isSuperAdmin,
  isBranchManager,
  onEdit,
  onManagePoints,
  onToggleLock,
}: CustomerTableProps) {
  const canSeeFinancial = isSuperAdmin || isBranchManager
  const canSeeEmail = isSuperAdmin || isBranchManager
  const canAct = isSuperAdmin || isBranchManager

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-slate-400 text-sm">Đang tải dữ liệu...</span>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Users className="w-12 h-12 text-slate-200" />
        <p className="text-slate-400 text-sm">Không tìm thấy khách hàng phù hợp</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Khách hàng
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                Điện thoại
              </span>
            </th>
            {canSeeEmail && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </span>
              </th>
            )}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Số đơn
            </th>
            {canSeeFinancial && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Chi tiêu (đ)
              </th>
            )}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                Điểm
              </span>
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span className="inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                Membership
              </span>
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Đơn cuối
            </th>
            {canAct && (
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Thao tác
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {customers.map((c, idx) => {
            const isActive = c.isactive !== false
            return (
              <tr
                key={c.customerid}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {/* # */}
                <td className="px-4 py-3 text-sm text-slate-400">{idx + 1}</td>

                {/* Tên */}
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-slate-800">{c.fullname}</span>
                </td>

                {/* SDT */}
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">{c.phone || '—'}</span>
                </td>

                {/* Email */}
                {canSeeEmail && (
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-500">{c.email || '—'}</span>
                  </td>
                )}

                {/* Số đơn */}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-blue-600">{c.ordercount}</span>
                </td>

                {/* Chi tiêu */}
                {canSeeFinancial && (
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-emerald-600">
                      {c.totalspent.toLocaleString('vi-VN')}
                    </span>
                  </td>
                )}

                {/* Điểm */}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-amber-600">{c.totalpoints}</span>
                </td>

                {/* Membership */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getMembershipStyle(
                      c.membership
                    )}`}
                  >
                    {c.membership || 'Thường'}
                  </span>
                </td>

                {/* Trạng thái */}
                <td className="px-4 py-3 text-center">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                      <XCircle className="w-3.5 h-3.5" />
                      Đang khóa
                    </span>
                  )}
                </td>

                {/* Đơn cuối */}
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-500">
                    {c.lastorderdate
                      ? new Date(c.lastorderdate).toLocaleDateString('vi-VN')
                      : '—'}
                  </span>
                </td>

                {/* Thao tác */}
                {canAct && (
                  <td className="px-4 py-3 text-center">
                    <CustomerActionMenu
                      customer={c}
                      isSuperAdmin={isSuperAdmin}
                      onEdit={onEdit}
                      onManagePoints={onManagePoints}
                      onToggleLock={onToggleLock}
                    />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
