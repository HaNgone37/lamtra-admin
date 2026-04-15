import { BarChart3, MessageSquare, Smile, Meh, Frown } from 'lucide-react'
import { SentimentStatsData } from './types'

interface SentimentStatsProps {
  stats: SentimentStatsData
}

const statCards = [
  {
    key: 'total',
    label: 'Tổng đánh giá',
    icon: MessageSquare,
    valueClassName: 'text-slate-900',
    iconClassName: 'bg-slate-100 text-slate-700',
  },
  {
    key: 'positive',
    label: 'Tích cực',
    icon: Smile,
    valueClassName: 'text-emerald-600',
    iconClassName: 'bg-emerald-50 text-emerald-600',
  },
  {
    key: 'neutral',
    label: 'Trung lập',
    icon: Meh,
    valueClassName: 'text-amber-500',
    iconClassName: 'bg-amber-50 text-amber-500',
  },
  {
    key: 'negative',
    label: 'Tiêu cực',
    icon: Frown,
    valueClassName: 'text-rose-600',
    iconClassName: 'bg-rose-50 text-rose-600',
  },
] as const

export default function SentimentStats({ stats }: SentimentStatsProps) {
  const values = {
    total: stats.total,
    positive: stats.positive,
    neutral: stats.neutral,
    negative: stats.negative,
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Tổng quan cảm xúc</h2>
          <p className="text-sm text-slate-500">Phân bố đánh giá theo ba nhóm cảm xúc chính.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.key}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className={`mt-2 text-3xl font-semibold ${card.valueClassName}`}>{values[card.key]}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
