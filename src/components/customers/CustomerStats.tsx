import { Users, Banknote, TrendingUp, Crown } from 'lucide-react'

interface StatsCustomer {
  totalspent: number
  membership: string
}

interface CustomerStatsProps {
  customers: StatsCustomer[]
  showFinancial: boolean
}

export default function CustomerStats({ customers, showFinancial }: CustomerStatsProps) {
  const total = customers.length
  const totalSpent = customers.reduce((sum, c) => sum + (c.totalspent || 0), 0)
  const avgSpent = total > 0 ? Math.round(totalSpent / total) : 0
  const vipCount = customers.filter(c => (c.membership || '').toUpperCase() === 'VIP').length

  const stats = [
    {
      label: 'Tổng khách hàng',
      value: total.toLocaleString('vi-VN'),
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      show: true,
    },
    {
      label: 'Tổng chi tiêu',
      value: totalSpent.toLocaleString('vi-VN') + ' đ',
      icon: Banknote,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      show: showFinancial,
    },
    {
      label: 'Trung bình chi tiêu',
      value: avgSpent.toLocaleString('vi-VN') + ' đ',
      icon: TrendingUp,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      show: showFinancial,
    },
    {
      label: 'Khách VIP',
      value: vipCount.toLocaleString('vi-VN'),
      icon: Crown,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      show: true,
    },
  ]

  const visible = stats.filter(s => s.show)

  return (
    <div
      className={`grid gap-4 mb-6 ${
        visible.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'
      }`}
    >
      {visible.map(({ label, value, icon: Icon, iconColor, bgColor }) => (
        <div
          key={label}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4"
        >
          <div className={`${bgColor} p-3 rounded-xl flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${iconColor} leading-tight truncate`}>
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
