import dayjs from 'dayjs'
import { AlertCircle, Eye, EyeOff, Loader2, MessageCircle, Star } from 'lucide-react'
import { SentimentReviewRow } from './types'
import { needsReviewAttention } from './utils'

interface ReviewItemProps {
  review: SentimentReviewRow
  onToggleVisibility: (review: SentimentReviewRow) => void
  isToggling: boolean
}

const sentimentStyles = {
  positive: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  neutral: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  negative: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
} as const

export default function ReviewItem({ review, onToggleVisibility, isToggling }: ReviewItemProps) {
  const needsAttention = needsReviewAttention(review)
  const customerLabel = review.customerName || 'Khách hàng'
  const createdAtLabel = dayjs(review.createdat).format('DD/MM/YYYY')

  return (
    <article
      className={`rounded-3xl border p-5 transition ${
        review.is_visible ? 'opacity-100' : 'opacity-60'
      } ${
        needsAttention
          ? 'border-rose-200 bg-rose-50/60'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Sản phẩm</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{review.productName}</h3>
            </div>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${sentimentStyles[review.sentimentCategory]}`}
            >
              {review.sentimentLabel}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium text-slate-700">{customerLabel}</span>
              {needsAttention && <AlertCircle className="h-4 w-4 text-rose-500" />}
            </div>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <span>{createdAtLabel}</span>
          </div>

          <div className="mb-4 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const filled = index < review.rating

              return (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                  }`}
                />
              )
            })}
            <span className="ml-2 text-sm font-medium text-slate-600">{review.rating}/5</span>
          </div>

          <p className="text-sm leading-6 text-slate-700">
            {review.comment?.trim() ? review.comment : 'Khách hàng chưa để lại nội dung bình luận.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleVisibility(review)}
          disabled={isToggling}
          className={`inline-flex min-w-[148px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
            review.is_visible
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : review.is_visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span>{review.is_visible ? 'Ẩn đánh giá' : 'Hiện đánh giá'}</span>
        </button>
      </div>
    </article>
  )
}
