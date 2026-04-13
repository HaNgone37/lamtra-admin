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

interface AuditModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  form: { actualStock: string; reason: string }
  onFormChange: (field: string, value: string) => void
  selectedIngredientName: string
  currentStock: number
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  selectedIngredientName,
  currentStock,
}) => {
  if (!isOpen) return null

  const actualStock = parseInt(form.actualStock || '0')
  const difference = actualStock - currentStock

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
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
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: colors.text, marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>
          Kiểm kê nguyên liệu
        </h2>

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: colors.textLight, fontSize: '12px' }}>
              Tồn hiện tại:
            </label>
            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.primary }}>
              {currentStock}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: colors.textLight, fontSize: '12px' }}>
              Chênh lệch:
            </label>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: difference === 0 ? colors.textLight : difference > 0 ? colors.success : colors.error,
              }}
            >
              {difference > 0 ? '+' : ''}{difference}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Tồn thực tế:
          </label>
          <input
            type="number"
            value={form.actualStock}
            onChange={e => onFormChange('actualStock', e.target.value)}
            placeholder="Nhập số lượng kiểm kê"
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
            Lý do chênh lệch:
          </label>
          <select
            value={form.reason}
            onChange={e => onFormChange('reason', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="Hao hụt">Hao hụt</option>
            <option value="Hỏng">Hỏng</option>
            <option value="Đếm lại">Đếm lại</option>
            <option value="Khác">Khác</option>
          </select>
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
              background: colors.success,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Lưu kiểm kê
          </button>
        </div>
      </div>
    </div>
  )
}
