import React, { useState, useEffect } from 'react'
import { Ingredient } from '@/types'


interface AddInventoryItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (ingredientId: string | number) => void
  availableIngredients: Ingredient[]
  isLoading?: boolean
}

export const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableIngredients,
  isLoading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | number>('')
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  // ===== Auto-select ingredient when id changes =====
  useEffect(() => {
    if (selectedIngredientId) {
      const found = availableIngredients.find(ing => String(ing.ingredientid) === String(selectedIngredientId))
      setSelectedIngredient(found || null)
    } else {
      setSelectedIngredient(null)
    }
  }, [selectedIngredientId, availableIngredients])

  // ===== Reset form when modal closed =====
  useEffect(() => {
    if (!isOpen) {
      setSelectedIngredientId('')
      setSelectedIngredient(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedIngredientId || !selectedIngredient) return

    setIsSubmitting(true)
    try {
      await onSubmit(selectedIngredientId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = selectedIngredient !== null

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-7 max-w-md w-11/12 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Thêm Nguyên Liệu
          </h2>
          <p className="text-sm text-gray-500">
            Chọn nguyên liệu mới để thêm vào chi nhánh
          </p>
        </div>

        {/* Form Content */}
        <div className="space-y-4 mb-6">
          {/* Dropdown Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
              Chọn Nguyên Liệu (*)
            </label>

            <select
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-purple-300 rounded-lg text-sm font-medium text-gray-900 focus:border-purple-600 focus:outline-none transition-colors bg-white cursor-pointer"
            >
              <option value="">-- Chọn nguyên liệu --</option>
              {availableIngredients.map((ingredient) => (
                <option key={ingredient.ingredientid} value={ingredient.ingredientid}>
                  {ingredient.name} ({ingredient.unit})
                </option>
              ))}
            </select>

            {availableIngredients.length === 0 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Tất cả nguyên liệu đã có trong chi nhánh này
              </p>
            )}
          </div>

          {/* Selected Info Box */}
          {selectedIngredient && (
            <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded-lg">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                ✓ {selectedIngredient.name}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Đơn vị:</span>
                  <p className="font-semibold text-gray-900">
                    {selectedIngredient.unit || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Giá:</span>
                  <p className="font-semibold text-gray-900">
                    {selectedIngredient.baseprice?.toLocaleString('vi-VN') || 'N/A'} VNĐ
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Ngưỡng cảnh báo:</span>
                  <p className="font-semibold text-gray-900">
                    {selectedIngredient.minstocklevel || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid || isLoading}
            className="flex-1 px-4 py-2 bg-white text-purple-600 border border-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? 'Đang xử lý...' : '+ Thêm Nguyên Liệu'}
          </button>
        </div>
      </div>
    </div>
  )
}

