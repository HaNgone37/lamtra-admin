import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  DollarSign,
  Flame,
  BarChart3,
  ListOrdered,
  AlertCircle,
  Coffee,
  PackageX,
  RefreshCw,
  Play,
  CheckSquare,
  Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { orderService } from '@/services/orderService'
import { branchService } from '@/services/branchService'
import { supabase } from '@/utils/supabaseClient'
import { Order, OrderDetail, Product, Branch } from '@/types'
import DateRangeFilter from '@/components/DateRangeFilter'

// ============================================================================
// UTILITY: PLAY BEEP SOUND
// ============================================================================
const playBeepSound = () => {
  try {
    const ctx = new AudioContext()
    const beepTimes = [0, 0.3, 0.6]
    beepTimes.forEach(startTime => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 960
      osc.type = 'square'
      gain.gain.setValueAtTime(0.35, ctx.currentTime + startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.2)
      osc.start(ctx.currentTime + startTime)
      osc.stop(ctx.currentTime + startTime + 0.2)
    })
  } catch (_) {}
}

// ============================================================================
// UTILITY: Strip trailing % and format sugar/ice level
// ============================================================================
const formatLevel = (raw: number | string | null | undefined): string | null => {
  if (raw === null || raw === undefined) return null
  // Strip any existing % sign that might come from DB
  const val = String(raw).replace(/%/g, '').trim()
  if (val === '') return null
  return val
}

// ============================================================================
// TYPES cho Staff Dashboard
// ============================================================================
interface StaffOrderItem {
  orderdetailid: number
  productid: number | string
  productname: string
  sizename: string
  quantity: number
  sugarlevel: number | string
  icelevel: number | string
}

interface StaffOrder {
  orderid: string
  orderdate: string
  status: 'Chờ xác nhận' | 'Đang làm' | 'Đang giao' | 'Hoàn thành' | 'Hủy'
  finalamount: number
  items: StaffOrderItem[]
}

// ============================================================================
// KDS ORDER CARD COMPONENT
// ============================================================================
interface KDSOrderCardProps {
  order: StaffOrder
  onUpdateStatus: (orderId: string, newStatus: 'Chờ xác nhận' | 'Đang làm' | 'Đang giao' | 'Hoàn thành') => Promise<void>
  isUpdating: boolean
}

const KDSOrderCard: React.FC<KDSOrderCardProps> = ({ order, onUpdateStatus, isUpdating }) => {
  const [ageMin, setAgeMin] = useState(() => {
    return Math.floor((new Date().getTime() - new Date(order.orderdate).getTime()) / 60000)
  })

  // Cập nhật tuổi đơn mỗi 30 giây
  useEffect(() => {
    const recalc = () => {
      setAgeMin(Math.floor((new Date().getTime() - new Date(order.orderdate).getTime()) / 60000))
    }
    const timer = setInterval(recalc, 30000)
    return () => clearInterval(timer)
  }, [order.orderdate])

  const isWaiting = order.status === 'Chờ xác nhận'
  const isInProgress = order.status === 'Đang làm'
  const isShipping = order.status === 'Đang giao'

  // Urgency: green < 5 min, yellow 5-10 min, red >= 10 min
  const urgency: 'green' | 'yellow' | 'red' =
    ageMin < 5 ? 'green' : ageMin < 10 ? 'yellow' : 'red'

  const cardStyle: React.CSSProperties = {
    borderRadius: 24,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow:
      urgency === 'red'
        ? '0 4px 16px rgba(255,68,68,0.12), 0 1px 3px rgba(0,0,0,0.08)'
        : urgency === 'yellow'
        ? '0 4px 16px rgba(255,153,0,0.10), 0 1px 3px rgba(0,0,0,0.06)'
        : '0 4px 16px rgba(0,168,105,0.10), 0 1px 3px rgba(0,0,0,0.06)',
    border: `3px solid ${
      urgency === 'red' ? '#FF4444' : urgency === 'yellow' ? '#FF9900' : '#00A869'
    }`,
    backgroundColor: urgency === 'red' ? '#FFFAFB' : urgency === 'yellow' ? '#FFFDF9' : '#F8FDF9',
    maxHeight: '520px',
  }

  const headerBg =
    urgency === 'red'
      ? 'linear-gradient(135deg, #FF4444 0%, #E63946 100%)'
      : urgency === 'yellow'
      ? 'linear-gradient(135deg, #FF9900 0%, #FB8500 100%)'
      : 'linear-gradient(135deg, #06A77D 0%, #00A869 100%)'

  const shortId = `LT-${order.orderid.substring(0, 6).toUpperCase()}`
  const timeStr = new Date(order.orderdate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: -20 }}
      animate={
        urgency === 'red'
          ? { opacity: 1, scale: 1, y: 0, x: [0, -4, 4, -4, 4, 0] }
          : { opacity: 1, scale: 1, y: 0 }
      }
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{
        duration: 0.35,
        ease: 'easeOut',
        x: urgency === 'red' ? { duration: 0.5, repeat: Infinity, repeatDelay: 3 } : {},
      }}
      style={cardStyle}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          background: headerBg,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '0.04em',
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            #{shortId}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Clock size={13} color="rgba(255,255,255,0.85)" />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>
              {timeStr}
            </span>
            <span
              style={{
                backgroundColor: 'rgba(0,0,0,0.25)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
              }}
            >
              {ageMin < 1 ? 'Vừa đặt' : `${ageMin} phút trước`}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span
          style={{
            backgroundColor: isInProgress ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 99,
            border: '1px solid rgba(255,255,255,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {isWaiting ? '⏳ Chờ' : '🔥 Đang làm'}
        </span>
      </div>

      {/* ── BODY: Items ── */}
      <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {order.items.length === 0 && (
          <p style={{ color: '#8F9CB8', fontSize: 13, fontStyle: 'italic' }}>Đang tải món...</p>
        )}
        {order.items.map((item) => {
          const sugarVal = formatLevel(item.sugarlevel)
          const iceVal = formatLevel(item.icelevel)
          return (
            <div
              key={item.orderdetailid}
              style={{
                backgroundColor: '#FAFAFA',
                borderRadius: 14,
                padding: '10px 12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                border: '1px solid #f5d5e0',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              {/* Quantity - big and bold */}
              <div
                style={{
                  minWidth: 40,
                  height: 40,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  flexShrink: 0,
                  background: urgency === 'red' ? '#FF4444' : urgency === 'yellow' ? '#FF9900' : '#f06192',
                }}
              >
                {item.quantity}
              </div>

              <div style={{ flex: 1 }}>
                {/* Product name - ALL CAPS, heavy */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 900,
                    color: '#1A202C',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1.3,
                  }}
                >
                  {item.productname}
                </p>

                {/* Tags row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {item.sizename && (
                    <span
                      style={{
                        backgroundColor: '#EBF3FF',
                        color: '#4318FF',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 99,
                        border: '1px solid #D1E0FF',
                      }}
                    >
                      Size {item.sizename}
                    </span>
                  )}
                  {sugarVal !== null && (
                    <span
                      style={{
                        backgroundColor: '#FFF3DC',
                        color: '#B45309',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 99,
                        border: '1px solid #FDDEA0',
                      }}
                    >
                      Đường: {sugarVal}%
                    </span>
                  )}
                  {iceVal !== null && (
                    <span
                      style={{
                        backgroundColor: '#E0F2FE',
                        color: '#0369A1',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 99,
                        border: '1px solid #BAE6FD',
                      }}
                    >
                      Đá: {iceVal}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── FOOTER: Action button (full width) ── */}
      <div style={{ padding: '10px 14px 14px' }}>
        {isWaiting && (
          <button
            onClick={() => onUpdateStatus(order.orderid, 'Đang làm')}
            disabled={isUpdating}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 14,
              border: 'none',
              background: isUpdating ? '#CBD5E0' : 'linear-gradient(135deg, #f06192 0%, #E84D7A 100%)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 800,
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s',
              opacity: isUpdating ? 0.7 : 1,
              letterSpacing: '0.02em',
              boxShadow: isUpdating ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { if (!isUpdating) e.currentTarget.style.opacity = '1' }}
          >
            {isUpdating ? (
              <RefreshCw size={18} style={{ animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <Play size={18} />
            )}
            {isUpdating ? 'Đang cập nhật...' : 'NHẬN ĐƠN'}
          </button>
        )}
        {isInProgress && (
          <button
            onClick={() => onUpdateStatus(order.orderid, 'Đang giao')}
            disabled={isUpdating}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 14,
              border: 'none',
              background: isUpdating ? '#CBD5E0' : 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 800,
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s',
              opacity: isUpdating ? 0.7 : 1,
              letterSpacing: '0.02em',
              boxShadow: isUpdating ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { if (!isUpdating) e.currentTarget.style.opacity = '1' }}
          >
            {isUpdating ? (
              <RefreshCw size={18} style={{ animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <Play size={18} />
            )}
            {isUpdating ? 'Đang cập nhật...' : 'GIAO HÀNG'}
          </button>
        )}
        {isShipping && (
          <button
            onClick={() => onUpdateStatus(order.orderid, 'Hoàn thành')}
            disabled={isUpdating}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 14,
              border: 'none',
              background: isUpdating ? '#CBD5E0' : 'linear-gradient(135deg, #06A77D 0%, #00A869 100%)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 800,
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s',
              opacity: isUpdating ? 0.7 : 1,
              letterSpacing: '0.02em',
              boxShadow: isUpdating ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { if (!isUpdating) e.currentTarget.style.opacity = '1' }}
          >
            {isUpdating ? (
              <RefreshCw size={18} style={{ animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <CheckSquare size={18} />
            )}
            {isUpdating ? 'Đang cập nhật...' : 'HOÀN THÀNH'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// NEWORDER TOAST NOTIFICATION
// ============================================================================
interface NewOrderToast {
  id: string
  orderId: string
}

// ============================================================================
// STAFF DASHBOARD COMPONENT - Kitchen Display System (KDS)
// ============================================================================
const StaffDashboard: React.FC = () => {
  const userBranchIdStr = localStorage.getItem('userBranchId')
  const userBranchId = userBranchIdStr ? Number(userBranchIdStr) : null

  const [branchName, setBranchName] = useState('')
  const [pendingOrders, setPendingOrders] = useState<StaffOrder[]>([])
  const [stats, setStats] = useState({ cho: 0, dangLam: 0, xongHomNay: 0, hetHang: 0 })
  const [loading, setLoading] = useState(true)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [newOrderToasts, setNewOrderToasts] = useState<NewOrderToast[]>([])
  const isFirstLoad = useRef(true)

  // ---- Load branch name ----
  useEffect(() => {
    const loadBranch = async () => {
      if (!userBranchId) return
      try {
        const b = await branchService.getBranchById(String(userBranchId))
        if (b) setBranchName(b.name)
      } catch (_) {}
    }
    loadBranch()
  }, [userBranchId])

  // ---- Load Active Orders + Stats ----
  const loadData = useCallback(async (silent = false) => {
    if (!userBranchId) return
    if (!silent) setLoading(true)
    try {
      // 1. Orders đang hoạt động: Chờ + Đang làm
      const { data: activeOrdersRaw, error: activeErr } = await supabase
        .from('orders')
        .select('orderid, orderdate, status, finalamount')
        .eq('branchid', userBranchId)
        .in('status', ['Chờ xác nhận', 'Đang làm', 'Đang giao'])
        .order('orderdate', { ascending: true })

      if (activeErr) throw activeErr

      const activeOrders: StaffOrder[] = []

      if (activeOrdersRaw && activeOrdersRaw.length > 0) {
        const orderIds = activeOrdersRaw.map((o: any) => o.orderid)
        // 2. Lấy order items với JOIN products + sizes
        const { data: detailsRaw } = await supabase
          .from('orderdetails')
          .select('orderdetailid, orderid, productid, sizeid, quantity, sugarlevel, icelevel, products(name), sizes(name)')
          .in('orderid', orderIds)

        const detailsMap: Record<string, StaffOrderItem[]> = {}
        if (detailsRaw) {
          detailsRaw.forEach((d: any) => {
            if (!detailsMap[d.orderid]) detailsMap[d.orderid] = []
            detailsMap[d.orderid].push({
              orderdetailid: d.orderdetailid,
              productid: d.productid,
              productname: d.products?.name || 'Unknown',
              sizename: d.sizes?.name || '',
              quantity: d.quantity,
              sugarlevel: d.sugarlevel ?? 100,
              icelevel: d.icelevel ?? 100
            })
          })
        }

        activeOrdersRaw.forEach((o: any) => {
          activeOrders.push({
            orderid: o.orderid,
            orderdate: o.orderdate,
            status: o.status,
            finalamount: o.finalamount,
            items: detailsMap[o.orderid] || []
          })
        })
      }

      setPendingOrders(activeOrders)

      // 3. Stats hôm nay
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('status')
        .eq('branchid', userBranchId)
        .gte('orderdate', todayStart.toISOString())

      const cho = (todayOrders || []).filter((o: any) => o.status === 'Chờ xác nhận').length
      const dangLam = (todayOrders || []).filter((o: any) => o.status === 'Đang làm').length
      const xongHomNay = (todayOrders || []).filter((o: any) => o.status === 'Hoàn thành').length

      // 4. Số món hết hàng tại quán
      const { data: hetHangData } = await supabase
        .from('branchproductstatus')
        .select('productid')
        .eq('branchid', userBranchId)
        .eq('status', 'Hết món')

      setStats({ cho, dangLam, xongHomNay, hetHang: hetHangData?.length || 0 })
    } catch (err) {
      console.error('StaffDashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [userBranchId])

  // ---- Initial load + Realtime subscription ----
  useEffect(() => {
    loadData()

    const channel = supabase
      .channel(`staff-orders-${userBranchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `branchid=eq.${userBranchId}`
      }, (payload: any) => {
        if (!isFirstLoad.current) {
          playBeepSound()
          // Show toast notification
          const toastId = Date.now().toString()
          const newOrderId = payload?.new?.orderid || ''
          setNewOrderToasts(prev => [...prev, { id: toastId, orderId: newOrderId }])
          setTimeout(() => {
            setNewOrderToasts(prev => prev.filter(t => t.id !== toastId))
          }, 5000)
        }
        loadData(true)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `branchid=eq.${userBranchId}`
      }, () => {
        loadData(true)
      })
      .subscribe()

    isFirstLoad.current = false

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadData, userBranchId])

  // ---- Update order status ----
  const handleUpdateStatus = async (orderId: string, newStatus: 'Chờ xác nhận' | 'Đang làm' | 'Đang giao' | 'Hoàn thành') => {
    setUpdatingIds(prev => new Set([...prev, orderId]))
    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      await loadData(true)
    } catch (err) {
      console.error('Update status error:', err)
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(orderId); return s })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin mx-auto mb-4" style={{ borderTopColor: '#f06192' }} />
          <p style={{ color: '#8F9CB8' }}>Đang tải KDS...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      {/* ── NEW ORDER TOAST NOTIFICATIONS ── */}
      <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {newOrderToasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 120, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                backgroundColor: '#f06192',
                color: '#FFFFFF',
                padding: '14px 20px',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 8px 32px rgba(240,97,146,0.3)',
                minWidth: 280,
              }}
            >
              <Bell size={22} />
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>🛎️ Đơn hàng mới!</p>
                {toast.orderId && (
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, opacity: 0.85 }}>
                    #{`LT-${toast.orderId.substring(0, 6).toUpperCase()}`}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f5d5e0' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#f06192', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Coffee size={26} />
            KDS — Trạm Pha Chế{branchName ? `: ${branchName}` : ''}
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#8F9CB8', fontSize: 14 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => loadData(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 14, border: '1px solid #f5d5e0',
            backgroundColor: '#FFFFFF', color: '#f06192', fontWeight: 700,
            fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF5FA'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      {/* ── STATS BAR (4 cards) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Đơn chờ', value: stats.cho, color: '#f06192', icon: <AlertCircle size={20} /> },
          { label: 'Đang làm', value: stats.dangLam, color: '#FF9900', icon: <Coffee size={20} /> },
          { label: 'Xong hôm nay', value: stats.xongHomNay, color: '#00A869', icon: <CheckCircle size={20} /> },
          { label: 'Hết hàng', value: stats.hetHang, color: stats.hetHang > 0 ? '#FF4444' : '#8F9CB8', icon: <PackageX size={20} /> },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1.5px solid #f5d5e0',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8F9CB8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
              <p style={{ margin: '6px 0 0 0', fontSize: 36, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', backgroundColor: s.color + '15', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── LIVE ORDER BOARD TITLE ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <ListOrdered size={22} color="#f06192" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#2B3674' }}>Đơn Hàng Đang Chờ</h2>
        {pendingOrders.length > 0 && (
          <span style={{ marginLeft: 'auto', backgroundColor: '#FFE5E5', color: '#FF4444', fontWeight: 800, fontSize: 13, padding: '3px 12px', borderRadius: 99 }}>
            {pendingOrders.length} đơn
          </span>
        )}
        {/* Urgency legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: pendingOrders.length > 0 ? 12 : 'auto' }}>
          {[
            { color: '#00A869', label: '< 5 phút' },
            { color: '#FF9900', label: '5-10 phút' },
            { color: '#FF4444', label: '> 10 phút' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: l.color }} />
              <span style={{ fontSize: 12, color: '#8F9CB8', fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ORDER GRID ── */}
      {pendingOrders.length === 0 ? (
        <div
          style={{
            textAlign: 'center', padding: '80px 20px', backgroundColor: '#FFFFFF',
            borderRadius: 24, border: '2px dashed #f5d5e0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <CheckCircle size={64} color="#06A77D" style={{ opacity: 0.4, marginBottom: 16 }} />
          <p style={{ fontSize: 22, fontWeight: 800, color: '#2B3674', margin: 0 }}>Tất cả đơn đã xong! 🎉</p>
          <p style={{ fontSize: 14, color: '#8F9CB8', marginTop: 8 }}>Không có đơn nào đang chờ xử lý</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 18,
            alignItems: 'start',
          }}
        >
          <AnimatePresence mode="popLayout">
            {pendingOrders.map(order => (
              <KDSOrderCard
                key={order.orderid}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                isUpdating={updatingIds.has(order.orderid)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

interface DateRange {
  startDate: string
  endDate: string
}

interface TopProduct {
  productid: number | string
  name: string
  imageurl: string
  quantity: number
  rank: number
}

// ============================================================================
// CARD COMPONENT - Modern Horizon UI Style
// ============================================================================
const ModernCard: React.FC<{
  children: React.ReactNode
  title?: React.ReactNode
  className?: string
}> = ({ children, title, className = '' }) => (
  <div
    className={`rounded-[20px] p-6 bg-white ${className}`}
    style={{
      boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
      border: '1px solid #E0E5F2'
    }}
  >
    {title && (
      <h3 className="text-lg font-bold mb-6" style={{ color: '#2B3674' }}>
        {title}
      </h3>
    )}
    {children}
  </div>
)

// ============================================================================
// ICON CIRCLE - Icon in circular background with opacity 10%
// ============================================================================
const IconCircle: React.FC<{
  icon: React.ReactNode
  color: string
}> = ({ icon, color }) => {
  const opacityColor = color + '19' // Add 10% opacity (19 in hex ≈ 10%)
  return (
    <div
      className="rounded-full p-3 flex items-center justify-center"
      style={{ backgroundColor: opacityColor }}
    >
      <div style={{ color }}>
        {icon}
      </div>
    </div>
  )
}

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================
const StatsCard: React.FC<{
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}> = ({ label, value, icon, color }) => (
  <ModernCard>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium mb-2" style={{ color: '#8F9CB8' }}>
          {label}
        </p>
        <p className="text-3xl font-bold" style={{ color: '#2B3674' }}>
          {value}
        </p>
      </div>
      <IconCircle icon={icon} color={color} />
    </div>
  </ModernCard>
)

// ============================================================================
// WRAPPER - Role Router (tách ra để không vi phạm React Rules of Hooks)
// ============================================================================
export const Dashboard: React.FC = () => {
  const rawRole = localStorage.getItem('userRole') || ''
  const roleLower = rawRole.toLowerCase().trim()
  if (roleLower === 'staff') {
    return <StaffDashboard />
  }
  return <AdminManagerDashboard />
}

// ============================================================================
// MAIN DASHBOARD COMPONENT (chỉ dành cho Admin/Manager)
// ============================================================================
const AdminManagerDashboard: React.FC = () => {

  // ========== STATE MANAGEMENT ==========
  const [orders, setOrders] = useState<Order[]>([])
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }
  })

  // ========== RBAC & USER INFO ==========
  const userRole = localStorage.getItem('userRole') || ''
  const roleLower = userRole.toLowerCase().trim()
  const userBranchIdStr = localStorage.getItem('userBranchId')
  const userBranchId = userBranchIdStr ? Number(userBranchIdStr) : null

  const isSuperAdmin = roleLower.includes('super') || roleLower === 'admin'
  const isManager = roleLower.includes('manager')
  const isStaff = roleLower === 'staff'

  // Determine if should filter by branch
  const shouldFilterByBranch = !isSuperAdmin && userBranchId

  // ========== FETCH DATA ==========
  useEffect(() => {
    loadAllData()

    // Subscribe to realtime updates
    if (userBranchId) {
      const subscription = orderService.subscribeToOrders(Number(userBranchId), () => {
        loadAllData()
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [userRole, userBranchId])

  const loadAllData = async () => {
    try {
      setLoading(true)

      console.log('[DASHBOARD] Loading data:', {
        isSuperAdmin,
        userBranchId,
        shouldFilterByBranch
      })

      // Fetch branches
      const branchesData = await branchService.getBranches()
      if (shouldFilterByBranch && userBranchId) {
        const branch = branchesData.find((b: Branch) => Number(b.branchid) === userBranchId)
        if (branch) setCurrentBranch(branch)
      }

      // Fetch orders - with branch filter if not Super Admin
      let ordersData = await orderService.getOrders(
        shouldFilterByBranch ? String(userBranchId) : undefined
      )
      console.log('[DASHBOARD] Fetched orders:', ordersData.length)
      setOrders(ordersData)

      // Fetch all order details for top products calculation
      const { data: detailsData, error: detailsError } = await supabase
        .from('orderdetails')
        .select('*')

      if (!detailsError && detailsData) {
        setOrderDetails(detailsData as OrderDetail[])
      }

      // Fetch all products for top products display
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')

      if (!productsError && productsData) {
        setProducts(productsData as Product[])
      }

      // Load current branch info if Manager/Staff
      if (shouldFilterByBranch && userBranchId) {
        const branchData = await branchService.getBranchById(String(userBranchId))
        if (branchData) {
          setCurrentBranch(branchData)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ========== CALCULATE STATS ==========
  const stats = useMemo(() => {
    const fromDate = new Date(dateRange.startDate)
    const toDate = new Date(dateRange.endDate)
    toDate.setHours(23, 59, 59, 999) // Include entire end day

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderdate)
      return orderDate >= fromDate && orderDate <= toDate
    })

    const totalOrders = filteredOrders.length
    const processingOrders = filteredOrders.filter(
      o => o.status === 'Chờ xác nhận' || o.status === 'Đang làm' || o.status === 'Đang giao'
    ).length
    const completedOrders = filteredOrders.filter(o => o.status === 'Hoàn thành').length
    const totalRevenue = filteredOrders
      .filter(o => o.status === 'Hoàn thành')
      .reduce((sum, o) => sum + (o.finalamount || 0), 0)

    // Log for debugging RBAC + date range filtering
    console.log('[DASHBOARD] Stats calculated:', {
      dateRange,
      isSuperAdmin,
      userBranchId,
      totalOrdersFetched: orders.length,
      filteredOrdersInDateRange: filteredOrders.length,
      completedOrdersInRange: completedOrders,
      totalRevenue
    })

    return {
      totalOrders,
      processingOrders,
      completedOrders,
      totalRevenue,
      filteredOrders
    }
  }, [orders, dateRange])

  // ========== CALCULATE TOP PRODUCTS ==========
  const topProducts = useMemo(() => {
    const fromDate = new Date(dateRange.startDate)
    const toDate = new Date(dateRange.endDate)
    toDate.setHours(23, 59, 59, 999)

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderdate)
      return orderDate >= fromDate && orderDate <= toDate
    })

    // Map product quantity: productid -> total quantity
    const productQuantityMap: Record<string | number, number> = {}

    orderDetails.forEach(detail => {
      // Only count details from filtered orders
      if (filteredOrders.some(o => o.orderid === detail.orderid)) {
        const productId = detail.productid
        productQuantityMap[productId] = (productQuantityMap[productId] || 0) + detail.quantity
      }
    })

    // Convert to array and map with product info
    const productsWithQuantity: TopProduct[] = Object.entries(productQuantityMap)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.productid === productId || String(p.productid) === String(productId))
        return {
          productid: productId,
          name: product?.name || 'Unknown',
          imageurl: product?.imageurl || '',
          quantity,
          rank: 0
        }
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((p, idx) => ({ ...p, rank: idx + 1 }))

    return productsWithQuantity
  }, [orders, orderDetails, products, dateRange])

  // ========== CALCULATE REVENUE CHART DATA ==========
  const revenueChartData = useMemo(() => {
    const fromDate = new Date(dateRange.startDate)
    const toDate = new Date(dateRange.endDate)

    const data: Record<string, number> = {}

    // Initialize all dates
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      })
      data[dateStr] = 0
    }

    // Sum revenue by date for completed orders only
    orders.forEach(order => {
      if (order.status === 'Hoàn thành') {
        const orderDate = new Date(order.orderdate)
        if (orderDate >= fromDate && orderDate <= toDate) {
          const dateStr = orderDate.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit'
          })
          if (dateStr in data) {
            data[dateStr] += order.finalamount || 0
          }
        }
      }
    })

    return Object.entries(data).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue / 1000000 * 10) / 10 // Convert to millions
    }))
  }, [orders, dateRange])

  // ========== FORMAT FUNCTIONS ==========
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chờ':
        return { bg: '#FFF7E6', text: '#FF9900', border: '#FFDBA3' }
      case 'Đang làm':
        return { bg: '#EBF3FF', text: '#4318FF', border: '#D1E0FF' }
      case 'Xong':
        return { bg: '#EDFCF3', text: '#00A869', border: '#C8F7DC' }
      case 'Hủy':
        return { bg: '#FFE5E5', text: '#FF4444', border: '#FFB3B3' }
      default:
        return { bg: '#F4F7FE', text: '#2B3674', border: '#E0E5F2' }
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`
    }
    return amount.toString()
  }

  // ========== PAGE TITLE ==========
  const pageTitle = useMemo(() => {
    if (isSuperAdmin) {
      return 'Dashboard - Tổng Quan Hệ Thống'
    } else if (isManager || isStaff) {
      return `Tổng Quan Chi Nhánh${currentBranch ? ': ' + currentBranch.name : ''}`
    }
    return 'Dashboard'
  }, [isSuperAdmin, isManager, isStaff, currentBranch])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#8F9CB8' }}>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6 p-6">
      {/* PAGE TITLE */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#4318FF' }}>
          {pageTitle}
        </h1>
        <p style={{ color: '#8F9CB8' }}>
          {isSuperAdmin
            ? 'Toàn bộ hệ thống'
            : `Dữ liệu từ ${dateRange.startDate} đến ${dateRange.endDate}`}
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Tổng Đơn Hàng"
          value={stats.totalOrders}
          icon={<ShoppingCart size={22} />}
          color="#4318FF"
        />
        <StatsCard
          label="Đang Xử Lý"
          value={stats.processingOrders}
          icon={<Clock size={22} />}
          color="#FF9900"
        />
        <StatsCard
          label="Hoàn Thành"
          value={stats.completedOrders}
          icon={<CheckCircle size={22} />}
          color="#00A869"
        />
        <StatsCard
          label="Doanh Thu"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign size={22} />}
          color="#4318FF"
        />
      </div>

      {/* DATE RANGE FILTER - Using new DateRangeFilter component */}
      <DateRangeFilter
        label="Chọn khoảng thời gian xem doanh thu"
        onDateRangeChange={(range) => {
          console.log('[Dashboard] Date range changed:', range)
          setDateRange({
            startDate: range.startDate,
            endDate: range.endDate
          })
        }}
        showQuickFilters={true}
      />

      {/* REVENUE CHART */}
      <ModernCard title={<div className="flex items-center gap-2"><BarChart3 size={24} style={{ color: '#4318FF' }} /> Doanh Thu Theo Ngày</div>}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E5F2" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8F9CB8', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#8F9CB8', fontSize: 12 }}
              label={{ value: 'Triệu VNĐ', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E5F2',
                borderRadius: '12px'
              }}
              formatter={(value: any) => [`${value}M VNĐ`, 'Doanh Thu']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#4318FF"
              strokeWidth={3}
              dot={{ fill: '#4318FF', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ModernCard>

      {/* TOP PRODUCTS */}
      <ModernCard title={<div className="flex items-center gap-2"><Flame size={24} style={{ color: '#FF9900' }} /> Top 5 Sản Phẩm Bán Chạy Nhất</div>}>
        {topProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: '#E0E5F2' }} />
            <p style={{ color: '#8F9CB8' }}>Không có dữ liệu sản phẩm</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div
                key={product.productid}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ backgroundColor: '#F4F7FE' }}
              >
                {/* Rank Badge */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: '#4318FF' }}
                >
                  {product.rank}
                </div>

                {/* Product Image */}
                {product.imageurl && (
                  <img
                    src={product.imageurl}
                    alt={product.name}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate" style={{ color: '#2B3674' }}>
                    {product.name}
                  </h4>
                  <p className="text-sm" style={{ color: '#8F9CB8' }}>
                    Đã bán: {product.quantity} ly
                  </p>
                </div>

                {/* Quantity Pill */}
                <div
                  className="px-4 py-2 rounded-lg font-bold flex-shrink-0"
                  style={{ backgroundColor: '#EBF3FF', color: '#4318FF' }}
                >
                  {product.quantity}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModernCard>

      {/* RECENT ORDERS */}
      <ModernCard title={<div className="flex items-center gap-2"><ListOrdered size={24} style={{ color: '#4318FF' }} /> Đơn Hàng Gần Đây</div>}>
        {stats.filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: '#E0E5F2' }} />
            <p style={{ color: '#8F9CB8' }}>Không có đơn hàng</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th className="text-left py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>
                    ID Đơn
                  </th>
                  <th className="text-left py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>
                    Ngày
                  </th>
                  <th className="text-left py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>
                    Thành Tiền
                  </th>
                  <th className="text-left py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>
                    Trạng Thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.filteredOrders.slice(0, 10).map((order) => {
                  const statusColor = getStatusColor(order.status)
                  return (
                    <tr
                      key={order.orderid}
                      style={{ borderBottom: '1px solid #E0E5F2' }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-medium" style={{ color: '#2B3674' }}>
                        {order.orderid.substring(0, 8)}...
                      </td>
                      <td className="py-4 px-6" style={{ color: '#8F9CB8' }}>
                        {formatDate(order.orderdate)}
                      </td>
                      <td className="py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>
                        {(order.finalamount || 0).toLocaleString('vi-VN')}{' '}
                        <span style={{ color: '#8F9CB8', fontSize: '0.75rem' }}>VNĐ</span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ModernCard>


    </div>
  )
}
