import React, { useState } from 'react'

// ============ LAM TRÀ COLOR SCHEME (Pink Theme) ============
const colors = {
  primary: '#f06192',           // Lam Trà pink main
  primaryLight: '#f5d5e0',      // Lam Trà pink light
  primaryVeryLight: '#fce0ed',  // Ultra light pink
  text: '#1a1840',              // Navy (dark)
  textLight: '#8B7E9E',         // Muted gray
  border: '#f06192',            // Pink border
  background: '#F9F9FB',
  bgOverlay: 'rgba(0, 0, 0, 0.2)',
  white: '#FFFFFF',
}

interface RestockModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  form: { quantity: string; unitprice: string }
  onFormChange: (field: string, value: string) => void
  selectedIngredientName: string
  selectedIngredientUnit?: string
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  selectedIngredientName,
  selectedIngredientUnit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  if (!isOpen) return null

  const quantity = parseInt(form.quantity || '0')
  const unitprice = parseInt(form.unitprice || '0')
  const totalAmount = quantity * unitprice
  
  const handleSubmitWithLoading = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.bgOverlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdrop: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.white,
          borderRadius: '20px',
          padding: '28px',
          maxWidth: '400px',
          width: '92%',
          boxShadow: '0 10px 40px rgba(240, 97, 146, 0.15)',
          fontFamily: 'Be Vietnam Pro, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            color: colors.text,
            margin: '0 0 6px 0',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '0px',
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}>
            Nhập Kho
          </h2>
          <p style={{
            color: colors.textLight,
            margin: 0,
            fontSize: '12px',
            fontWeight: '500',
            lineHeight: '18px',
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}>
            {selectedIngredientName} • {selectedIngredientUnit || '?'}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {/* Quantity Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: colors.text,
              marginBottom: '7px',
              fontFamily: 'Be Vietnam Pro, sans-serif',
            }}>
              Số Lượng ({selectedIngredientUnit || '?'})
            </label>
            <input
              type="number"
              value={form.quantity}
              onChange={e => onFormChange('quantity', e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: '11px 14px',
                border: `1.5px solid ${colors.primaryLight}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                boxSizing: 'border-box',
                color: colors.text,
                backgroundColor: colors.white,
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'Be Vietnam Pro, sans-serif',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary
                e.target.style.boxShadow = `0 0 0 2px ${colors.primaryVeryLight}`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.primaryLight
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Unit Price Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: colors.text,
              marginBottom: '7px',
              fontFamily: 'Be Vietnam Pro, sans-serif',
            }}>
              Đơn Giá (VNĐ)
            </label>
            <input
              type="number"
              value={form.unitprice}
              onChange={e => onFormChange('unitprice', e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: '11px 14px',
                border: `1.5px solid ${colors.primaryLight}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                boxSizing: 'border-box',
                color: colors.text,
                backgroundColor: colors.white,
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'Be Vietnam Pro, sans-serif',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary
                e.target.style.boxShadow = `0 0 0 2px ${colors.primaryVeryLight}`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.primaryLight
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Total Amount Box */}
        <div style={{
          backgroundColor: colors.primaryVeryLight,
          padding: '14px 16px',
          borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: colors.textLight,
            marginBottom: '6px',
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}>
            Tổng Tiền Phiếu
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: '700',
            color: colors.primary,
            lineHeight: '1',
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}>
            {totalAmount.toLocaleString('vi-VN')} VNĐ
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '11px 16px',
              border: `1.5px solid ${colors.primary}`,
              background: colors.white,
              color: colors.primary,
              borderRadius: '10px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              letterSpacing: '0.2px',
              transition: 'all 0.2s ease',
              opacity: isSubmitting ? 0.6 : 1,
              fontFamily: 'Be Vietnam Pro, sans-serif',
            }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = colors.primaryVeryLight)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.white)}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmitWithLoading}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '11px 16px',
              background: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: '10px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              letterSpacing: '0.2px',
              transition: 'all 0.2s ease',
              opacity: isSubmitting ? 0.8 : 1,
              boxShadow: `0 4px 12px ${colors.primary}30`,
              fontFamily: 'Be Vietnam Pro, sans-serif',
            }}
            onMouseEnter={(e) => !isSubmitting && (
              e.currentTarget.style.transform = 'translateY(-1px)',
              e.currentTarget.style.boxShadow = `0 6px 16px ${colors.primary}40`
            )}
            onMouseLeave={(e) => (
              e.currentTarget.style.transform = 'translateY(0)',
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}30`
            )}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestockModal
