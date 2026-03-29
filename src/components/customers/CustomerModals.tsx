import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, Star, Plus, Minus, Lock, Unlock } from 'lucide-react'

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface EditCustomerData {
  customerid: string
  fullname: string
  phone: string
  email: string
  authid?: string
  isactive?: boolean
}

export interface AdjustPointsData {
  customerid: string
  fullname: string
  totalpoints: number
}

// ─── Edit Customer Modal ─────────────────────────────────────────────────────

interface EditCustomerModalProps {
  show: boolean
  customer: EditCustomerData | null
  loading: boolean
  onClose: () => void
  onSubmit: (data: { fullname: string; phone: string; email: string }) => Promise<void>
}

export function EditCustomerModal({
  show,
  customer,
  loading,
  onClose,
  onSubmit,
}: EditCustomerModalProps) {
  const [fullname, setFullname] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (customer) {
      setFullname(customer.fullname)
      setPhone(customer.phone)
      setEmail(customer.email)
    }
  }, [customer])

  if (!show || !customer) return null

  const handlePhoneChange = (val: string) => setPhone(val.replace(/\D/g, ''))

  const handleSubmit = async () => {
    await onSubmit({ fullname, phone, email })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-900">Sửa thông tin khách hàng</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Họ tên */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <User className="w-4 h-4 inline mr-1.5 text-slate-400" />
              Họ và tên
            </label>
            <input
              type="text"
              value={fullname}
              onChange={e => setFullname(e.target.value)}
              placeholder="Nhập họ và tên"
              className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>

          {/* SĐT */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1.5 text-slate-400" />
              Số điện thoại
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="Nhập số điện thoại"
              maxLength={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1.5 text-slate-400" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Nhập email"
              className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-[12px] text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !fullname.trim()}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-[12px] hover:bg-blue-700 disabled:bg-slate-300 transition-colors font-medium text-sm"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Adjust Points Modal ──────────────────────────────────────────────────────

interface AdjustPointsModalProps {
  show: boolean
  customer: AdjustPointsData | null
  loading: boolean
  onClose: () => void
  onSubmit: (delta: number, reason: string) => Promise<void>
}

export function AdjustPointsModal({
  show,
  customer,
  loading,
  onClose,
  onSubmit,
}: AdjustPointsModalProps) {
  const [mode, setMode] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  // Reset when opened
  useEffect(() => {
    if (show) {
      setMode('add')
      setAmount('')
      setReason('')
    }
  }, [show])

  if (!show || !customer) return null

  const delta = parseInt(amount || '0', 10)
  const preview = mode === 'add' ? customer.totalpoints + delta : customer.totalpoints - delta
  const isValid = delta > 0 && reason.trim().length > 0 && preview >= 0

  const handleSubmit = async () => {
    await onSubmit(mode === 'add' ? delta : -delta, reason.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Điều chỉnh điểm tích lũy</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Customer info */}
        <div className="mb-6 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">{customer.fullname}</p>
            <p className="text-xs text-slate-500 mt-0.5">Khách hàng</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Điểm hiện tại</p>
            <p className="text-xl font-bold text-amber-600">{customer.totalpoints}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Mode toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Loại điều chỉnh</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('add')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-sm font-medium border transition-colors ${
                  mode === 'add'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-gray-300 hover:bg-slate-50'
                }`}
                type="button"
              >
                <Plus className="w-4 h-4" />
                Cộng điểm
              </button>
              <button
                onClick={() => setMode('subtract')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-sm font-medium border transition-colors ${
                  mode === 'subtract'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-slate-600 border-gray-300 hover:bg-slate-50'
                }`}
                type="button"
              >
                <Minus className="w-4 h-4" />
                Trừ điểm
              </button>
            </div>
          </div>

          {/* Số điểm */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Star className="w-4 h-4 inline mr-1.5 text-amber-400" />
              Số điểm điều chỉnh
            </label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="Nhập số điểm (ví dụ: 50)"
              className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>

          {/* Lý do */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Lý do</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ví dụ: Sai sót hệ thống ngày 28/03/2026"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm resize-none"
            />
          </div>

          {/* Preview */}
          {delta > 0 && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
              preview < 0
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {preview < 0
                ? `⚠ Không đủ điểm để trừ (thiếu ${-preview} điểm)`
                : `Điểm sau điều chỉnh: ${preview.toLocaleString('vi-VN')} điểm`}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-[12px] text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className={`flex-1 px-4 py-3 text-white rounded-[12px] disabled:bg-slate-300 transition-colors font-medium text-sm ${
              mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {loading ? 'Đang xử lý...' : mode === 'add' ? 'Cộng điểm' : 'Trừ điểm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Lock Modal ───────────────────────────────────────────────────────

interface ConfirmLockModalProps {
  show: boolean
  customer: EditCustomerData | null
  loading: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function ConfirmLockModal({
  show,
  customer,
  loading,
  onClose,
  onConfirm,
}: ConfirmLockModalProps) {
  if (!show || !customer) return null

  const isCurrentlyActive = customer.isactive !== false

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        {/* Icon */}
        <div className={`w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center ${
          isCurrentlyActive ? 'bg-red-100' : 'bg-emerald-100'
        }`}>
          {isCurrentlyActive
            ? <Lock className="w-7 h-7 text-red-500" />
            : <Unlock className="w-7 h-7 text-emerald-600" />
          }
        </div>

        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
          {isCurrentlyActive ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
        </h3>

        <p className="text-sm text-slate-500 text-center mb-6">
          {isCurrentlyActive
            ? `Tài khoản của "${customer.fullname}" sẽ bị khóa, khách hàng không thể đăng nhập ứng dụng.`
            : `Tài khoản của "${customer.fullname}" sẽ được kích hoạt trở lại.`}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-[12px] text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 text-white rounded-[12px] disabled:bg-slate-300 transition-colors font-medium text-sm ${
              isCurrentlyActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Đang xử lý...' : isCurrentlyActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
          </button>
        </div>
      </div>
    </div>
  )
}
