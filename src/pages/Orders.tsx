import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { supabase } from '@/utils/supabaseClient'
import { Branch, Order } from '@/types'
import { Eye, X, ChevronDown } from 'lucide-react'

interface OrderWithDetails extends Order {
  customername?: string
  branchname?: string
}

interface OrderDetail {
  orderdetailid: string
  orderid: string
  productid: string
  sizeid: string
  quantity: number
  sugarlevel: string
  icelevel: string
  priceatorder: number
  subtotal: number
  productname?: string
  sizename?: string
}

interface OrderTopping {
  toppingid: string
  name: string
  quantity: number
  price: number
}

interface EnrichedOrderDetail extends OrderDetail {
  toppings: OrderTopping[]
}

const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = '#F4F7FE'
  let textColor = '#2B3674'
  let dotColor = '#2B3674'
  let label = 'N/A'

  switch (status) {
    case 'chờ':
      bgColor = '#EBF3FF'
      textColor = '#4318FF'
      dotColor = '#4318FF'
      label = 'Chờ'
      break
    case 'đang làm':
      bgColor = '#FFF7E6'
      textColor = '#FF9900'
      dotColor = '#FF9900'
      label = 'Đang làm'
      break
    case 'xong':
      bgColor = '#E6FFFA'
      textColor = '#00A869'
      dotColor = '#00A869'
      label = 'Hoàn thành'
      break
    case 'hủy':
      bgColor = '#FFF5F5'
      textColor = '#C53030'
      dotColor = '#C53030'
      label = 'Hủy'
      break
  }

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
      {label}
    </span>
  )
}

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [orderDetails, setOrderDetails] = useState<EnrichedOrderDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    loadBranches()
    loadOrders()
  }, [])

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase.from('branches').select('*')
      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('orders').select('*')
      if (error) throw error

      if (data && data.length > 0) {
        // Join with branches
        const branchMap = new Map(branches.map(b => [b.branchid, b.name]))

        // Fetch customers
        const customerIds = [...new Set(data.map(o => o.customerid).filter(Boolean))]
        const { data: customers } = await supabase
          .from('customers')
          .select('customerid, fullname')
          .in('customerid', customerIds.length > 0 ? customerIds : [''])

        const customerMap = new Map(customers?.map(c => [c.customerid, c.fullname]) || [])

        const enrichedOrders: OrderWithDetails[] = data.map(order => ({
          ...order,
          branchname: branchMap.get(order.branchid) || 'N/A',
          customername: order.customerid ? customerMap.get(order.customerid) || 'Khách lẻ' : 'Khách lẻ'
        }))

        setOrders(enrichedOrders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrderDetails = async (orderId: string) => {
    try {
      setLoadingDetails(true)

      // Fetch orderdetails
      const { data: details, error } = await supabase
        .from('orderdetails')
        .select('*')
        .eq('orderid', orderId)

      if (error) throw error

      if (details) {
        // Fetch product names
        const productIds = [...new Set(details.map(d => d.productid))]
        const { data: products } = await supabase
          .from('products')
          .select('productid, name')
          .in('productid', productIds)

        // Fetch size names
        const sizeIds = [...new Set(details.map(d => d.sizeid))]
        const { data: sizes } = await supabase
          .from('sizes')
          .select('sizeid, name')
          .in('sizeid', sizeIds)

        const productMap = new Map(products?.map(p => [p.productid, p.name]) || [])
        const sizeMap = new Map(sizes?.map(s => [s.sizeid, s.name]) || [])

        // Fetch toppings for each detail
        const enrichedDetails: EnrichedOrderDetail[] = []

        for (const detail of details) {
          const { data: toppingData } = await supabase
            .from('ordertoppings')
            .select('toppingid, quantity')
            .eq('orderdetailid', detail.orderdetailid)

          const toppingIds = toppingData?.map(t => t.toppingid) || []
          let toppings: OrderTopping[] = []

          if (toppingIds.length > 0) {
            const { data: toppingInfo } = await supabase
              .from('toppings')
              .select('toppingid, name, price')
              .in('toppingid', toppingIds)

            const toppingInfoMap = new Map(toppingInfo?.map(t => [t.toppingid, { name: t.name, price: t.price }]) || [])

            toppings = toppingData?.map(t => ({
              toppingid: t.toppingid,
              name: toppingInfoMap.get(t.toppingid)?.name || '',
              quantity: t.quantity,
              price: toppingInfoMap.get(t.toppingid)?.price || 0
            })) || []
          }

          enrichedDetails.push({
            ...detail,
            productname: productMap.get(detail.productid) || 'N/A',
            sizename: sizeMap.get(detail.sizeid) || 'N/A',
            toppings
          })
        }

        setOrderDetails(enrichedDetails)
      }
    } catch (error) {
      console.error('Error loading order details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleViewDetails = async (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setShowModal(true)
    await loadOrderDetails(order.orderid)
  }

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'hủy' })
          .eq('orderid', orderId)

        if (error) throw error
        await loadOrders()
        setShowModal(false)
      } catch (error) {
        console.error('Error cancelling order:', error)
        alert('Lỗi khi hủy đơn hàng')
      }
    }
  }

  // Apply filters
  const filteredOrders = orders.filter(order => {
    const branchMatch = selectedBranch === 'all' || order.branchid === selectedBranch
    const statusMatch = selectedStatus === 'all' || order.status === selectedStatus
    const orderDate = new Date(order.orderdate)
    const startDateMatch = !startDate || orderDate >= new Date(startDate)
    const endDateMatch = !endDate || orderDate <= new Date(endDate)

    return branchMatch && statusMatch && startDateMatch && endDateMatch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B3674' }}>Quản lý đơn hàng</h1>
        {/*<p style={{ color: '#8F9CB8' }}>Super Admin - Xem tất cả đơn hàng</p>*/}
      </div>

      {/* Filter Section */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Chi nhánh Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Chi nhánh</label>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm appearance-none pr-10"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
              >
                <option value="all">Tất cả chi nhánh</option>
                {branches.map(branch => (
                  <option key={branch.branchid} value={branch.branchid}>{branch.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: '#2B3674' }} />
            </div>
          </div>

          {/* Trạng thái Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Trạng thái</label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm appearance-none pr-10"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="chờ">Chờ</option>
                <option value="đang làm">Đang làm</option>
                <option value="xong">Hoàn thành</option>
                <option value="hủy">Hủy</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: '#2B3674' }} />
            </div>
          </div>

          {/* Ngày bắt đầu */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
            />
          </div>

          {/* Ngày kết thúc */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
            />
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        {loading ? (
          <div className="text-center py-12" style={{ color: '#8F9CB8' }}>
            Đang tải đơn hàng...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#8F9CB8' }}>
            Không tìm thấy đơn hàng
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Mã đơn</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Khách hàng</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Chi nhánh</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Tổng tiền</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Ngày đặt</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.orderid} style={{ borderBottom: '1px solid #E0E5F2' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F7FE'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td className="py-4 px-4 font-mono font-bold text-xs" style={{ color: '#2B3674' }}>{order.orderid}</td>
                    <td className="py-4 px-4" style={{ color: '#2B3674' }}>{order.customername}</td>
                    <td className="py-4 px-4" style={{ color: '#8F9CB8' }}>{order.branchname}</td>
                    <td className="py-4 px-4 font-semibold" style={{ color: '#2B3674' }}>{order.finalamount?.toLocaleString()} VNĐ</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-4" style={{ color: '#8F9CB8' }}>
                      {new Date(order.orderdate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ backgroundColor: '#EBF3FF', color: '#4318FF' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1E0FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EBF3FF'}
                      >
                        <Eye size={14} />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Chi tiết đơn hàng</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0E5F2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F4F7FE'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Order Info */}
            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid #E0E5F2' }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: '#8F9CB8' }}>Mã đơn</p>
                  <p className="font-bold text-sm" style={{ color: '#2B3674' }}>{selectedOrder.orderid}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#8F9CB8' }}>Khách hàng</p>
                  <p className="font-bold text-sm" style={{ color: '#2B3674' }}>{selectedOrder.customername}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#8F9CB8' }}>Chi nhánh</p>
                  <p className="font-bold text-sm" style={{ color: '#2B3674' }}>{selectedOrder.branchname}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#8F9CB8' }}>Ngày đặt</p>
                  <p className="font-bold text-sm" style={{ color: '#2B3674' }}>
                    {new Date(selectedOrder.orderdate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid #E0E5F2' }}>
              <h3 className="font-bold mb-3" style={{ color: '#2B3674' }}>Danh sách món</h3>
              {loadingDetails ? (
                <p style={{ color: '#8F9CB8' }}>Đang tải...</p>
              ) : orderDetails.length === 0 ? (
                <p style={{ color: '#8F9CB8' }}>Không có chi tiết đơn hàng</p>
              ) : (
                <div className="space-y-3">
                  {orderDetails.map((detail, idx) => (
                    <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: '#F4F7FE' }}>
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#2B3674' }}>
                            {detail.productname} ({detail.sizename})
                          </p>
                          <p className="text-xs" style={{ color: '#8F9CB8' }}>
                            Số lượng: {detail.quantity} ly
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm" style={{ color: '#2B3674' }}>
                            {detail.subtotal?.toLocaleString()} VNĐ
                          </p>
                        </div>
                      </div>

                      {/* Toppings */}
                      {detail.toppings && detail.toppings.length > 0 && (
                        <div className="mt-2 pt-2" style={{ borderTop: '1px solid #E0E5F2' }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#8F9CB8' }}>Topping:</p>
                          <div className="flex flex-wrap gap-1">
                            {detail.toppings.map((topping, tIdx) => (
                              <span key={tIdx} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#EBF3FF', color: '#4318FF' }}>
                                {topping.name} x{topping.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sugar & Ice */}
                      {(detail.sugarlevel || detail.icelevel) && (
                        <div className="mt-2 text-xs" style={{ color: '#8F9CB8' }}>
                          {detail.sugarlevel && <p>Đường: {detail.sugarlevel}</p>}
                          {detail.icelevel && <p>Đá: {detail.icelevel}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid #E0E5F2' }}>
              <div className="flex justify-between text-lg font-bold">
                <span style={{ color: '#2B3674' }}>Thành tiền:</span>
                <span style={{ color: '#4318FF' }}>{selectedOrder.finalamount?.toLocaleString()} VNĐ</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {selectedOrder.status === 'chờ' && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder.orderid)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#FF4444', color: '#FFFFFF' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DD2222'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF4444'}
                >
                  Hủy đơn
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#E0E5F2', color: '#2B3674' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1DCEF'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0E5F2'}
              >
                Đóng
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
