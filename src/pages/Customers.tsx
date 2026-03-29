import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Users } from 'lucide-react'
import Toast from '@/components/Toast'
import CustomerStats from '@/components/customers/CustomerStats'
import CustomerTable, { type CustomerRow } from '@/components/customers/CustomerTable'
import {
  EditCustomerModal,
  AdjustPointsModal,
  ConfirmLockModal,
  type EditCustomerData,
  type AdjustPointsData,
} from '@/components/customers/CustomerModals'
import type { CustomerForAction } from '@/components/customers/CustomerActionMenu'

// ─── Types ────────────────────────────────────────────────────────────────────────────
interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────────
function getRoleFlags(rawRole: string) {
  const role = rawRole.toLowerCase()
  const isSuperAdmin = role.includes('super')
  const isBranchManager = !isSuperAdmin && (role.includes('manager') || role.includes('branch'))
  return { isSuperAdmin, isBranchManager }
}

function aggregateCustomers(customersData: any[], ordersData: any[]): CustomerRow[] {
  const map: Record<string, CustomerRow> = {}

  customersData.forEach((c: any) => {
    map[c.customerid] = {
      customerid: c.customerid,
      fullname: c.fullname || '',
      phone: c.phone || '',
      email: c.email || '',
      totalpoints: c.totalpoints || 0,
      membership: c.membership || 'Thường',
      birthday: c.birthday ?? null,
      ordercount: 0,
      totalspent: 0,
      lastorderdate: '',
      authid: c.authid || '',
      isactive: true, // default active; updated locally after lock/unlock actions
    }
  })

  ordersData.forEach((o: any) => {
    const row = map[o.customerid]
    if (!row) return
    row.ordercount++
    row.totalspent += o.totalamount || 0
    const t = new Date(o.orderdate).getTime()
    const last = row.lastorderdate ? new Date(row.lastorderdate).getTime() : 0
    if (t > last) row.lastorderdate = o.orderdate
  })

  return Object.values(map).sort((a, b) => {
    if (b.ordercount !== a.ordercount) return b.ordercount - a.ordercount
    return new Date(b.lastorderdate || 0).getTime() - new Date(a.lastorderdate || 0).getTime()
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  // ── Auth ──
  const rawRole = localStorage.getItem('userRole') || 'staff'
  const userBranchId = localStorage.getItem('userBranchId') || ''
  const { isSuperAdmin, isBranchManager } = getRoleFlags(rawRole)

  // ── Data state ──
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerRow[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])

  // ── Modal state ──
  const [editTarget, setEditTarget] = useState<EditCustomerData | null>(null)
  const [pointsTarget, setPointsTarget] = useState<AdjustPointsData | null>(null)
  const [lockTarget, setLockTarget] = useState<EditCustomerData | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [pointsLoading, setPointsLoading] = useState(false)
  const [lockLoading, setLockLoading] = useState(false)

  // ── Toast helper ──
  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString()
    setToastMessages(prev => [...prev, { id, message, type }])
    setTimeout(() => setToastMessages(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  // ── Load data ──
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const { supabase } = await import('@/utils/supabaseClient')

      const CUSTOMER_SELECT = 'customerid, authid, fullname, phone, email, totalpoints, membership, birthday'

      if (isSuperAdmin) {
        // Super Admin: all customers + all orders
        const [{ data: customersData, error: cErr }, { data: ordersData, error: oErr }] =
          await Promise.all([
            supabase.from('customers').select(CUSTOMER_SELECT),
            supabase.from('orders').select('customerid, totalamount, orderdate'),
          ])

        if (cErr) throw cErr
        if (oErr) throw oErr

        const list = aggregateCustomers(customersData ?? [], ordersData ?? [])
        setCustomers(list)
      } else {
        // Branch Manager / Staff: scope to branch
        if (!userBranchId) {
          setCustomers([])
          addToast('Không tìm thấy chi nhánh', 'error')
          return
        }

        const { data: ordersData, error: oErr } = await supabase
          .from('orders')
          .select('customerid, totalamount, orderdate')
          .eq('branchid', userBranchId)

        if (oErr) throw oErr

        const customerIds = [...new Set((ordersData ?? []).map((o: any) => o.customerid))]

        if (customerIds.length === 0) {
          setCustomers([])
          return
        }

        const { data: customersData, error: cErr } = await supabase
          .from('customers')
          .select(CUSTOMER_SELECT)
          .in('customerid', customerIds)

        if (cErr) throw cErr

        const list = aggregateCustomers(customersData ?? [], ordersData ?? [])
        setCustomers(list)
      }
    } catch (err) {
      console.error('[CustomersPage] loadCustomers:', err)
      addToast('Lỗi tải danh sách khách hàng', 'error')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, userBranchId, addToast])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  // ── Search filter ──
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredCustomers(customers)
    } else {
      const q = searchText.toLowerCase()
      setFilteredCustomers(
        customers.filter(
          c =>
            c.fullname.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        )
      )
    }
  }, [searchText, customers])

  // ─── Action Handlers ────────────────────────────────────────────────────────

  const handleOpenEdit = (c: CustomerForAction) => {
    const full = customers.find(x => x.customerid === c.customerid)
    if (full) setEditTarget({ customerid: full.customerid, fullname: full.fullname, phone: full.phone, email: full.email, isactive: full.isactive })
  }

  const handleSubmitEdit = async (data: { fullname: string; phone: string; email: string }) => {
    if (!editTarget) return
    try {
      setEditLoading(true)
      const { supabase } = await import('@/utils/supabaseClient')
      const { error } = await supabase
        .from('customers')
        .update({ fullname: data.fullname, phone: data.phone, email: data.email })
        .eq('customerid', editTarget.customerid)
      if (error) throw error

      setCustomers(prev =>
        prev.map(c =>
          c.customerid === editTarget.customerid
            ? { ...c, fullname: data.fullname, phone: data.phone, email: data.email }
            : c
        )
      )
      addToast('Cập nhật thông tin thành công', 'success')
      setEditTarget(null)
    } catch (err) {
      console.error('[Edit]', err)
      addToast('Lỗi cập nhật thông tin', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleOpenPoints = (c: CustomerForAction) => {
    const full = customers.find(x => x.customerid === c.customerid)
    if (full) setPointsTarget({ customerid: full.customerid, fullname: full.fullname, totalpoints: full.totalpoints })
  }

  const handleSubmitPoints = async (delta: number, reason: string) => {
    if (!pointsTarget) return
    try {
      setPointsLoading(true)
      const { supabase } = await import('@/utils/supabaseClient')
      const newPoints = pointsTarget.totalpoints + delta

      const { error: updateErr } = await supabase
        .from('customers')
        .update({ totalpoints: newPoints })
        .eq('customerid', pointsTarget.customerid)
      if (updateErr) throw updateErr

      // Ghi lịch sử điểm
      await supabase.from('pointhistory').insert({
        customerid: pointsTarget.customerid,
        pointchange: delta,
        type: 'adjustment',
        description: reason,
        createddate: new Date().toISOString(),
      })

      setCustomers(prev =>
        prev.map(c =>
          c.customerid === pointsTarget.customerid ? { ...c, totalpoints: newPoints } : c
        )
      )
      addToast(
        `${delta > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(delta)} điểm thành công`,
        'success'
      )
      setPointsTarget(null)
    } catch (err) {
      console.error('[Points]', err)
      addToast('Lỗi điều chỉnh điểm', 'error')
    } finally {
      setPointsLoading(false)
    }
  }

  const handleOpenLock = (c: CustomerForAction) => {
    const full = customers.find(x => x.customerid === c.customerid)
    if (full) setLockTarget({ customerid: full.customerid, fullname: full.fullname, phone: full.phone, email: full.email, authid: full.authid, isactive: full.isactive })
  }

  const handleConfirmLock = async () => {
    if (!lockTarget) return
    const wantToLock = lockTarget.isactive !== false // true = đang active → muốn khóa

    if (!lockTarget.authid) {
      addToast('Khách hàng này chưa liên kết tài khoản đăng nhập', 'error')
      setLockTarget(null)
      return
    }

    try {
      setLockLoading(true)
      const { authAdminService } = await import('@/services/authAdminService')
      await authAdminService.updateAccountStatus({
        userId: lockTarget.authid,
        isBanned: wantToLock,
      })

      setCustomers(prev =>
        prev.map(c =>
          c.customerid === lockTarget.customerid ? { ...c, isactive: !wantToLock } : c
        )
      )
      addToast(wantToLock ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', 'success')
      setLockTarget(null)
    } catch (err) {
      console.error('[Lock]', err)
      addToast('Lỗi thay đổi trạng thái tài khoản', 'error')
    } finally {
      setLockLoading(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Danh sách khách hàng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý và theo dõi thông tin khách hàng
            {!isSuperAdmin && userBranchId ? ' tại chi nhánh của bạn' : ' toàn hệ thống'}
          </p>
        </div>
        <button
          onClick={loadCustomers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* ── Stats (top) ── */}
      <CustomerStats
        customers={customers}
        showFinancial={isSuperAdmin || isBranchManager}
      />

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          {customers.length > 0 && (
            <p className="text-sm text-slate-400 whitespace-nowrap">
              {filteredCustomers.length} / {customers.length} khách hàng
            </p>
          )}
        </div>

        {/* Table */}
        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          isBranchManager={isBranchManager}
          onEdit={handleOpenEdit}
          onManagePoints={handleOpenPoints}
          onToggleLock={handleOpenLock}
        />
      </div>

      {/* ── Modals ── */}
      <EditCustomerModal
        show={editTarget !== null}
        customer={editTarget}
        loading={editLoading}
        onClose={() => setEditTarget(null)}
        onSubmit={handleSubmitEdit}
      />

      <AdjustPointsModal
        show={pointsTarget !== null}
        customer={pointsTarget}
        loading={pointsLoading}
        onClose={() => setPointsTarget(null)}
        onSubmit={handleSubmitPoints}
      />

      <ConfirmLockModal
        show={lockTarget !== null}
        customer={lockTarget}
        loading={lockLoading}
        onClose={() => setLockTarget(null)}
        onConfirm={handleConfirmLock}
      />

      {/* ── Toast ── */}
      {toastMessages.map(t => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => setToastMessages(prev => prev.filter(x => x.id !== t.id))}
        />
      ))}
    </div>
  )
}
