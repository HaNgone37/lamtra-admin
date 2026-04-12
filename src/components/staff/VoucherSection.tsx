import React, { useState } from 'react'
import { voucherService } from '@/services/voucherService'
import { Ticket, X } from 'lucide-react'
import { Toast } from '@/components/Toast'

// ═════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════

interface VoucherSectionProps {
  onDiscountChange: (discountAmount: number) => void
  currentSubtotal: number
  appliedVoucher?: { code: string; discountAmount: number } | null
}

// ═════════════════════════════════════════════════════════════════
// VOUCHER SECTION COMPONENT
// ═════════════════════════════════════════════════════════════════

export const VoucherSection: React.FC<VoucherSectionProps> = ({
  onDiscountChange,
  currentSubtotal,
  appliedVoucher
}) => {
  const [voucherCode, setVoucherCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // ─────────────────────────────────────────────────────────────
  // VALIDATE VOUCHER
  // ─────────────────────────────────────────────────────────────

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập mã voucher' })
      return
    }

    setIsValidating(true)
    try {
      const result = await voucherService.validateVoucherCode(voucherCode)

      if (result.valid && result.discountAmount) {
        // Apply discount
        const finalDiscount = Math.min(result.discountAmount, currentSubtotal)
        onDiscountChange(finalDiscount)
        setVoucherCode('')
        setToast({
          type: 'success',
          message: `✅ Áp dụng voucher: -${finalDiscount.toLocaleString()}đ`
        })
      } else {
        setToast({ type: 'error', message: result.error || 'Mã voucher không hợp lệ' })
      }
    } catch (error) {
      console.error('❌ Error validating voucher:', error)
      setToast({ type: 'error', message: 'Lỗi kiểm tra voucher' })
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveVoucher = () => {
    onDiscountChange(0)
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: APPLIED STATE
  // ─────────────────────────────────────────────────────────────

  if (appliedVoucher) {
    return (
      <div className="bg-white rounded-[20px] p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-medium">🎟️ Voucher</p>
            <p className="text-sm font-semibold text-navy mt-1">{appliedVoucher.code}</p>
            <p className="text-xs text-green-600 mt-1 font-medium">
              -{appliedVoucher.discountAmount.toLocaleString()}đ
            </p>
          </div>
          <button
            onClick={handleRemoveVoucher}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: INPUT STATE
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-[20px] p-4 border border-gray-200">
      <label className="block text-xs text-gray-600 font-medium mb-2">
        🎟️ Nhập mã giảm giá
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="VD: SUMMER2024..."
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleValidateVoucher()}
          className="flex-1 bg-gray-100 rounded-[15px] px-4 py-3 text-sm text-navy placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40 transition-all"
        />
        <button
          onClick={handleValidateVoucher}
          disabled={isValidating || !voucherCode.trim()}
          className="px-6 py-3 bg-primary hover:bg-primaryDark disabled:bg-gray-300 text-white rounded-[15px] font-medium text-sm transition-colors flex items-center gap-2"
        >
          {isValidating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </>
          ) : (
            <>
              <Ticket size={16} />
              Áp dụng
            </>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

// Color palette export
export const palette = {
  primary: '#4318FF',
  primaryDark: '#2D0A7A',
  navy: '#2B3674',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  white: '#FFFFFF'
}
