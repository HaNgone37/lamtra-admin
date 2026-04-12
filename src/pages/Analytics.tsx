import { useState, useEffect } from 'react'
import { BarChart3, Heart, TrendingUp, Sparkles, Crown, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Review } from '@/types'
import Toast from '@/components/Toast'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

interface LoyalCustomer {
  customerid: number
  fullname: string
  membership: string
  accumulated_points: number
  totalpoints: number
}

interface RevenueData {
  date: string
  revenue: number
}

interface SentimentStats {
  positive: number
  negative: number
  neutral: number
}

const colors = {
  primary: '#4318FF',
  text: '#2B3674',
  textLight: '#8F9CB8',
  border: '#E0E5F2',
  success: '#05B75D',
  error: '#F3685A',
  warning: '#FEC90F',
  background: '#F3F4F6',
  lightBg: '#F4F7FE',
}

const chartColors = {
  positive: '#05B75D',
  negative: '#F3685A',
  neutral: '#FEC90F',
}

const MEMBERSHIP_COLORS = {
  'Vàng': '#FFD700',
  'Bạc': '#C0C0C0',
  'Đồng': '#CD7F32',
}

const MEMBERSHIP_TEXT_COLORS = {
  'Vàng': '#8B6914',
  'Bạc': '#505050',
  'Đồng': '#5F3410',
}

const MEMBERSHIP_ORDER = ['Vàng', 'Bạc', 'Đồng']

export default function AnalyticsPage() {
  // ===== Auth - Read from localStorage =====
  const userRole = (localStorage.getItem('userRole') || 'staff').toLowerCase()
  const userBranchId = localStorage.getItem('userBranchId') || ''
  const isSuperAdmin = userRole.toLowerCase().includes('super')

  const [activeTab, setActiveTab] = useState<'revenue' | 'sentiment' | 'customers'>('revenue')
  const [loading, setLoading] = useState(false)
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])

  // Revenue tab
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)

  // Sentiment tab
  const [sentimentStats, setSentimentStats] = useState<SentimentStats>({ positive: 0, negative: 0, neutral: 0 })
  const [reviews, setReviews] = useState<Review[]>([])
  const [aiInsight, setAiInsight] = useState('')

  // Loyal Customers tab
  const [loyalCustomers, setLoyalCustomers] = useState<LoyalCustomer[]>([])
  const [loyalStats, setLoyalStats] = useState({
    total: 0,
    totalCirculatingPoints: 0,
    membershipCounts: { 'Vàng': 0, 'Bạc': 0, 'Đồng': 0 },
    premiumRate: 0,
  })

  // ===== Initialize =====
  useEffect(() => {
    if (activeTab === 'revenue') {
      loadRevenueData()
    } else if (activeTab === 'sentiment') {
      loadSentimentData()
    } else if (activeTab === 'customers') {
      loadLoyalCustomers()
    }
  }, [activeTab])

  // ===== Load Revenue Data =====
  const loadRevenueData = async () => {
    try {
      setLoading(true)
      const { supabase } = await import('@/utils/supabaseClient')
      
      // Get last 7 days
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      let query = supabase
        .from('orders')
        .select('orderid, orderdate, totalamount')
        .gte('orderdate', startDate.toISOString())
        .lte('orderdate', endDate.toISOString())
      
      // Add branch filter for managers
      if (!isSuperAdmin && userBranchId) {
        query = query.eq('branchid', userBranchId)
      }

      const { data, error } = await query
      if (error) throw error

      // Group by date
      const grouped: { [key: string]: number } = {}
      data?.forEach((order: any) => {
        const date = new Date(order.orderdate).toLocaleDateString('en-CA')
        grouped[date] = (grouped[date] || 0) + order.totalamount
      })

      const chartData = Object.entries(grouped)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, revenue]) => ({ date, revenue }))

      setRevenueData(chartData)
      const total = chartData.reduce((sum, item) => sum + item.revenue, 0)
      setTotalRevenue(total)
    } catch (error) {
      console.error('Error loading revenue data:', error)
      addToast('Lỗi tải dữ liệu doanh thu', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== Load Sentiment Data =====
  const loadSentimentData = async () => {
    try {
      setLoading(true)
      const { supabase } = await import('@/utils/supabaseClient')

      let query = supabase.from('reviews').select('*')
      
      // Add branch filter for managers
      if (!isSuperAdmin && userBranchId) {
        query = query.eq('branchid', userBranchId)
      }

      const { data: reviewsList, error } = await query
      if (error) throw error

      // Count sentiments
      const stats = { positive: 0, negative: 0, neutral: 0 }
      reviewsList?.forEach((review: any) => {
        const sentiment = review.sentiment?.toLowerCase() || 'neutral'
        if (sentiment.includes('tích cực') || sentiment.includes('positive')) {
          stats.positive++
        } else if (sentiment.includes('tiêu cực') || sentiment.includes('negative')) {
          stats.negative++
        } else {
          stats.neutral++
        }
      })

      setSentimentStats(stats)
      setReviews(reviewsList || [])
      setAiInsight('Phân tích tổng hợp cảm xúc khách hàng trên các đơn hàng. Hãy tiếp tục cải thiện dịch vụ để nâng cao độ hài lòng.')
    } catch (error) {
      console.error('Error loading sentiment data:', error)
      addToast('Lỗi tải dữ liệu cảm xúc', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== Load Top Customers (renamed to Loyal Customers) =====
  const loadLoyalCustomers = async () => {
    try {
      setLoading(true)
      const { supabase } = await import('@/utils/supabaseClient')

      let query = supabase
        .from('customers')
        .select('customerid, fullname, membership, accumulated_points, totalpoints')
        .order('accumulated_points', { ascending: false })

      // Add branch filter for managers (if applicable - customers table may not have branchid)
      // For now, fetch all customers for Super Admin

      const { data, error } = await query
      if (error) throw error

      setLoyalCustomers((data as LoyalCustomer[]) || [])

      // Calculate stats
      const customers = (data as LoyalCustomer[]) || []
      const total = customers.length
      const totalCirculatingPoints = customers.reduce((sum, c) => sum + (c.totalpoints || 0), 0)

      const membershipCounts = {
        'Vàng': customers.filter((c) => c.membership === 'Vàng').length,
        'Bạc': customers.filter((c) => c.membership === 'Bạc').length,
        'Đồng': customers.filter((c) => c.membership === 'Đồng').length,
      }

      const premiumCount = membershipCounts['Vàng'] + membershipCounts['Bạc']
      const premiumRate = total > 0 ? ((premiumCount / total) * 100) : 0

      setLoyalStats({
        total,
        totalCirculatingPoints,
        membershipCounts,
        premiumRate,
      })
    } catch (error) {
      console.error('[LOYAL_CUSTOMERS] Error loading:', error)
      addToast('Lỗi tải dữ liệu khách hàng thân thiết', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== Toast =====
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString()
    setToastMessages(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToastMessages(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const sentimentChartData = [
    { name: 'Tích cực', value: sentimentStats.positive, fill: chartColors.positive },
    { name: 'Tiêu cực', value: sentimentStats.negative, fill: chartColors.negative },
    { name: 'Trung lập', value: sentimentStats.neutral, fill: chartColors.neutral },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BarChart3 size={32} style={{ color: colors.primary }} />
        <div>
          <h1 style={{ color: colors.text, fontSize: '32px', fontWeight: '700', margin: 0 }}>
            Phân tích & Thống kê
          </h1>
          <p style={{ color: colors.textLight, fontSize: '14px', margin: '8px 0 0 0' }}>
            Xem tổng quan doanh thu, cảm xúc khách hàng và nhận xét AI
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: `2px solid ${colors.border}`, paddingBottom: '15px' }}>
        <button
          onClick={() => setActiveTab('revenue')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'revenue' ? colors.primary : colors.textLight,
            fontWeight: activeTab === 'revenue' ? 'bold' : 'normal',
            fontSize: '14px',
          }}
        >
          <TrendingUp size={20} />
          Doanh thu
        </button>
        <button
          onClick={() => setActiveTab('sentiment')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'sentiment' ? colors.primary : colors.textLight,
            fontWeight: activeTab === 'sentiment' ? 'bold' : 'normal',
            fontSize: '14px',
          }}
        >
          <Heart size={20} />
          Cảm xúc khách hàng
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'customers' ? colors.primary : colors.textLight,
            fontWeight: activeTab === 'customers' ? 'bold' : 'normal',
            fontSize: '14px',
          }}
        >
          <Crown size={20} />
          Khách hàng thân thiết
        </button>
      </div>

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div>
          {/* Total Revenue Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: `1px solid ${colors.border}`,
            boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: colors.textLight, fontSize: '14px', margin: '0 0 8px 0' }}>
                  Tổng doanh thu 7 ngày
                </p>
                <h2 style={{ color: colors.text, fontSize: '32px', fontWeight: '700', margin: 0 }}>
                  {totalRevenue.toLocaleString('vi-VN')}đ
                </h2>
              </div>
              <BarChart3 size={48} style={{ color: colors.primary, opacity: 0.5 }} />
            </div>
          </div>

          {/* Revenue Chart */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: `1px solid ${colors.border}`,
            boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
            padding: '24px',
          }}>
            <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600', margin: '0 0 24px 0' }}>
              Biểu đồ doanh thu
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                ⏳ Đang tải...
              </div>
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="date" stroke={colors.textLight} />
                  <YAxis stroke={colors.textLight} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      boxShadow: 'rgba(112, 144, 176, 0.1) 0px 4px 12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu (đ)"
                    stroke={colors.primary}
                    strokeWidth={3}
                    dot={{ fill: colors.primary, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                Không có dữ liệu doanh thu
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sentiment Tab */}
      {activeTab === 'sentiment' && (
        <div>
          {/* AI Insight Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: `1px solid ${colors.border}`,
            boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
            padding: '24px',
            marginBottom: '24px',
            borderLeft: `4px solid ${colors.primary}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Sparkles size={20} style={{ color: colors.primary }} />
              <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600', margin: 0 }}>
                Nhận xét AI
              </h3>
            </div>
            <p style={{ color: colors.text, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {loading ? '⏳ Đang phân tích...' : aiInsight}
            </p>
          </div>

          {/* Sentiment Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            {[
              { label: 'Tích cực', value: sentimentStats.positive, color: chartColors.positive },
              { label: 'Tiêu cực', value: sentimentStats.negative, color: chartColors.negative },
              { label: 'Trung lập', value: sentimentStats.neutral, color: chartColors.neutral },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: `1px solid ${colors.border}`,
                  boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  display: 'flex',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `${stat.color}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <span style={{ color: stat.color, fontSize: '24px', fontWeight: '700' }}>
                    {stat.value}
                  </span>
                </div>
                <p style={{ color: colors.textLight, fontSize: '14px', margin: 0 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Sentiment Pie Chart */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: `1px solid ${colors.border}`,
            boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600', margin: '0 0 24px 0' }}>
              Tỷ lệ cảm xúc
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                ⏳ Đang tải...
              </div>
            ) : (sentimentStats.positive + sentimentStats.negative + sentimentStats.neutral) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                Chưa có đánh giá
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: `1px solid ${colors.border}`,
            boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
            padding: '24px',
          }}>
            <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
              Danh sách đánh giá gần đây
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                ⏳ Đang tải...
              </div>
            ) : reviews.length > 0 ? (
              <div>
                {reviews.map(review => (
                  <div
                    key={review.reviewid}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      paddingBottom: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <p style={{ color: colors.text, fontWeight: '600', margin: '0 0 4px 0', fontSize: '14px' }}>
                          {review.product?.name || 'Sản phẩm'}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px' }}>
                            ⭐ {review.rating}/5
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background:
                                review.sentiment === 'Tích cực' ? `${chartColors.positive}20`
                                  : review.sentiment === 'Tiêu cực' ? `${chartColors.negative}20`
                                    : `${chartColors.neutral}20`,
                              color:
                                review.sentiment === 'Tích cực' ? chartColors.positive
                                  : review.sentiment === 'Tiêu cực' ? chartColors.negative
                                    : chartColors.neutral,
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          >
                            {review.sentiment}
                          </span>
                        </div>
                      </div>
                      <span style={{ color: colors.textLight, fontSize: '12px' }}>
                        {new Date(review.createdat).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p style={{ color: colors.text, fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                Chưa có đánh giá nào
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customers Tab - Loyal Customers */}
      {activeTab === 'customers' && (
        <div>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            {/* Card 1: Circulating Points */}
            <div style={{
              background: 'linear-gradient(135deg, #E3F2FD 0%, #E0F2FE 100%)',
              borderRadius: '20px',
              border: '1px solid #90CAF9',
              boxShadow: 'rgba(13, 110, 253, 0.1) 0px 4px 12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: colors.textLight, fontSize: '12px', margin: '0 0 8px 0' }}>
                    Điểm đang lưu thông
                  </p>
                  <p style={{ color: colors.primary, fontSize: '28px', fontWeight: '700', margin: 0 }}>
                    {loyalStats.totalCirculatingPoints.toLocaleString('vi-VN')}
                  </p>
                  <p style={{ color: colors.textLight, fontSize: '11px', marginTop: '6px' }}>
                    Điểm chưa đổi quà
                  </p>
                </div>
                <div style={{
                  background: '#BBDEFB',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Zap size={24} style={{ color: colors.primary }} />
                </div>
              </div>
            </div>

            {/* Card 2: Premium Rate */}
            <div style={{
              background: 'linear-gradient(135deg, #F3E5F5 0%, #FCE4EC 100%)',
              borderRadius: '20px',
              border: '1px solid #CE93D8',
              boxShadow: 'rgba(156, 39, 176, 0.1) 0px 4px 12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: colors.textLight, fontSize: '12px', margin: '0 0 8px 0' }}>
                    Tỷ lệ lên hạng
                  </p>
                  <p style={{ color: '#9C27B0', fontSize: '28px', fontWeight: '700', margin: 0 }}>
                    {loyalStats.premiumRate.toFixed(1)}%
                  </p>
                  <p style={{ color: colors.textLight, fontSize: '11px', marginTop: '6px' }}>
                    {loyalStats.membershipCounts['Vàng'] + loyalStats.membershipCounts['Bạc']}/
                    {loyalStats.total} khách
                  </p>
                </div>
                <div style={{
                  background: '#F8BBD0',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Crown size={24} style={{ color: '#9C27B0' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Layout for Chart and Leaderboard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
          }}>
            {/* Left: Membership Distribution PieChart */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              border: `1px solid ${colors.border}`,
              boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
              padding: '24px',
            }}>
              <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: colors.primary }} />
                Cơ cấu hạng thành viên
              </h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textLight }}>
                  ⏳ Đang tải...
                </div>
              ) : loyalStats.total > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={MEMBERSHIP_ORDER.map(m => ({
                          name: m,
                          value: loyalStats.membershipCounts[m as keyof typeof MEMBERSHIP_COLORS],
                        })).filter(x => x.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {MEMBERSHIP_ORDER.map(m => (
                          <Cell
                            key={`cell-${m}`}
                            fill={MEMBERSHIP_COLORS[m as keyof typeof MEMBERSHIP_COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MEMBERSHIP_ORDER.map(m => (
                      loyalStats.membershipCounts[m as keyof typeof MEMBERSHIP_COLORS] > 0 && (
                        <div key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: MEMBERSHIP_COLORS[m as keyof typeof MEMBERSHIP_COLORS],
                              }}
                            />
                            <span style={{ color: colors.text, fontWeight: '500' }}>{m}</span>
                          </div>
                          <span style={{ color: colors.textLight }}>
                            {loyalStats.membershipCounts[m as keyof typeof MEMBERSHIP_COLORS]} (
                            {((loyalStats.membershipCounts[m as keyof typeof MEMBERSHIP_COLORS] / loyalStats.total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textLight }}>
                  Không có dữ liệu hạng thành viên
                </div>
              )}
            </div>

            {/* Right: Top 5 Loyal Customers Leaderboard */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              border: `1px solid ${colors.border}`,
              boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
              padding: '24px',
            }}>
              <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={18} style={{ color: '#FFC107' }} />
                Xếp hạng Top 5
              </h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textLight }}>
                  ⏳ Đang tải...
                </div>
              ) : loyalCustomers.slice(0, 5).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loyalCustomers.slice(0, 5).map((customer, idx) => (
                    <div
                      key={customer.customerid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: colors.lightBg,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {/* Rank Badge */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '14px',
                          background:
                            idx === 0
                              ? 'linear-gradient(135deg, #FFB300, #FF8C00)'
                              : idx === 1
                              ? 'linear-gradient(135deg, #C0C0C0, #808080)'
                              : idx === 2
                              ? 'linear-gradient(135deg, #CD7F32, #8B4513)'
                              : '#999',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>

                      {/* Customer Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: colors.text, fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {customer.fullname}
                        </p>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginTop: '4px',
                            background: MEMBERSHIP_COLORS[customer.membership as keyof typeof MEMBERSHIP_COLORS] || '#999',
                            color: MEMBERSHIP_TEXT_COLORS[customer.membership as keyof typeof MEMBERSHIP_TEXT_COLORS] || '#fff',
                          }}
                        >
                          {customer.membership}
                        </span>
                      </div>

                      {/* Points */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, color: colors.primary, fontWeight: '700', fontSize: '14px' }}>
                          {customer.accumulated_points.toLocaleString('vi-VN')}
                        </p>
                        <p style={{ margin: '2px 0 0 0', color: colors.textLight, fontSize: '11px' }}>
                          điểm
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textLight }}>
                  Không có khách hàng
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        {toastMessages.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToastMessages(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  )
}
