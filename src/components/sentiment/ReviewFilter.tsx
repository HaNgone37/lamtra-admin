import { ChangeEvent } from 'react'
import { Filter, Search } from 'lucide-react'
import { ProductFilterValue, SentimentFilterValue } from './types'

interface ProductOption {
  productid: string | number
  name: string
}

interface ReviewFilterProps {
  products: ProductOption[]
  searchTerm: string
  onSearchTermChange: (value: string) => void
  selectedProductId: ProductFilterValue
  onSelectedProductIdChange: (value: ProductFilterValue) => void
  selectedSentiment: SentimentFilterValue
  onSelectedSentimentChange: (value: SentimentFilterValue) => void
  visibleOnly: boolean
  onVisibleOnlyChange: (value: boolean) => void
}

const sentimentOptions: Array<{ value: SentimentFilterValue; label: string }> = [
  { value: 'all', label: 'Tất cả cảm xúc' },
  { value: 'positive', label: 'Tích cực' },
  { value: 'neutral', label: 'Trung lập' },
  { value: 'negative', label: 'Tiêu cực' },
]

export default function ReviewFilter({
  products,
  searchTerm,
  onSearchTermChange,
  selectedProductId,
  onSelectedProductIdChange,
  selectedSentiment,
  onSelectedSentimentChange,
  visibleOnly,
  onVisibleOnlyChange,
}: ReviewFilterProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchTermChange(event.target.value)
  }

  const handleProductChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectedProductIdChange(event.target.value)
  }

  const handleSentimentChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectedSentimentChange(event.target.value as SentimentFilterValue)
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Filter className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Bộ lọc đánh giá</h2>
          <p className="text-sm text-slate-500">Tìm nhanh theo sản phẩm, nội dung và trạng thái cảm xúc.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">Tìm kiếm bình luận</span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Nhập tên sản phẩm hoặc nội dung đánh giá..."
              className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">Sản phẩm</span>
          <select
            value={selectedProductId}
            onChange={handleProductChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">Tất cả sản phẩm</option>
            {products.map((product) => (
              <option key={String(product.productid)} value={String(product.productid)}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">Cảm xúc</span>
          <select
            value={selectedSentiment}
            onChange={handleSentimentChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          >
            {sentimentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Hiển thị đánh giá công khai</p>
          <p className="text-xs text-slate-500">Ẩn các đánh giá đang tắt nếu bạn chỉ muốn xem nội dung hiển thị.</p>
        </div>

        <button
          type="button"
          onClick={() => onVisibleOnlyChange(!visibleOnly)}
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition ${
            visibleOnly
              ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
          }`}
        >
          {visibleOnly ? 'Chỉ đánh giá đang hiển thị' : 'Bao gồm đánh giá đã ẩn'}
        </button>
      </div>
    </div>
  )
}