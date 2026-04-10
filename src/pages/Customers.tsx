import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Users } from 'lucide-react'
import Toast from '@/components/Toast'
import CustomerStats from '@/components/customers/CustomerStats'
import CustomerTable, { type CustomerRow } from '@/components/customers/CustomerTable'
import {
  EditCustomerModal,
  AdjustPointsModal,
  type EditCustomerData,
  type AdjustPointsData,
} from '@/components/customers/CustomerModals'
import type { CustomerForAction } from '@/components/customers/CustomerActionMenu'
import { supabase } from '@/utils/supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────────────
interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

interface RawCustomer {
  customerid: number | string
  authid: string | null
  fullname: string
  phone: string
  email: string
  totalpoints: number
  membership: string
  birthday: string | null
}

interface RawOrder {
  customerid: number | string
  finalamount: number
  orderdate: string
}

// ─── Helper Functions ────────────────────────────────────────────────────────────────────

function getRoleFlags(rawRole: string) {
  const role = rawRole.toLowerCase()
  const isSuperAdmin = role.includes('super')
  const isBranchManager = !isSuperAdmin && (role.includes('manager') || role.includes('branch'))
  return { isSuperAdmin, isBranchManager }
}

/**
 * Convert raw customer to display row
 */
function toCustomerRow(c: RawCustomer): CustomerRow {
  return {
    customerid: String(c.customerid),
    fullname: c.fullname || '(Không có tên)',
    phone: c.phone || '',
    email: c.email || '',
    totalpoints: c.totalpoints || 0,
    membership: c.membership || 'Thường',
    birthday: c.birthday ?? null,
    ordercount: 0,
    totalspent: 0,
    lastorderdate: '',
    authid: c.authid || '',
  }
}

/**
 * Aggregate customer data with order statistics
 * SAFE approach: no null checks in .in() calls
 */
function aggregateData(customersData: RawCustomer[], ordersData: RawOrder[]): CustomerRow[] {
  const map: Record<string | number, CustomerRow> = {}

  // Step 1: Initialize all customers
  customersData.forEach((c) => {
    map[c.customerid] = toCustomerRow(c)
  })

  // Step 2: Add order statistics
  ordersData.forEach((order) => {
    if (!order.customerid || !map[order.customerid]) return

    const row = map[order.customerid]
    row.ordercount = (row.ordercount || 0) + 1
    row.totalspent = (row.totalspent || 0) + (order.finalamount || 0)

    // Update last order date (latest)
    if (!row.lastorderdate || new Date(order.orderdate) > new Date(row.lastorderdate)) {
      row.lastorderdate = order.orderdate
    }
  })

  // Step 3: Sort by order count (descending), then by latest order date
  return Object.values(map).sort((a, b) => {
    if (b.ordercount !== a.ordercount) return b.ordercount - a.ordercount
    const dateA = a.lastorderdate ? new Date(a.lastorderdate).getTime() : 0
    const dateB = b.lastorderdate ? new Date(b.lastorderdate).getTime() : 0
    return dateB - dateA
  })
}

// ─── Main Component ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  // ── Auth & Permissions ──
  const rawRole = localStorage.getItem('userRole') || 'staff'
  const userBranchId = localStorage.getItem('userBranchId')
  const userBranchIdNum = userBranchId ? Number(userBranchId) : null

  const { isSuperAdmin, isBranchManager } = getRoleFlags(rawRole)

  // ── Data State ──
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerRow[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])

  // ── Branch Info ──
  const [branchName, setBranchName] = useState<string | null>(null)

  // ── Modal States ──
  const [editTarget, setEditTarget] = useState<EditCustomerData | null>(null)
  const [pointsTarget, setPointsTarget] = useState<AdjustPointsData | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [pointsLoading, setPointsLoading] = useState(false)

  // ── Toast Helper ──
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToastMessages((prev) => [...prev, { id, message, type }])
    const timer = setTimeout(
      () => setToastMessages((prev) => prev.filter((t) => t.id !== id)),
      3000
    )
    return () => clearTimeout(timer)
  }, [])

  // ── Load Branch Name (for Manager) ──
  const loadBranchName = useCallback(async () => {
    if (!isBranchManager || !userBranchIdNum) return

    try {
      const { data, error } = await supabase
        .from('branches')
        .select('name')
        .eq('branchid', userBranchIdNum)
        .single()

      if (error) {
        console.warn('[Customers] Failed to load branch name:', error)
        return
      }

      if (data) {
        setBranchName(data.name)
      }
    } catch (err) {
      console.error('[Customers - loadBranchName]:', err)
    }
  }, [isBranchManager, userBranchIdNum])

  // ── Main Load Function ──
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)

      if (isSuperAdmin) {
        // ═══════════════════════════════════════════════════════════════════════════════
        // SUPER ADMIN: Fetch ALL customers + ALL orders
        // ═══════════════════════════════════════════════════════════════════════════════
        const [{ data: customersData, error: cErr }, { data: ordersData, error: oErr }] =
          await Promise.all([
            supabase.from('customers').select('customerid, authid, fullname, phone, email, totalpoints, membership, birthday'),
            supabase.from('orders').select('customerid, finalamount, orderdate'),
          ])

        if (cErr) {
          console.error('[Customers - Super Admin] Customer fetch error:', cErr)
          throw new Error(`Lỗi tải khách hàng: ${cErr.message}`)
        }

        if (oErr) {
          console.error('[Customers - Super Admin] Orders fetch error:', oErr)
          throw new Error(`Lỗi tải đơn hàng: ${oErr.message}`)
        }

        const aggregated = aggregateData(
          (customersData as RawCustomer[]) || [],
          (ordersData as RawOrder[]) || []
        )
        setCustomers(aggregated)
      } else if (isBranchManager && userBranchIdNum && userBranchIdNum > 0) {
        // ═══════════════════════════════════════════════════════════════════════════════
        // BRANCH MANAGER: 2-STEP SAFE FETCH
        // Step 1: Get orders of THIS branch ONLY
        // Step 2: Extract unique customerIds
        // Step 3: Fetch customer details for those IDs
        // ═══════════════════════════════════════════════════════════════════════════════

        // STEP 1: Get orders from this branch (filter OUT null customerids)
        const { data: ordersData, error: oErr } = await supabase
          .from('orders')
          .select('customerid, finalamount, orderdate')
          .eq('branchid', userBranchIdNum)
          .not('customerid', 'is', null)

        if (oErr) {
          console.error('[Customers - Manager Step 1] Orders fetch error:', oErr)
          throw new Error(`Lỗi tải đơn hàng: ${oErr.message}`)
        }

        const orders = (ordersData as RawOrder[]) || []

        // STEP 2: Extract unique customer IDs (safe: check if customerid exists)
        const customerSet = new Set<string | number>()
        orders.forEach((o) => {
          if (o.customerid) {
            customerSet.add(o.customerid)
          }
        })
        const customerIds = Array.from(customerSet)

        // If no customers found, return empty list (avoid calling .in() with empty array)
        if (customerIds.length === 0) {
          setCustomers([])
          return
        }

        // STEP 3: Fetch customer details for these IDs (SAFE: only call if customerIds has items)
        const { data: customersData, error: cErr } = await supabase
          .from('customers')
          .select('customerid, authid, fullname, phone, email, totalpoints, membership, birthday')
          .in('customerid', customerIds)

        if (cErr) {
          console.error('[Customers - Manager Step 3] Customer fetch error:', cErr)
          throw new Error(`Lỗi tải thông tin khách hàng: ${cErr.message}`)
        }

        // STEP 4: Aggregate data
        const aggregated = aggregateData(
          (customersData as RawCustomer[]) || [],
          orders
        )
        setCustomers(aggregated)
      } else {
        setCustomers([])
        if (!isBranchManager) {
          addToast('Bạn không có quyền truy cập trang này', 'error')
        } else {
          addToast('Chi nhánh đăng nhập không xác định', 'error')
        }
      }
    } catch (err: any) {
      console.error('[Customers - loadCustomers]:', err)
      addToast(err.message || 'Lỗi tải danh sách khách hàng', 'error')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, isBranchManager, userBranchIdNum, addToast])

  // ── Load Branch Name on Mount ──
  useEffect(() => {
    loadBranchName()
  }, [loadBranchName])

  // ── Load Customers on Mount & Permission Change ──
  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // ── Search Filter ──
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredCustomers(customers)
    } else {
      const q = searchText.toLowerCase()
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.fullname.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        )
      )
    }
  }, [searchText, customers])

  // ─── Action Handlers ────────────────────────────────────────────────────────

  const handleOpenEdit = (c: CustomerForAction) => {
    const full = customers.find((x) => x.customerid === c.customerid)
    if (full) {
      setEditTarget({
        customerid: String(full.customerid),
        fullname: full.fullname,
        phone: full.phone,
        email: full.email,
      })
    }
  }

  const handleSubmitEdit = async (data: { fullname: string; phone: string; email: string }) => {
    if (!editTarget) return
    try {
      setEditLoading(true)
      const { error } = await supabase
        .from('customers')
        .update({
          fullname: data.fullname,
          phone: data.phone,
          email: data.email,
        })
        .eq('customerid', editTarget.customerid)

      if (error) throw error

      setCustomers((prev) =>
        prev.map((c) =>
          c.customerid === editTarget.customerid
            ? { ...c, fullname: data.fullname, phone: data.phone, email: data.email }
            : c
        )
      )
      addToast('Cập nhật thông tin thành công')
      setEditTarget(null)
    } catch (err) {
      console.error('[Edit]:', err)
      addToast('Lỗi cập nhật thông tin', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleOpenPoints = (c: CustomerForAction) => {
    const full = customers.find((x) => x.customerid === c.customerid)
    if (full) {
      setPointsTarget({
        customerid: String(full.customerid),
        fullname: full.fullname,
        totalpoints: full.totalpoints,
      })
    }
  }

  const handleSubmitPoints = async (delta: number, reason: string) => {
    if (!pointsTarget) return
    try {
      setPointsLoading(true)
      const newPoints = Math.max(0, pointsTarget.totalpoints + delta)

      const { error: updateErr } = await supabase
        .from('customers')
        .update({ totalpoints: newPoints })
        .eq('customerid', pointsTarget.customerid)

      if (updateErr) throw updateErr

      // Record point history
      await supabase.from('pointhistory').insert({
        customerid: pointsTarget.customerid,
        pointchange: delta,
        type: 'adjustment',
        description: reason,
        createddate: new Date().toISOString(),
      })

      setCustomers((prev) =>
        prev.map((c) =>
          c.customerid === pointsTarget.customerid ? { ...c, totalpoints: newPoints } : c
        )
      )

      addToast(`${delta > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(delta)} điểm thành công`)
      setPointsTarget(null)
    } catch (err) {
      console.error('[Points]:', err)
      addToast('Lỗi điều chỉnh điểm', 'error')
    } finally {
      setPointsLoading(false)
    }
  }



  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* ── Toast Container ── */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toastMessages.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToastMessages(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            {isSuperAdmin
              ? 'Danh sách khách hàng'
              : `Khách hàng chi nhánh${branchName ? `: ${branchName}` : ''}`}
          </h1>
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

      {/* ── Stats ── */}
      <CustomerStats
        customers={customers}
        showFinancial={isSuperAdmin || isBranchManager}
      />

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          isBranchManager={isBranchManager}
          onEdit={handleOpenEdit}
          onManagePoints={handleOpenPoints}
        />
      </div>

      {/* ── Modals ── */}
      {editTarget && (
        <EditCustomerModal
          show={!!editTarget}
          customer={editTarget}
          loading={editLoading}
          onClose={() => setEditTarget(null)}
          onSubmit={handleSubmitEdit}
        />
      )}

      {pointsTarget && (
        <AdjustPointsModal
          show={!!pointsTarget}
          customer={pointsTarget}
          loading={pointsLoading}
          onClose={() => setPointsTarget(null)}
          onSubmit={handleSubmitPoints}
        />
      )}
    </div>
  )
}
