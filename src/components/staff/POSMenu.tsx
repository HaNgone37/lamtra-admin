import React, { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { ShoppingCart, AlertCircle } from 'lucide-react'

// ═════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════

interface Product {
  productid: number
  name: string
  description?: string
  imageurl: string
  baseprice: number
  saleprice: number
  status: string
}

interface Size {
  sizeid: number
  name: string
  additionalprice: number
}

interface POSMenuProps {
  branchId: number
  onAddToCart: (product: Product, selectedSize: Size, quantity: number) => void
}

// ═════════════════════════════════════════════════════════════════
// POS MENU COMPONENT
// ═════════════════════════════════════════════════════════════════

export const POSMenu: React.FC<POSMenuProps> = ({ branchId, onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [quantity, setQuantity] = useState(1)

  // ─────────────────────────────────────────────────────────────
  // LOAD PRODUCTS & SIZES
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load products available at branch, limit to 15
        const { data: productsData, error: productsErr } = await supabase
          .from('products')
          .select('productid, name, description, imageurl, baseprice, saleprice, status')
          .eq('status', 'Còn')
          .limit(15)

        if (productsErr) throw productsErr

        // Load sizes
        const { data: sizesData, error: sizesErr } = await supabase
          .from('sizes')
          .select('sizeid, name, additionalprice')

        if (sizesErr) throw sizesErr

        setProducts(productsData || [])
        setSizes(sizesData || [])

        // Set default size (first available)
        if (sizesData && sizesData.length > 0) {
          setSelectedSize(sizesData[0])
        }
      } catch (error) {
        console.error('❌ Error loading menu:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [branchId])

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedSize) return

    onAddToCart(selectedProduct, selectedSize, quantity)

    // Reset
    setSelectedProduct(null)
    setQuantity(1)
  }

  const getPrice = (product: Product, size: Size) => {
    const basePrice = product.saleprice || product.baseprice
    return basePrice + (size.additionalprice || 0)
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: LOADING STATE
  // ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="bg-white rounded-[20px] p-8 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Đang tải thực đơn...</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: PRODUCT GRID
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-[20px] p-4 border border-gray-200">
      {/* Header */}
      <h3 className="font-bold text-navy text-lg mb-4">☕ Thực đơn ({products.length})</h3>

      {/* Product Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-3 mb-4 max-h-[500px] overflow-y-auto">
        {products.map((product) => (
          <button
            key={product.productid}
            onClick={() => setSelectedProduct(product)}
            className={`
              rounded-[15px] p-3 transition-all transform hover:scale-105
              ${selectedProduct?.productid === product.productid
                ? 'ring-2 ring-primary bg-blue-50'
                : 'bg-gray-50 hover:bg-gray-100'
              }
            `}
          >
            {/* Product Image */}
            {product.imageurl ? (
              <img
                src={product.imageurl}
                alt={product.name}
                className="w-full h-20 object-cover rounded-[10px] mb-2"
              />
            ) : (
              <div className="w-full h-20 bg-gray-200 rounded-[10px] mb-2 flex items-center justify-center">
                <span className="text-2xl">☕</span>
              </div>
            )}

            {/* Product Info */}
            <p className="font-semibold text-sm text-navy line-clamp-2">{product.name}</p>
            <p className="text-xs text-primary font-bold mt-2">
              {(product.saleprice || product.baseprice).toLocaleString()}đ
            </p>
          </button>
        ))}
      </div>

      {/* Selected Product Details */}
      {selectedProduct ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[15px] p-4 border border-blue-200">
          {/* Product Name */}
          <p className="font-bold text-navy text-lg">{selectedProduct.name}</p>
          {selectedProduct.description && (
            <p className="text-xs text-gray-600 mt-1">{selectedProduct.description}</p>
          )}

          {/* Size Selection */}
          <div className="mt-3">
            <label className="block text-xs text-gray-600 font-medium mb-2">📏 Chọn size:</label>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((size) => (
                <button
                  key={size.sizeid}
                  onClick={() => setSelectedSize(size)}
                  className={`
                    px-4 py-2 rounded-[10px] text-xs font-medium transition-all
                    ${selectedSize?.sizeid === size.sizeid
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'
                    }
                  `}
                >
                  {size.name}
                  {size.additionalprice > 0 && (
                    <span className="ml-1 text-xs opacity-75">+{size.additionalprice}đ</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="mt-3 flex items-center justify-between">
            <label className="text-xs text-gray-600 font-medium">📦 Số lượng:</label>
            <div className="flex items-center gap-1 bg-gray-200 rounded-[10px] p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 hover:bg-gray-300 rounded-lg text-navy font-bold transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center font-bold text-navy">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 hover:bg-gray-300 rounded-lg text-navy font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Price Summary */}
          {selectedSize && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 text-sm">Đơn giá:</span>
                <span className="font-bold text-primary">
                  {getPrice(selectedProduct, selectedSize).toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Tổng cộng:</span>
                <span className="text-lg font-bold text-primary">
                  {(getPrice(selectedProduct, selectedSize) * quantity).toLocaleString()}đ
                </span>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full mt-4 py-3 bg-primary hover:bg-primaryDark text-white rounded-[15px] font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} />
            Thêm vào giỏ
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-[15px] p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-600 text-sm font-medium">Chọn sản phẩm để tiếp tục</p>
        </div>
      )}
    </div>
  )
}

// Color palette export
export const palette = {
  primary: '#4318FF',
  primaryDark: '#2D0A7A',
  navy: '#2B3674'
}
