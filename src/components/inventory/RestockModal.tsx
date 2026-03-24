import React from 'react'

// ============ COLOR SCHEME ============
const colors = {
  primary: '#4318FF',
  text: '#2B3674',
  textLight: '#8F9CB8',
  border: '#E0E5F2',
  success: '#05B75D',
  error: '#F3685A',
  warning: '#FEC90F',
  background: '#F3F4F6',
}

interface RestockModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  form: { quantity: string; unitprice: string }
  onFormChange: (field: string, value: string) => void
  selectedIngredientName: string
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  selectedIngredientName,
}) => {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: colors.text, marginTop: 0, marginBottom: '20px' }}>Nhập kho</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Nguyên liệu:
          </label>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: colors.background,
              borderRadius: '6px',
              color: colors.text,
              fontWeight: '500',
            }}
          >
            {selectedIngredientName || 'N/A'}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Số lượng nhập:
          </label>
          <input
            type="number"
            value={form.quantity}
            onChange={e => onFormChange('quantity', e.target.value)}
            placeholder="Nhập số lượng"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Đơn giá (đ):
          </label>
          <input
            type="number"
            value={form.unitprice}
            onChange={e => onFormChange('unitprice', e.target.value)}
            placeholder="Nhập đơn giá"
            step="0.01"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div
          style={{
            backgroundColor: colors.background,
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.text, fontWeight: '600' }}>
            <span>Tổng cộng:</span>
            <span>
              {(parseInt(form.quantity || '0') * parseFloat(form.unitprice || '0')).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.text,
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            style={{
              flex: 1,
              padding: '10px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}
