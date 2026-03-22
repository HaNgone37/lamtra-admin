import { useState } from 'react'
import { X } from 'lucide-react'
import { voucherService } from '@/services/voucherService'
import type { Voucher } from '@/services/voucherService'

const COLORS = {
  bg: '#F4F7FE',
  card: '#FFFFFF',
  text: '#2B3674',
  textLight: '#A3AED0',
  primary: '#4318FF',
  success: '#00A869',
  warning: '#FF9900',
  border: '#E0E5F2'
}

interface CreateVoucherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (voucher: Voucher) => void
  onError: (message: string) => void
}

export default function CreateVoucherModal({ isOpen, onClose, onSuccess, onError }: CreateVoucherModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountvalue: 0,
    discounttype: '%' as '%' | 'Tiền mặt',
    maxdiscount: 0,
    minordervalue: 0,
    expirydate: '',
    iswelcome: false,
    pointsrequired: 0
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    if (!formData.code.trim()) {
      onError('Vui lòng nhập mã voucher')
      return
    }
    if (!formData.title.trim()) {
      onError('Vui lòng nhập tiêu đề voucher')
      return
    }
    if (formData.discountvalue <= 0) {
      onError('Giá trị giảm phải lớn hơn 0')
      return
    }
    if (formData.discounttype === '%' && formData.discountvalue > 100) {
      onError('Phần trăm giảm không được quá 100%')
      return
    }
    if (!formData.expirydate) {
      onError('Vui lòng chọn ngày hết hạn')
      return
    }

    setLoading(true)
    try {
      const newVoucher = await voucherService.createVoucher({
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        discountvalue: formData.discountvalue,
        discounttype: formData.discounttype,
        maxdiscount: formData.maxdiscount,
        minordervalue: formData.minordervalue,
        expirydate: new Date(formData.expirydate).toISOString(),
        iswelcome: formData.iswelcome,
        pointsrequired: formData.pointsrequired
      })

      if (newVoucher) {
        onSuccess(newVoucher)
        setFormData({
          code: '',
          title: '',
          discountvalue: 0,
          discounttype: '%',
          maxdiscount: 0,
          minordervalue: 0,
          expirydate: '',
          iswelcome: false,
          pointsrequired: 0
        })
        onClose()
      }
    } catch (error) {
      console.error('❌ Error creating voucher:', error)
      onError('Lỗi tạo voucher: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: COLORS.card,
        borderRadius: '20px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.text, margin: 0 }}>
            Tạo Voucher Mới
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={24} color={COLORS.textLight} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: Code & Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
                Mã Voucher *
              </label>
              <input
                type="text"
                name="code"
                placeholder="VD: TET2025"
                value={formData.code}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
                Tiêu Đề *
              </label>
              <input
                type="text"
                name="title"
                placeholder="VD: Voucher Tết 2025"
                value={formData.title}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Row 2: Discount Value & Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
                Giá Trị Giảm *
              </label>
              <input
                type="number"
                name="discountvalue"
                min="1"
                value={formData.discountvalue}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
                Loại Giảm *
              </label>
              <select
                name="discounttype"
                value={formData.discounttype}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="%">Phần Trăm (%)</option>
                <option value="Tiền mặt">Tiền Mặt (VNĐ)</option>
              </select>
            </div>
          </div>

          {/* Discount Type Helper Text */}
          {formData.discounttype === 'Tiền mặt' && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#FFF7E6',
              borderLeft: `4px solid ${COLORS.warning}`,
              borderRadius: '6px'
            }}>
              <p style={{ fontSize: '12px', color: COLORS.warning, margin: 0, fontWeight: '500' }}>
                💡 Với loại "Tiền mặt", trường "Giảm tối đa" bị vô hiệu vì giá trị giảm chính là mức tối đa.
              </p>
            </div>
          )}
          {formData.discounttype === '%' && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#E3F2FD',
              borderLeft: `4px solid ${COLORS.primary}`,
              borderRadius: '6px'
            }}>
              <p style={{ fontSize: '12px', color: COLORS.primary, margin: 0, fontWeight: '500' }}>
                💡 Với loại "Phần trăm", giá trị giảm không được vượt quá 100%.
              </p>
            </div>
          )}

          {/* Row 3: Min Order & Max Discount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
                Đơn Tối Thiểu (VNĐ)
              </label>
              <input
                type="number"
                name="minordervalue"
                min="0"
                value={formData.minordervalue}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
                Giảm Tối Đa (VNĐ)
              </label>
              <input
                type="number"
                name="maxdiscount"
                min="0"
                value={formData.maxdiscount}
                onChange={handleInputChange}
                disabled={formData.discounttype === 'Tiền mặt'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${formData.discounttype === 'Tiền mặt' ? '#E0E5F2' : COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: formData.discounttype === 'Tiền mặt' ? '#F5F5F5' : 'white',
                  cursor: formData.discounttype === 'Tiền mặt' ? 'not-allowed' : 'text',
                  opacity: formData.discounttype === 'Tiền mặt' ? 0.6 : 1,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Row 4: Expiry Date & Points */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
                Ngày Hết Hạn *
              </label>
              <input
                type="date"
                name="expirydate"
                value={formData.expirydate}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
                Điểm Cần Để Đổi
              </label>
              <input
                type="number"
                name="pointsrequired"
                min="0"
                value={formData.pointsrequired}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Checkbox: Welcome Gift */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="iswelcome"
              name="iswelcome"
              checked={formData.iswelcome}
              onChange={handleInputChange}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="iswelcome" style={{ fontSize: '13px', color: COLORS.text, cursor: 'pointer', margin: 0 }}>
              Tặng tự động cho thành viên mới
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
                color: COLORS.text,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                backgroundColor: loading ? COLORS.textLight : COLORS.primary,
                color: COLORS.card,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Đang tạo...' : '✅ Tạo Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
