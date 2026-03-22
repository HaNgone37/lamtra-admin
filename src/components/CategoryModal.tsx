import React, { useState, useEffect } from 'react'
import { X, Loader } from 'lucide-react'
import { categoryService } from '@/services/productService'
import { Category } from '@/types'

interface CategoryModalProps {
  isOpen: boolean
  isEdit: boolean
  category: Category | null
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export default function CategoryModal({
  isOpen,
  isEdit,
  category,
  onClose,
  onSuccess,
  onError
}: CategoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (isEdit && category) {
      setFormData({
        name: category.name,
        description: category.description
      })
    } else {
      setFormData({ name: '', description: '' })
    }
  }, [isEdit, category, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      onError('Vui lòng nhập tên danh mục')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      if (isEdit && category) {
        await categoryService.updateCategory(category.categoryid, {
          name: formData.name.trim(),
          description: formData.description.trim()
        })
      } else {
        await categoryService.createCategory({
          name: formData.name.trim(),
          description: formData.description.trim()
        })
      }

      setFormData({ name: '', description: '' })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error:', error)
      onError(isEdit ? 'Lỗi khi cập nhật danh mục. Vui lòng thử lại.' : 'Lỗi khi tạo danh mục. Vui lòng thử lại.')
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
          width: '90%'
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
            {isEdit ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục'}
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
            {/* Tên danh mục */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Tên danh mục<span style={{ color: '#F56565' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="VD: Cà phê"
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

            {/* Mô tả */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả danh mục"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E5F2',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
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
