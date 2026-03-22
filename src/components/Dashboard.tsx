import React, { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, TrendingUp, AlertCircle, Zap, Calendar } from 'lucide-react'
import { Card, StatsCard } from './Card'
import { orderService } from '@/services/orderService'
import { Order } from '@/types'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardProps {
  userRole?: string
  branchId?: string
}

interface DateRange {
  from: string
  to: string
}

export const Dashboard: React.FC<DashboardProps> = ({
  userRole = 'staff',
  branchId
}) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    return {
      from: sevenDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    }
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    loadOrders()
    // Subscribe to realtime updates
    const subscription = orderService.subscribeToOrders(branchId, () => {
      loadOrders()
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [branchId])

  const loadOrders = async () => {
    try {
      setLoading(true)
      let data = await orderService.getOrders()
      
      // Lọc dữ liệu theo chi nhánh nếu người dùng là Staff hoặc Manager
      if ((userRole === 'staff' || userRole === 'manager') && branchId) {
        data = data.filter(o => o.branchid === branchId)
      }
      
      setOrders(data)

      // Tính toán thống kê
      const completed = data.filter(o => o.status === 'completed').length
      const pending = data.filter(o => o.status === 'pending').length
      const revenue = data.reduce((sum, o) => sum + o.finalamount, 0)

      setStats({
        totalOrders: data.length,
        completedOrders: completed,
        pendingOrders: pending,
        totalRevenue: revenue
      })
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'px-3 py-1 rounded-full text-xs font-semibold'
      case 'processing':
        return 'px-3 py-1 rounded-full text-xs font-semibold'
      case 'completed':
        return 'px-3 py-1 rounded-full text-xs font-semibold'
      case 'cancelled':
        return 'px-3 py-1 rounded-full text-xs font-semibold'
      default:
        return 'px-3 py-1 rounded-full text-xs font-semibold'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#FFF7E6', color: '#FF9900', borderColor: '#FFDBA3' }
      case 'processing':
        return { backgroundColor: '#EBF3FF', color: '#4318FF', borderColor: '#D1E0FF' }
      case 'completed':
        return { backgroundColor: '#EDFCF3', color: '#00A869', borderColor: '#C8F7DC' }
      case 'cancelled':
        return { backgroundColor: '#FFE5E5', color: '#FF4444', borderColor: '#FFB3B3' }
      default:
        return { backgroundColor: '#F4F7FE', color: '#2B3674', borderColor: '#E0E5F2' }
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: '⏳ Chờ xử lý',
      processing: '⚙️ Đang làm',
      completed: '✅ Hoàn thành',
      cancelled: '❌ Hủy'
    }
    return labels[status as keyof typeof labels] || status
  }

  // Calculate revenue data based on date range
  const revenueData = useMemo(() => {
    const data: Record<string, number> = {}
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    
    // Initialize date range
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      data[dateStr] = 0
    }

    // Sum revenue by date
    orders.forEach(order => {
      if (order.status === 'completed') {
        const date = new Date(order.orderdate)
        if (date >= fromDate && date <= toDate) {
          const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
          if (dateStr in data) {
            data[dateStr] += order.finalamount
          }
        }
      }
    })

    return Object.entries(data).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue / 1000000 * 10) / 10 // Convert to millions
    }))
  }, [orders, dateRange])

  // Calculate sentiment data (simulated based on order satisfaction)
  const sentimentData = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed').length
    const pending = orders.filter(o => o.status === 'pending').length
    const cancelled = orders.filter(o => o.status === 'cancelled').length

    return [
      { name: 'Hài lòng', value: completed, fill: '#00A869' },
      { name: 'Bình thường', value: pending, fill: '#FF9900' },
      { name: 'Không hài lòng', value: cancelled, fill: '#FF4444' }
    ]
  }, [orders])

  // Get top products data
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; count: number }> = {}
    
    orders.forEach(order => {
      // Simplified: use branch as proxy for product name
      const productName = order.branchid || 'Unknown'
      if (!productMap[productName]) {
        productMap[productName] = { name: productName, count: 0 }
      }
      productMap[productName].count++
    })

    return Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(p => ({ name: `Chi nhánh ${p.name.substring(0, 8)}`, value: p.count }))
  }, [orders])

  return (
    <div className="space-y-6 p-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B3674' }}>
          Dashboard
        </h1>
        <p style={{ color: '#8F9CB8' }}>
          {userRole === 'admin' ? 'Toàn bộ hệ thống' : `Chi nhánh ${branchId}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Tổng đơn"
          value={stats.totalOrders}
          icon={<ShoppingCart size={24} />}
          color="blue"
        />
        <StatsCard
          label="Đang xử lý"
          value={stats.pendingOrders}
          icon={<AlertCircle size={24} />}
          color="yellow"
        />
        <StatsCard
          label="Hoàn thành"
          value={stats.completedOrders}
          icon={<TrendingUp size={24} />}
          color="green"
        />
        <StatsCard
          label="Doanh thu"
          value={`${(stats.totalRevenue / 1000000).toFixed(1)}M`}
          icon={<Zap size={24} />}
          color="purple"
        />
      </div>

      {/* Date Range Picker */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E5F2', boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px' }}>
        <div className="flex items-center gap-2" style={{ color: '#2B3674' }}>
          <Calendar size={20} />
          <span className="font-semibold">Chọn khoảng thời gian</span>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-xs font-medium" style={{ color: '#8F9CB8' }}>Từ ngày</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="block w-40 px-3 py-2 rounded-lg border mt-1"
              style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: '#8F9CB8' }}>Đến ngày</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="block w-40 px-3 py-2 rounded-lg border mt-1"
              style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
            />
          </div>
          <button
            onClick={() => {
              const today = new Date()
              const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              setDateRange({
                from: sevenDaysAgo.toISOString().split('T')[0],
                to: today.toISOString().split('T')[0]
              })
            }}
            className="px-4 py-2 rounded-lg font-medium text-sm mt-5 transition-all"
            style={{ backgroundColor: '#EBF3FF', color: '#4318FF', border: '1px solid #D1E0FF' }}
          >
            7 Ngày Gần Đây
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card title={`Doanh Thu (${dateRange.from.split('-')[2]} - ${dateRange.to.split('-')[2]}/${dateRange.to.split('-')[1]})`}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
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
                  borderRadius: '8px'
                }}
                formatter={(value: any) => `${value}M VNĐ`}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#4318FF" 
                strokeWidth={3}
                dot={{ fill: '#4318FF', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Sentiment Analysis */}
        <Card title="😊 Cảm Xúc Khách Hàng">
          <div className="flex items-center justify-center h-280">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value} đơn`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Products */}
      <Card title="🔥 Sản Phẩm Bán Chạy">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E5F2" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#8F9CB8', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: '#8F9CB8', fontSize: 12 }}
              label={{ value: 'Số lượng đơn', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E0E5F2',
                borderRadius: '8px'
              }}
              formatter={(value: any) => `${value} đơn`}
            />
            <Bar dataKey="value" fill="#00A869" name="Đơn hàng" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="📋 Đơn hàng gần đây" className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2" style={{ color: '#8F9CB8' }}>
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
                <span>Đang tải dữ liệu...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: '#E0E5F2' }} />
              <p style={{ color: '#8F9CB8' }}>Không có đơn hàng</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th className="text-left py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>ID Đơn</th>
                  <th className="text-left py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>Ngày</th>
                  <th className="text-left py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>Thành tiền</th>
                  <th className="text-left py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map(order => (
                  <tr key={order.orderid} style={{ borderBottom: '1px solid #E0E5F2' }} className="hover:bg-opacity-50 transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F7FE'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td className="py-4 px-6 font-mono font-medium" style={{ color: '#2B3674' }}>{order.orderid.substring(0, 8)}...</td>
                    <td className="py-4 px-6" style={{ color: '#8F9CB8' }}>
                      {new Date(order.orderdate).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6 font-semibold" style={{ color: '#2B3674' }}>
                      {order.finalamount.toLocaleString('vi-VN')} <span style={{ color: '#8F9CB8', fontSize: '0.75rem' }}>VNĐ</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusColor(order.status)} style={{ ...getStatusStyle(order.status), border: `1px solid ${getStatusStyle(order.status).borderColor}` }}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Quick Stats Info */}
      {stats.pendingOrders > 0 && (
        <Card className="overflow-hidden" style={{ backgroundColor: '#FFF7E6', borderLeft: '4px solid #FF9900' }}>
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#FF9900' }} />
            <div>
              <p className="font-semibold" style={{ color: '#FF9900' }}>⚠️ Có {stats.pendingOrders} đơn chờ xử lý</p>
              <p className="text-sm mt-1" style={{ color: '#FF8A00' }}>Vui lòng kiểm tra và xử lý các đơn hàng soonest possible.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
