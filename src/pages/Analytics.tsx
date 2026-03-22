import { useState, useEffect } from 'react'
import { BarChart3, Heart, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { analyticsService, RevenueData, SentimentStats } from '@/services/analyticsService'
import { Review } from '@/types'
import Toast from '@/components/Toast'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
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

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'sentiment'>('revenue')
  const [loading, setLoading] = useState(false)
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])

  // Revenue tab
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)

  // Sentiment tab
  const [sentimentStats, setSentimentStats] = useState<SentimentStats>({ positive: 0, negative: 0, neutral: 0 })
  const [reviews, setReviews] = useState<Review[]>([])
  const [aiInsight, setAiInsight] = useState('')

  // ===== Initialize =====
  useEffect(() => {
    if (activeTab === 'revenue') {
      loadRevenueData()
    } else {
      loadSentimentData()
    }
  }, [activeTab])

  // ===== Load Revenue Data =====
  const loadRevenueData = async () => {
    try {
      setLoading(true)
      const data = await analyticsService.getRevenueLastDays(7)
      setRevenueData(data)
      const total = data.reduce((sum, item) => sum + item.revenue, 0)
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
      const [stats, reviewsList, insight] = await Promise.all([
        analyticsService.getSentimentStats(),
        analyticsService.getReviewsWithSentiment(),
        analyticsService.getAIInsight(),
      ])
      setSentimentStats(stats)
      setReviews(reviewsList)
      setAiInsight(insight)
    } catch (error) {
      console.error('Error loading sentiment data:', error)
      addToast('Lỗi tải dữ liệu cảm xúc', 'error')
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
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: colors.text, fontSize: '32px', fontWeight: '700', margin: 0 }}>
          📊 Phân tích & Thống kê
        </h1>
        <p style={{ color: colors.textLight, fontSize: '14px', margin: '8px 0 0 0' }}>
          Xem tổng quan doanh thu, cảm xúc khách hàng và nhận xét AI
        </p>
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
            <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
              🤖 Nhận xét AI
            </h3>
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
