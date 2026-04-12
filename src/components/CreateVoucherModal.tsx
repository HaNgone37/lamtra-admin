import { useState } from 'react'
import { X } from 'lucide-react'
import { voucherService } from '@/services/voucherService'
import type { Voucher } from '@/services/voucherService'

// Lam Trà Pink Theme
const COLORS = {
  pink_light: '#f5d5e0',
  pink_medium: '#f06192',
  pink_dark: '#d41c63',
  navy: '#1a1840',
  navy_light: '#2d2b5f',
  white: '#ffffff',
  gray: '#f5f5f5',
  error: '#d32f2f'
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
    pointsrequired: 0,
    iswelcome: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any
    let updatedValue: any = 
      type === 'number' ? (parseInt(value) || 0) : 
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
      value

    setFormData(prev => {
      const newData = { ...prev, [name]: updatedValue }
      
      // Nếu tick Welcome, reset pointsrequired về 0
      if (name === 'iswelcome' && updatedValue === true) {
        newData.pointsrequired = 0
      }

      return newData
    })
  }

  // Format date để hiển thị dd/mm/yyyy
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      expirydate: e.target.value
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
        pointsrequired: formData.iswelcome ? 0 : formData.pointsrequired,
        scope: 'Toàn chuỗi',
        iswelcome: formData.iswelcome
      })

      if (newVoucher) {
        onSuccess(newVoucher)
        // Reset form
        setFormData({
          code: '',
          title: '',
          discountvalue: 0,
          discounttype: '%',
          maxdiscount: 0,
          minordervalue: 0,
          expirydate: '',
          pointsrequired: 0,
          iswelcome: false
        })
      }
    } catch (err: any) {
      onError(err.message || 'Có lỗi khi tạo voucher')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: '"Be Vietnam Pro", sans-serif'
    }}>
      <div style={{
        backgroundColor: COLORS.white,
        borderRadius: '24px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: `1px solid ${COLORS.pink_light}`,
          sticky: 'top',
          backgroundColor: COLORS.white,
          borderRadius: '24px 24px 0 0'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: COLORS.navy,
            letterSpacing: '-0.5px'
          }}>
            Tạo Voucher Mới
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} color={COLORS.navy} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* BLOCK 1: Thông tin cơ bản */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              {/* Mã Voucher */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: COLORS.navy,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Mã Voucher
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="VCH2024..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${COLORS.pink_light}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: '"Be Vietnam Pro", sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: COLORS.white,
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = COLORS.pink_medium)}
                  onBlur={(e) => (e.target.style.borderColor = COLORS.pink_light)}
                />
              </div>

              {/* Tiêu đề */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: COLORS.navy,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Tiêu đề
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Giảm 20%..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${COLORS.pink_light}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: '"Be Vietnam Pro", sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: COLORS.white,
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = COLORS.pink_medium)}
                  onBlur={(e) => (e.target.style.borderColor = COLORS.pink_light)}
                />
              </div>
            </div>
          </div>

          {/* BLOCK 2: Giá trị */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              {/* Giá trị giảm */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: COLORS.navy,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Giá trị giảm
                </label>
                <input
                  type="number"
                  name="discountvalue"
                  value={formData.discountvalue}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="20"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${COLORS.pink_light}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: '"Be Vietnam Pro", sans-serif',
                    outline: 'none',
                    backgroundColor: COLORS.white,
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = COLORS.pink_medium)}
                  onBlur={(e) => (e.target.style.borderColor = COLORS.pink_light)}
                />
              </div>

              {/* Loại giảm */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: COLORS.navy,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Loại giảm
                </label>
                <select
                  name="discounttype"
                  value={formData.discounttype}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${COLORS.pink_light}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: '"Be Vietnam Pro", sans-serif',
                    outline: 'none',
                    backgroundColor: COLORS.white,
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = COLORS.pink_medium)}
                  onBlur={(e) => (e.target.style.borderColor = COLORS.pink_light)}
                >
                  <option value="%">Phần trăm (%)</option>
                  <option value="Tiền mặt">Tiền mặt (VNĐ)</option>
                </select>
              </div>
            </div>

            {/* Đơn tối thiểu & Giảm tối đa (chỉ hiện khi là %) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginTop: '16px'
            }}>
              {/* Đơn tối thiểu */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: COLORS.navy,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Đơn tối thiểu
                </label>
                <input
                  type="number"
                  name="minordervalue"
                  value={formData.minordervalue}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="100000"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${COLORS.pink_light}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: '"Be Vietnam Pro", sans-serif',
                    outline: 'none',
                    backgroundColor: COLORS.white,
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = COLORS.pink_medium)}
                  onBlur={(e) => (e.target.style.borderColor = COLORS.pink_light)}
                />
              </div>

              {/* Giảm tối đa - HIDDEN khi Tiền mặt */}
              {formData.discounttype === '%' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: COLORS.navy,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Giảm tối đa
                  </label>
                  <input
                    type="number"
                    name="maxdiscount"
                    value={formData.maxdiscount}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="50000"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `2px solid ${COLORS.pink_light}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontFamily: '"Be Vietnam Pro", sans-serif',
                      outline: 'none',
                      backgroundColor: COLORS.white,
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = COLORS.pink_medium)}
                    onBlur={(e) => (e.target.style.borderColor = COLORS.pink_light)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* BLOCK 3: Cấu hình nâng cao */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              {/* Welcome Gift */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: COLORS.navy,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Quà Chào Mừng
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '12px 14px',
                  border: `2px solid ${COLORS.pink_light}`,
                  borderRadius: '12px',
                  backgroundColor: formData.iswelcome ? COLORS.pink_light : COLORS.white,
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    name="iswelcome"
                    checked={formData.iswelcome}
                    onChange={handleInputChange}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: COLORS.pink_dark
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: COLORS.navy
                  }}>
                    Tặng khách mới
                  </span>
                </label>
              </div>

              {/* Điểm cần đổi - MỜ khi Welcome = true */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: COLORS.navy,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: formData.iswelcome ? 0.5 : 1
                }}>
                  Điểm cần để đổi
                </label>
                <input
                  type="number"
                  name="pointsrequired"
                  value={formData.pointsrequired}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                  disabled={formData.iswelcome}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${formData.iswelcome ? COLORS.gray : COLORS.pink_light}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: '"Be Vietnam Pro", sans-serif',
                    outline: 'none',
                    backgroundColor: formData.iswelcome ? COLORS.gray : COLORS.white,
                    cursor: formData.iswelcome ? 'not-allowed' : 'text',
                    boxSizing: 'border-box',
                    opacity: formData.iswelcome ? 0.6 : 1
                  }}
                  onFocus={(e) => !formData.iswelcome && (e.target.style.borderColor = COLORS.pink_medium)}
                  onBlur={(e) => (e.target.style.borderColor = COLORS.pink_light)}
                />
              </div>
            </div>
          </div>

          {/* BLOCK 4: Thời gian */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: COLORS.navy,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Ngày hết hạn
            </label>
            <input
              type="date"
              name="expirydate"
              value={formData.expirydate}
              onChange={handleDateChange}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${COLORS.pink_light}`,
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: '"Be Vietnam Pro", sans-serif',
                outline: 'none',
                backgroundColor: COLORS.white,
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.pink_medium)}
              onBlur={(e) => (e.target.style.borderColor = COLORS.pink_light)}
            />
          </div>

          {/* Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '32px'
          }}>
            {/* Nút Hủy - xanh trắng viền hồng */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '14px 24px',
                border: `2px solid ${COLORS.pink_medium}`,
                backgroundColor: COLORS.white,
                color: COLORS.pink_medium,
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: '"Be Vietnam Pro", sans-serif',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1,
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = COLORS.pink_light)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.white)}
            >
              Hủy
            </button>

            {/* Nút Tạo Voucher - hồng đậm */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 24px',
                border: 'none',
                backgroundColor: loading ? COLORS.navy_light : COLORS.pink_dark,
                color: COLORS.white,
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: '"Be Vietnam Pro", sans-serif',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = COLORS.pink_medium)}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = COLORS.pink_dark)}
            >
              {loading ? 'Đang tạo...' : 'Tạo Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
