import { MessageSquare } from 'lucide-react'
import { SentimentReviewRow } from './types'
import ReviewItem from './ReviewItem'

interface ReviewListProps {
  reviews: SentimentReviewRow[]
  onToggleVisibility: (review: SentimentReviewRow) => void
  togglingReviewId: string | number | null
}

export default function ReviewList({
  reviews,
  onToggleVisibility,
  togglingReviewId,
}: ReviewListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Danh sách đánh giá</h2>
          <p className="text-sm text-slate-500">Chi tiết từng đánh giá và trạng thái hiển thị hiện tại.</p>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewItem
              key={review.reviewid}
              review={review}
              onToggleVisibility={onToggleVisibility}
              isToggling={togglingReviewId === review.reviewid}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-600">Không tìm thấy đánh giá phù hợp.</p>
          <p className="mt-1 text-sm text-slate-400">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      )}
    </section>
  )
}
