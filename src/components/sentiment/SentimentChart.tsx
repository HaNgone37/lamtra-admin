import { PieChart as PieChartIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { SentimentChartDatum } from './types'

interface SentimentChartProps {
  data: SentimentChartDatum[]
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <PieChartIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Biểu đồ cảm xúc</h2>
        </div>
      </div>

      {total > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_220px]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={104}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((item) => (
                    <Cell key={item.category} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value ?? 0} đánh giá`, 'Số lượng']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col justify-center gap-3">
            {data.map((item) => {
              const percent = total > 0 ? Math.round((item.value / total) * 100) : 0

              return (
                <div key={item.category} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${item.category === 'positive' ? 'bg-emerald-500' : item.category === 'neutral' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <span className="text-2xl font-semibold text-slate-900">{item.value}</span>
                    <span className="text-sm text-slate-500">{percent}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-600">Chưa có dữ liệu để hiển thị biểu đồ.</p>
          <p className="mt-1 text-sm text-slate-400">Các đánh giá mới sẽ được tổng hợp tại đây.</p>
        </div>
      )}
    </section>
  )
}
