import React, { useEffect, useState } from 'react'
import { orderService } from '@/services/orderService'
import { Clock, CheckCircle2, Volume2 } from 'lucide-react'
import { OrderDetail } from '@/types'

// ═════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════

interface KDSOrder {
  orderid: string
  orderdate: string
  status: string
  items: OrderDetail[]
  customerName?: string
}

interface KDSBoardProps {
  branchId: number
}

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

function calculateWaitTime(orderdate: string): number {
  const now = new Date()
  const orderTime = new Date(orderdate)
  return Math.floor((now.getTime() - orderTime.getTime()) / 60000)
}

function formatSugar(raw?: string): string {
  const value = raw?.trim() || ''
  return value.includes('%') ? value : `${value}%`
}

function formatIce(raw?: string): string {
  const value = raw?.trim() || ''
  return value.includes('%') ? value : `${value}%`
}

// ═════════════════════════════════════════════════════════════════
// KDS BOARD COMPONENT
// ═════════════════════════════════════════════════════════════════

export const KDSBoard: React.FC<KDSBoardProps> = ({ branchId }) => {
  const [orders, setOrders] = useState<KDSOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastOrder, setLastOrder] = useState<string | null>(null)

  // ─────────────────────────────────────────────────────────────
  // LOAD ORDERS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Get pending orders
        const pendingOrders = await orderService.getOrdersByStatusAndBranch(
          branchId,
          'Chờ xác nhận'
        )
        const makingOrders = await orderService.getOrdersByStatusAndBranch(
          branchId,
          'Đang làm'
        )

        // Combine and enrich with details
        const allOrders = [...pendingOrders, ...makingOrders]
        const enriched: KDSOrder[] = []

        for (const order of allOrders) {
          const details = await orderService.getOrderDetails(order.orderid)
          enriched.push({
            orderid: order.orderid,
            orderdate: order.orderdate,
            status: order.status,
            items: details,
            customerName: 'Khách lẻ'
          })

          // Play sound for first new order
          if (lastOrder === null && order.status === 'Chờ xác nhận') {
            playNotificationSound()
          }
        }

        setOrders(enriched)
        if (allOrders.length > 0) {
          setLastOrder(allOrders[0].orderid)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('❌ Error loading orders:', error)
        setIsLoading(false)
      }
    }

    loadOrders()
    const interval = setInterval(loadOrders, 5000) // Refresh every 5s

    return () => clearInterval(interval)
  }, [branchId, lastOrder])

  // ─────────────────────────────────────────────────────────────
  // NOTIFICATION SOUND
  // ─────────────────────────────────────────────────────────────

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Tít tít sound: double tone
    oscillator.frequency.value = 800
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)

    oscillator.frequency.value = 600
    oscillator.start(audioContext.currentTime + 0.25)
    oscillator.stop(audioContext.currentTime + 0.45)
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: EMPTY STATE
  // ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[20px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang tải đơn hàng...</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-green-50 to-emerald-50 rounded-[20px] border-2 border-green-200">
        <CheckCircle2 size={48} className="text-green-500 mb-3" />
        <p className="text-gray-600 font-bold text-lg">✨ Tất cả đơn hàng đã hoàn thành!</p>
        <p className="text-green-600 text-sm mt-2">Chuẩn bị chào đón đơn hàng tiếp theo 🎉</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: ORDERS GRID
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-100 rounded-[15px] p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">
            {orders.filter((o) => o.status === 'Chờ xác nhận').length}
          </p>
          <p className="text-xs text-yellow-600 font-medium mt-1">Chờ xác nhận</p>
        </div>
        <div className="bg-orange-100 rounded-[15px] p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">
            {orders.filter((o) => o.status === 'Đang làm').length}
          </p>
          <p className="text-xs text-orange-600 font-medium mt-1">Đang pha chế</p>
        </div>
        <div className="bg-blue-100 rounded-[15px] p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {Math.max(...orders.map((o) => calculateWaitTime(o.orderdate)), 0)}m
          </p>
          <p className="text-xs text-primary font-medium mt-1">Thời gian chờ max</p>
        </div>
      </div>

      {/* Orders Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        {orders.map((order) => {
          const waitTime = calculateWaitTime(order.orderdate)
          const isLate = waitTime > 10
          const isPending = order.status === 'Chờ xác nhận'

          return (
            <div
              key={order.orderid}
              className={`
                rounded-[20px] p-4 transition-all transform
                ${isPending ? 'ring-2 ring-yellow-400 bg-yellow-50' : 'bg-white border border-gray-200'}
                ${isLate ? 'shadow-lg shadow-red-200' : 'shadow-md'}
              `}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-navy text-sm">#{order.orderid.slice(-6)}</p>
                  <p className="text-xs text-gray-600 mt-1">👤 {order.customerName}</p>
                </div>

                {/* Wait Time Badge */}
                <div
                  className={`
                    flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-bold
                    ${
                      isLate
                        ? 'bg-red-200 text-red-700'
                        : 'bg-green-200 text-green-700'
                    }
                  `}
                >
                  <Clock size={12} />
                  {waitTime}m {isLate && '⚠️ TRỄ'}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                <span
                  className={`
                    inline-flex px-3 py-1 rounded-full text-xs font-medium
                    ${
                      isPending
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-orange-200 text-orange-800'
                    }
                  `}
                >
                  {order.status === 'Chờ xác nhận' ? '⏳ Chờ xác nhận' : '🔄 Đang pha chế'}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                {order.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <p className="font-semibold text-navy">
                      {item.quantity}x Sản phẩm #{item.productid}
                    </p>
                    <div className="flex gap-1 mt-1 text-xs">
                      {item.sugarlevel && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          🍯 {formatSugar(item.sugarlevel)}
                        </span>
                      )}
                      {item.icelevel && (
                        <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                          🧊 {formatIce(item.icelevel)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isPending && (
                  <button className="flex-1 py-2 bg-primary hover:bg-primaryDark text-white rounded-[10px] text-xs font-bold transition-colors">
                    ✓ Xác nhận
                  </button>
                )}
                <button className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-[10px] text-xs font-bold transition-colors">
                  ✓ Xong
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sound control */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button
          onClick={playNotificationSound}
          className="p-3 bg-primary hover:bg-primaryDark text-white rounded-full shadow-lg transition-all hover:scale-110"
          title="Test sound"
        >
          <Volume2 size={20} />
        </button>
      </div>
    </div>
  )
}

// Color palette
export const palette = {
  primary: '#4318FF',
  primaryDark: '#2D0A7A',
  navy: '#2B3674'
}
