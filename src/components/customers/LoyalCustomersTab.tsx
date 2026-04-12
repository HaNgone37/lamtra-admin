import { useMemo, useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, Zap, Trophy } from 'lucide-react'
import { supabase } from '@/utils/supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────────────

interface LoyalCustomer {
  customerid: number
  fullname: string
  membership: string
  accumulated_points: number
  totalpoints: number
}

// ─── Constants ────────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────────────

export default function LoyalCustomersTab() {
  const [customers, setCustomers] = useState<LoyalCustomer[]>([])
  const [loading, setLoading] = useState(false)

  // ── Load data from Supabase ──
  const loadLoyalCustomers = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('customers')
        .select('customerid, fullname, membership, accumulated_points, totalpoints')
        .order('accumulated_points', { ascending: false })

      if (error) {
        console.error('[LOYAL_CUSTOMERS] Fetch error:', error)
        throw error
      }

      setCustomers((data as LoyalCustomer[]) || [])
    } catch (err) {
      console.error('[LOYAL_CUSTOMERS] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLoyalCustomers()
  }, [loadLoyalCustomers])

  // ── Calculate statistics ──
  const stats = useMemo(() => {
    const total = customers.length
    const totalCirculatingPoints = customers.reduce((sum, c) => sum + (c.totalpoints || 0), 0)

    const membershipCounts = {
      'Vàng': customers.filter((c) => c.membership === 'Vàng').length,
      'Bạc': customers.filter((c) => c.membership === 'Bạc').length,
      'Đồng': customers.filter((c) => c.membership === 'Đồng').length,
    }

    const premiumCount = membershipCounts['Vàng'] + membershipCounts['Bạc']
    const premiumRate = total > 0 ? ((premiumCount / total) * 100).toFixed(1) : '0'

    return {
      total,
      totalCirculatingPoints,
      membershipCounts,
      premiumRate: parseFloat(premiumRate),
      topCustomers: customers.slice(0, 5),
    }
  }, [customers])

  // ── Prepare PieChart data ──
  const pieData = useMemo(() => {
    return MEMBERSHIP_ORDER.map((membership) => ({
      name: membership,
      value: stats.membershipCounts[membership as keyof typeof MEMBERSHIP_COLORS],
    })).filter((item) => item.value > 0)
  }, [stats.membershipCounts])

  // ── Custom Tooltip ──
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const { name, value } = payload[0]
      const percentage = stats.total > 0 ? ((value / stats.total) * 100).toFixed(1) : '0'
      return (
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold text-slate-800">{name}</p>
          <p className="text-sm text-slate-600">
            {value} khách ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Circulating Points */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[20px] border border-blue-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Điểm đang lưu thông</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalCirculatingPoints.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-slate-500 mt-2">Tổng điểm khách hàng chưa đổi quà</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 2: Premium Rate */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[20px] border border-purple-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Tỷ lệ lên hạng</p>
              <p className="text-3xl font-bold text-purple-600">{stats.premiumRate}%</p>
              <p className="text-xs text-slate-500 mt-2">
                {stats.membershipCounts['Vàng'] + stats.membershipCounts['Bạc']}/{stats.total} khách
                (Vàng + Bạc)
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content: 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left Column (40%): Membership Distribution Chart ── */}
        <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Cơ cấu hạng thành viên
          </h3>

          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Đang tải...</p>
              </div>
            </div>
          ) : pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={MEMBERSHIP_COLORS[entry.name as keyof typeof MEMBERSHIP_COLORS]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            MEMBERSHIP_COLORS[item.name as keyof typeof MEMBERSHIP_COLORS],
                        }}
                      />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="text-slate-400">
                      {item.value} ({((item.value / stats.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-80 text-slate-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* ── Right Column (60%): Top 5 Loyalty Leaderboard ── */}
        <div className="lg:col-span-3 bg-white rounded-[20px] border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            Xếp hạng khách hàng thân thiết (Top 5)
          </h3>

          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Đang tải...</p>
              </div>
            </div>
          ) : stats.topCustomers.length > 0 ? (
            <div className="space-y-3">
              {stats.topCustomers.map((customer, idx) => (
                <div
                  key={customer.customerid}
                  className="flex items-center gap-4 p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                        idx === 0
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                          : idx === 1
                          ? 'bg-gradient-to-br from-slate-300 to-slate-500'
                          : idx === 2
                          ? 'bg-gradient-to-br from-orange-300 to-orange-600'
                          : 'bg-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{customer.fullname}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Membership Badge */}
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor:
                            MEMBERSHIP_COLORS[
                              customer.membership as keyof typeof MEMBERSHIP_COLORS
                            ] || '#999',
                          color:
                            MEMBERSHIP_TEXT_COLORS[
                              customer.membership as keyof typeof MEMBERSHIP_TEXT_COLORS
                            ] || '#fff',
                        }}
                      >
                        {customer.membership}
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-indigo-600">
                      {customer.accumulated_points.toLocaleString('vi-VN')}
                    </p>
                    <p className="text-xs text-slate-500">điểm tích lũy</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-slate-400">
              Không có khách hàng
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
