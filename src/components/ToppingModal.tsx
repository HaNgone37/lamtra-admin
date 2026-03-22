import React, { useState, useEffect } from 'react'
import { X, Loader } from 'lucide-react'
import { toppingService } from '@/services/productService'
import { Topping } from '@/types'

interface ToppingModalProps {
  isOpen: boolean
  isEdit: boolean
  topping: Topping | null
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export default function ToppingModal({
  isOpen,
  isEdit,
  topping,
  onClose,
  onSuccess,
  onError
}: ToppingModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageurl: '',
    isavailable: true
  })

  useEffect(() => {
    if (isEdit && topping) {
      setFormData({
        name: topping.name,
        price: topping.price.toString(),
        imageurl: topping.imageurl,
        isavailable: topping.isavailable
      })
    } else {
      setFormData({ name: '', price: '', imageurl: '', isavailable: true })
    }
  }, [isEdit, topping, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      onError('Vui lòng nhập tên topping')
      return false
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      onError('Giá topping phải là số dương')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      if (isEdit && topping) {
        await toppingService.updateTopping(topping.toppingid, {
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          imageurl: formData.imageurl.trim() || 'https://via.placeholder.com/200',
          isavailable: formData.isavailable
        })
      } else {
        await toppingService.createTopping({
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          imageurl: formData.imageurl.trim() || 'https://via.placeholder.com/200',
          isavailable: formData.isavailable
        })
      }

      setFormData({ name: '', price: '', imageurl: '', isavailable: true })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error:', error)
      onError(isEdit ? 'Lỗi khi cập nhật topping. Vui lòng thử lại.' : 'Lỗi khi tạo topping. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #E0E5F2'
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2B3674', margin: 0 }}>
            {isEdit ? 'Chỉnh Sửa Topping' : 'Thêm Topping'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={24} style={{ color: '#8F9CB8' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tên topping */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Tên topping<span style={{ color: '#F56565' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="VD: Trân châu"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E5F2',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Giá */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Giá (VNĐ)<span style={{ color: '#F56565' }}>*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="VD: 15000"
                min="0"
                step="1000"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E5F2',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* URL ảnh */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                URL Ảnh
              </label>
              <input
                type="url"
                name="imageurl"
                value={formData.imageurl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E5F2',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Còn hàng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                name="isavailable"
                checked={formData.isavailable}
                onChange={handleInputChange}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#2B3674', cursor: 'pointer', margin: 0 }}>
                Còn hàng
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #E0E5F2',
                borderRadius: '8px',
                backgroundColor: '#F4F7FE',
                color: '#2B3674',
                fontWeight: '600',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#4318FF',
                color: '#FFFFFF',
                fontWeight: '600',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
