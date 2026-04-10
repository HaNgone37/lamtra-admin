import React, { useState } from 'react'
import { X } from 'lucide-react'

interface AddIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; unit: string; baseprice: string; minstocklevel: string }) => Promise<void>
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    unit: 'g',
    baseprice: '',
    minstocklevel: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên nguyên liệu')
      return
    }
    if (!formData.baseprice || isNaN(Number(formData.baseprice))) {
      setError('Vui lòng nhập giá cơ bản hợp lệ')
      return
    }
    if (!formData.minstocklevel || isNaN(Number(formData.minstocklevel))) {
      setError('Vui lòng nhập tồn kho tối thiểu hợp lệ')
      return
    }

    try {
      setIsLoading(true)
      await onSubmit(formData)
      setFormData({ name: '', unit: 'g', baseprice: '', minstocklevel: '' })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi thêm nguyên liệu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '90%',
          padding: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            borderBottom: '1px solid #E0E5F2',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#2B3674' }}>
            Thêm Nguyên Liệu
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
              justifyContent: 'center',
            }}
          >
            <X size={20} color="#8F9CB8" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#FFE5E5',
                border: '1px solid #FF4444',
                color: '#D32F2F',
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#2B3674' }}>
              Tên Nguyên Liệu *
            </label>
            <input
              type="text"
              placeholder="Nhập tên nguyên liệu"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E0E5F2',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Unit */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#2B3674' }}>
              Đơn Vị *
            </label>
            <select
              value={formData.unit}
              onChange={e => setFormData({ ...formData, unit: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E0E5F2',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            >
              <option value="g">Gam (g)</option>
              <option value="ml">Mililit (ml)</option>
              <option value="cái">Cái</option>
              <option value="chai">Chai</option>
              <option value="hộp">Hộp</option>
            </select>
          </div>

          {/* Base Price */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#2B3674' }}>
              Giá Cơ Bản (VNĐ) *
            </label>
            <input
              type="number"
              placeholder="0"
              value={formData.baseprice}
              onChange={e => setFormData({ ...formData, baseprice: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E0E5F2',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Min Stock Level */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#2B3674' }}>
              Tồn Kho Tối Thiểu ({formData.unit}) *
            </label>
            <input
              type="number"
              placeholder="0"
              value={formData.minstocklevel}
              onChange={e => setFormData({ ...formData, minstocklevel: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E0E5F2',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #E0E5F2',
                backgroundColor: '#F3F4F6',
                color: '#2B3674',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                backgroundColor: '#4318FF',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Đang thêm...' : 'Thêm Nguyên Liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
