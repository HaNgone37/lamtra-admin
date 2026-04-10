import React, { useState, useEffect } from 'react'
import { X, Loader, XCircle } from 'lucide-react'
import { productService } from '@/services/productService'
import { Product, Category } from '@/types'

interface EditProductModalProps {
  isOpen: boolean
  product: Product | null
  categories: Category[]
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export default function EditProductModal({
  isOpen,
  product,
  categories,
  onClose,
  onSuccess,
  onError
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    baseprice: '',
    saleprice: '',
    imageurl: '',
    status: 'Đang bán',
    categoryid: ''
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        subtitle: product.subtitle,
        description: product.description,
        baseprice: product.baseprice.toString(),
        saleprice: product.saleprice != null ? product.saleprice.toString() : '',
        imageurl: product.imageurl,
        status: product.status,
        categoryid: String(product.categoryid)
      })
    }
  }, [product, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      onError('Vui lòng nhập tên sản phẩm')
      return false
    }
    if (!formData.baseprice || parseFloat(formData.baseprice) <= 0) {
      onError('Giá sản phẩm phải là số dương')
      return false
    }
    if (formData.saleprice !== '' && parseInt(formData.saleprice, 10) >= parseFloat(formData.baseprice)) {
      onError('Giá khuyến mãi phải nhỏ hơn giá cơ sở')
      return false
    }
    if (!formData.categoryid) {
      onError('Vui lòng chọn danh mục')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !product) return

    try {
      setLoading(true)

      await productService.updateProduct(String(product.productid), {
        name: formData.name.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        baseprice: parseFloat(formData.baseprice),
        saleprice: formData.saleprice !== '' ? parseInt(formData.saleprice, 10) : null,
        imageurl: formData.imageurl.trim() || 'https://via.placeholder.com/200',
        status: formData.status,
        categoryid: formData.categoryid
      } as any)

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating product:', error)
      onError('Lỗi khi cập nhật sản phẩm. Vui lòng thử lại.')
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
          maxWidth: '500px',
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
            Chỉnh Sửa Sản Phẩm
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} style={{ color: '#8F9CB8' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tên sản phẩm */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Tên sản phẩm<span style={{ color: '#F56565' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="VD: Cà phê đen"
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

            {/* Danh mục */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Danh mục<span style={{ color: '#F56565' }}>*</span>
              </label>
              <select
                name="categoryid"
                value={formData.categoryid}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E5F2',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(cat => (
                  <option key={cat.categoryid} value={cat.categoryid}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Giá cơ sở */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Giá cơ sở (VNĐ)<span style={{ color: '#F56565' }}>*</span>
              </label>
              <input
                type="number"
                name="baseprice"
                value={formData.baseprice}
                onChange={handleInputChange}
                placeholder="VD: 45000"
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

            {/* Giá khuyến mãi */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Giá khuyến mãi (VNĐ)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  name="saleprice"
                  value={formData.saleprice}
                  onChange={handleInputChange}
                  placeholder="Để trống nếu không khuyến mãi"
                  min="0"
                  step="1000"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #E0E5F2',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, saleprice: '' }))}
                  title="Xóa giá khuyến mãi"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <XCircle size={20} style={{ color: formData.saleprice !== '' ? '#F56565' : '#CBD5E0' }} />
                </button>
              </div>
            </div>

            {/* Phụ đề */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Phụ đề
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                placeholder="VD: Đắng và đậm đà"
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
                placeholder="Mô tả chi tiết sản phẩm"
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

            {/* Trạng thái */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2B3674', marginBottom: '8px' }}>
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E5F2',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Đang bán">Đang bán</option>
                <option value="Ngưng bán">Ngưng bán</option>
              </select>
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
              {loading ? 'Đang lưu...' : 'Cập nhật sản phẩm'}
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
