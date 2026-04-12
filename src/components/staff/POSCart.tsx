import React, { useState } from 'react'
import { Plus, Minus, Trash2, Edit2 } from 'lucide-react'

// ═════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════

export interface CartItem {
  id: string // uid = productid-sizeid-sugarlevel-icelevel-toppingids
  productid: number
  productname: string
  quantity: number
  sizeid: number
  sizename: string
  priceatorder: number
  subtotal: number
  sugarlevel: string // "0%" | "25%" | "50%" | "75%" | "100%"
  icelevel: string // "0%" | "25%" | "50%" | "75%" | "100%"
  toppings: Array<{ toppingid: number; name: string; price: number; quantity: number }>
}

interface POSCartProps {
  items: CartItem[]
  onUpdateItem: (id: string, updates: Partial<CartItem>) => void
  onRemoveItem: (id: string) => void
  totalAmount: number
  discountAmount: number
  orderNote: string
  onOrderNoteChange: (note: string) => void
}

// ═════════════════════════════════════════════════════════════════
// SIZE & CUSTOMIZATION OPTIONS
// ═════════════════════════════════════════════════════════════════

const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%']
const ICE_LEVELS = ['0%', '25%', '50%', '75%', '100%']

// ═════════════════════════════════════════════════════════════════
// POS CART COMPONENT
// ═════════════════════════════════════════════════════════════════

export const POSCart: React.FC<POSCartProps> = ({
  items,
  onUpdateItem,
  onRemoveItem,
  totalAmount,
  discountAmount,
  orderNote,
  onOrderNoteChange
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSugar, setEditingSugar] = useState('')
  const [editingIce, setEditingIce] = useState('')

  const finalAmount = Math.max(0, totalAmount - discountAmount)

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleUpdateQuantity = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const newQty = item.quantity + delta
    if (newQty <= 0) {
      onRemoveItem(id)
    } else {
      const pricePerItem = item.priceatorder / item.quantity
      onUpdateItem(id, {
        quantity: newQty,
        subtotal: pricePerItem * newQty
      })
    }
  }

  const handleStartEdit = (item: CartItem) => {
    setEditingId(item.id)
    setEditingSugar(item.sugarlevel)
    setEditingIce(item.icelevel)
  }

  const handleSaveEdit = (id: string) => {
    onUpdateItem(id, {
      sugarlevel: editingSugar,
      icelevel: editingIce
    })
    setEditingId(null)
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: EMPTY STATE
  // ─────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[20px] p-6 text-center">
        <div className="text-5xl mb-3">🛒</div>
        <p className="text-gray-600 font-medium">Giỏ hàng trống</p>
        <p className="text-xs text-gray-500 mt-2">Chọn sản phẩm để bắt đầu</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: CART ITEMS
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-[20px] p-4 border border-gray-200">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="font-bold text-navy text-lg">🛒 Giỏ hàng</h3>
        <p className="text-xs text-gray-600 mt-1">{items.length} sản phẩm</p>
      </div>

      {/* Items List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-50 rounded-[15px] p-3 hover:bg-gray-100 transition-colors">
            {/* Item Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm text-navy">{item.productname}</p>
                <p className="text-xs text-gray-600 mt-1">Size: {item.sizename}</p>
              </div>
              <p className="font-bold text-sm text-primary">
                {(item.subtotal).toLocaleString()}đ
              </p>
            </div>

            {/* Editing Mode */}
            {editingId === item.id ? (
              <div className="bg-white rounded-[10px] p-2 mb-2 space-y-2 border border-blue-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Đường</label>
                    <select
                      value={editingSugar}
                      onChange={(e) => setEditingSugar(e.target.value)}
                      className="w-full text-xs bg-gray-100 rounded-lg px-2 py-1 text-navy outline-none"
                    >
                      {SUGAR_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Đá</label>
                    <select
                      value={editingIce}
                      onChange={(e) => setEditingIce(e.target.value)}
                      className="w-full text-xs bg-gray-100 rounded-lg px-2 py-1 text-navy outline-none"
                    >
                      {ICE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => handleSaveEdit(item.id)}
                  className="w-full py-1 bg-primary hover:bg-primaryDark text-white text-xs rounded-lg font-medium transition-colors"
                >
                  ✓ Lưu
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-2 text-xs">
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg">
                  🍯 {item.sugarlevel}
                </span>
                <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-lg">
                  🧊 {item.icelevel}
                </span>
                {item.toppings.length > 0 && (
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-lg">
                    ⭐ {item.toppings.length} topping
                  </span>
                )}
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-200 rounded-[10px] p-1">
                <button
                  onClick={() => handleUpdateQuantity(item.id, -1)}
                  className="p-1 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <Minus size={14} className="text-navy" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-navy">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleUpdateQuantity(item.id, 1)}
                  className="p-1 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <Plus size={14} className="text-navy" />
                </button>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleStartEdit(item)}
                  className="p-1.5 hover:bg-blue-100 text-primary rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Note */}
      <div className="mb-4 p-3 bg-gray-50 rounded-[15px]">
        <label className="block text-xs text-gray-600 font-medium mb-2">📝 Ghi chú đơn</label>
        <textarea
          value={orderNote}
          onChange={(e) => onOrderNoteChange(e.target.value)}
          placeholder="Nhập yêu cầu đặc biệt (VD: Không đường, thêm lemon...)"
          className="w-full bg-white text-xs text-navy rounded-[10px] px-3 py-2 outline-none border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-40 resize-none"
          rows={2}
        />
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[15px] p-4 space-y-2 border border-blue-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tạm tính:</span>
          <span className="font-semibold text-navy">{totalAmount.toLocaleString()}đ</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm border-t border-blue-200 pt-2">
            <span className="text-red-600 font-medium">Giảm giá:</span>
            <span className="font-bold text-red-600">-{discountAmount.toLocaleString()}đ</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t border-blue-200 pt-2">
          <span className="text-navy">💰 Thành tiền:</span>
          <span className="text-primary text-lg">{finalAmount.toLocaleString()}đ</span>
        </div>
      </div>
    </div>
  )
}

// Color palette export
export const palette = {
  primary: '#4318FF',
  primaryDark: '#2D0A7A',
  navy: '#2B3674',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  white: '#FFFFFF'
}
