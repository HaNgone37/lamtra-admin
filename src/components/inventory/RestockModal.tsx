import React, { useState, useEffect, useRef } from 'react'

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
  const quantityInputRef = useRef<HTMLInputElement>(null)
  
  // Auto-focus khi modal mở
  useEffect(() => {
    if (isOpen && quantityInputRef.current) {
      setTimeout(() => quantityInputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  if (!isOpen) return null

  // ===== Tính toán =====
  const quantity = Math.max(0, parseInt(form.quantity || '0'))
  const unitprice = Math.max(0, parseInt(form.unitprice || '0'))
  const totalAmount = quantity * unitprice
  
  // ===== Validation =====
  const isFormValid = quantity > 0 && unitprice > 0
  
  const handleSubmitWithLoading = async () => {
    if (!isFormValid) return
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  // ===== Prevent negative numbers =====
  const handleQuantityChange = (value: string) => {
    const num = parseInt(value || '0')
    if (num < 0) return
    onFormChange('quantity', value)
  }

  const handleUnitpriceChange = (value: string) => {
    const num = parseInt(value || '0')
    if (num < 0) return
    onFormChange('unitprice', value)
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
        backdropFilter: 'blur(8px)',
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
            📦 Nhập Kho
          </h2>
          <p style={{
            color: colors.textLight,
            margin: 0,
            fontSize: '12px',
            fontWeight: '500',
            lineHeight: '18px',
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}>
            {selectedIngredientName || 'N/A'} • {selectedIngredientUnit || 'N/A'}
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
              Số Lượng ({selectedIngredientUnit || 'cái'})
            </label>
            <input
              ref={quantityInputRef}
              type="number"
              min="0"
              value={form.quantity}
              onChange={e => handleQuantityChange(e.target.value)}
              placeholder="Nhập số lượng"
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
                e.currentTarget.style.borderColor = colors.primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primaryVeryLight}`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.primaryLight
                e.currentTarget.style.boxShadow = 'none'
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
              min="0"
              value={form.unitprice}
              onChange={e => handleUnitpriceChange(e.target.value)}
              placeholder="Nhập đơn giá"
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
                e.currentTarget.style.borderColor = colors.primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primaryVeryLight}`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.primaryLight
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Total Amount Box */}
        <div style={{
          backgroundColor: isFormValid ? colors.primaryVeryLight : '#F5F5F5',
          padding: '14px 16px',
          borderRadius: '12px',
          marginBottom: '24px',
          transition: 'all 0.3s ease',
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
            color: isFormValid ? colors.primary : colors.textLight,
            lineHeight: '1',
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}>
            {totalAmount > 0 ? totalAmount.toLocaleString('vi-VN') : '0'} VNĐ
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
            disabled={isSubmitting || !isFormValid}
            style={{
              flex: 1,
              padding: '11px 16px',
              background: isFormValid ? colors.primary : '#CCCCCC',
              color: colors.white,
              border: 'none',
              borderRadius: '10px',
              cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '13px',
              letterSpacing: '0.2px',
              transition: 'all 0.2s ease',
              opacity: isFormValid ? 1 : 0.6,
              boxShadow: isFormValid ? `0 4px 12px ${colors.primary}30` : 'none',
              fontFamily: 'Be Vietnam Pro, sans-serif',
            }}
            onMouseEnter={(e) => isFormValid && !isSubmitting && (
              e.currentTarget.style.transform = 'translateY(-1px)',
              e.currentTarget.style.boxShadow = `0 6px 16px ${colors.primary}40`
            )}
            onMouseLeave={(e) => isFormValid && (
              e.currentTarget.style.transform = 'translateY(0)',
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}30`
            )}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestockModal
