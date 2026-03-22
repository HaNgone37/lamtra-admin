import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Product, Category, Size, Topping } from '@/types'
import { Plus, Edit2, Trash2, Package, Layers, Maximize2, Sparkles } from 'lucide-react'
import Toast from '@/components/Toast'
import AddProductModal from '@/components/AddProductModal'
import EditProductModal from '@/components/EditProductModal'
import CategoryModal from '@/components/CategoryModal'
import SizeModal from '@/components/SizeModal'
import ToppingModal from '@/components/ToppingModal'
import { productService, categoryService, sizeService, toppingService } from '@/services/productService'

// ============= STATUS BADGE WITH CLICK (TOGGLABLE) =============
const TogglableStatusBadge = ({ status, type = 'product', onClick, isLoading }: { status: string | boolean; type?: 'product' | 'topping'; onClick: () => void; isLoading?: boolean }) => {
  let bgColor = '#F4F7FE'
  let textColor = '#2B3674'
  let dotColor = '#2B3674'
  let label = 'N/A'

  if (type === 'product') {
    if (status === 'Đang bán') {
      bgColor = '#E6FFFA'
      textColor = '#047857'
      dotColor = '#047857'
      label = 'Đang bán'
    } else {
      bgColor = '#FFF5F5'
      textColor = '#C53030'
      dotColor = '#C53030'
      label = 'Ngưng bán'
    }
  } else if (type === 'topping') {
    if (status === true) {
      bgColor = '#E6FFFA'
      textColor = '#047857'
      dotColor = '#047857'
      label = 'Còn hàng'
    } else {
      bgColor = '#FFF5F5'
      textColor = '#C53030'
      dotColor = '#C53030'
      label = 'Hết hàng'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => !isLoading && (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor }} />
      {label}
    </button>
  )
}

// ============= MAIN PRODUCTS COMPONENT =============
export const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'sizes' | 'toppings'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [toppings, setToppings] = useState<Topping[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  // Modal states for products
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productStatusLoading, setProductStatusLoading] = useState<string | null>(null)

  // Modal states for categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isEditCategoryMode, setIsEditCategoryMode] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // Modal states for sizes
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false)
  const [isEditSizeMode, setIsEditSizeMode] = useState(false)
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)

  // Modal states for toppings
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false)
  const [isEditToppingMode, setIsEditToppingMode] = useState(false)
  const [selectedTopping, setSelectedTopping] = useState<Topping | null>(null)
  const [toppingStatusLoading, setToppingStatusLoading] = useState<string | null>(null)

  // ============= LOAD DATA =============
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadProducts(), loadCategories(), loadSizes(), loadToppings()])
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadSizes = async () => {
    try {
      const data = await sizeService.getSizes()
      setSizes(data)
    } catch (error) {
      console.error('Error loading sizes:', error)
    }
  }

  const loadToppings = async () => {
    try {
      const data = await toppingService.getToppings()
      setToppings(data)
    } catch (error) {
      console.error('Error loading toppings:', error)
    }
  }

  // ============= TOAST HELPERS =============
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  // ============= PRODUCT HANDLERS =============
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return

    try {
      await productService.deleteProduct(productId)
      showToast('Xóa sản phẩm thành công', 'success')
      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      showToast('Lỗi khi xóa sản phẩm', 'error')
    }
  }

  const handleProductStatusToggle = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Đang bán' ? 'Ngưng bán' : 'Đang bán'
    
    try {
      setProductStatusLoading(productId)
      await productService.updateProductStatus(productId, newStatus)
      showToast(`Cập nhật trạng thái thành ${newStatus} thành công`, 'success')
      await loadProducts()
    } catch (error) {
      console.error('Error updating product status:', error)
      showToast('Lỗi khi cập nhật trạng thái', 'error')
    } finally {
      setProductStatusLoading(null)
    }
  }

  // ============= CATEGORY HANDLERS =============
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return

    try {
      await categoryService.deleteCategory(categoryId)
      showToast('Xóa danh mục thành công', 'success')
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      showToast('Lỗi khi xóa danh mục', 'error')
    }
  }

  // ============= SIZE HANDLERS =============
  const handleDeleteSize = async (sizeId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kích thước này?')) return

    try {
      await sizeService.deleteSize(sizeId)
      showToast('Xóa kích thước thành công', 'success')
      await loadSizes()
    } catch (error) {
      console.error('Error deleting size:', error)
      showToast('Lỗi khi xóa kích thước', 'error')
    }
  }

  // ============= TOPPING HANDLERS =============
  const handleDeleteTopping = async (toppingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa topping này?')) return

    try {
      await toppingService.deleteTopping(toppingId)
      showToast('Xóa topping thành công', 'success')
      await loadToppings()
    } catch (error) {
      console.error('Error deleting topping:', error)
      showToast('Lỗi khi xóa topping', 'error')
    }
  }

  const handleToppingStatusToggle = async (toppingId: string, currentStatus: boolean) => {
    try {
      setToppingStatusLoading(toppingId)
      await toppingService.updateToppingStatus(toppingId, !currentStatus)
      showToast(`Cập nhật trạng thái topping thành công`, 'success')
      await loadToppings()
    } catch (error) {
      console.error('Error updating topping status:', error)
      showToast('Lỗi khi cập nhật trạng thái topping', 'error')
    } finally {
      setToppingStatusLoading(null)
    }
  }

  // ============= CONTEXT-AWARE ADD BUTTON =============
  const handleAddNewClick = () => {
    switch (activeTab) {
      case 'products':
        setIsAddProductModalOpen(true)
        break
      case 'categories':
        setIsEditCategoryMode(false)
        setSelectedCategory(null)
        setIsCategoryModalOpen(true)
        break
      case 'sizes':
        setIsEditSizeMode(false)
        setSelectedSize(null)
        setIsSizeModalOpen(true)
        break
      case 'toppings':
        setIsEditToppingMode(false)
        setSelectedTopping(null)
        setIsToppingModalOpen(true)
        break
    }
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.categoryid === categoryId)?.name || 'Chưa phân loại'
  }

  const tabConfig = [
    { id: 'products', label: 'Sản phẩm', icon: Package },
    { id: 'categories', label: 'Danh mục', icon: Layers },
    { id: 'sizes', label: 'Kích thước', icon: Maximize2 },
    { id: 'toppings', label: 'Topping', icon: Sparkles }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#2B3674', margin: 0 }}>Quản lý thực đơn</h1>
        <button
          onClick={handleAddNewClick}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            backgroundColor: '#4318FF',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3810D9')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#4318FF')}
        >
          <Plus size={20} />
          Thêm mới
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E0E5F2' }}>
        {tabConfig.map(tab => {
          const IconComponent = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 16px',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                borderBottom: '2px solid',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: isActive ? '#4318FF' : '#8F9CB8',
                borderBottomColor: isActive ? '#4318FF' : 'transparent'
              }}
            >
              <IconComponent size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Ảnh</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Sản phẩm</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Danh mục</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Giá cơ sở</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Trạng thái</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Không tìm thấy sản phẩm
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr
                      key={product.productid}
                      style={{ borderBottom: '1px solid #E0E5F2' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F7FE')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        {product.imageurl ? (
                          <img src={product.imageurl} alt={product.name} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '56px', height: '56px', borderRadius: '8px', backgroundColor: '#E0E5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8F9CB8' }}>-</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold', color: '#2B3674' }}>{product.name}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#A0AEC0' }}>{product.subtitle}</p>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#8F9CB8' }}>{getCategoryName(product.categoryid)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>{product.baseprice?.toLocaleString()} VNĐ</td>
                      <td style={{ padding: '12px 16px' }}>
                        <TogglableStatusBadge
                          status={product.status}
                          type="product"
                          onClick={() => handleProductStatusToggle(product.productid, product.status)}
                          isLoading={productStatusLoading === product.productid}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedProduct(product)
                              setIsEditProductModalOpen(true)
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#4318FF'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EBF3FF')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.productid)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#F56565'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FED7D7')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Tên danh mục</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Mô tả</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Không tìm thấy danh mục
                    </td>
                  </tr>
                ) : (
                  categories.map(cat => (
                    <tr
                      key={cat.categoryid}
                      style={{ borderBottom: '1px solid #E0E5F2' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F7FE')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2B3674' }}>{cat.name}</td>
                      <td style={{ padding: '12px 16px', color: '#8F9CB8' }}>{cat.description}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedCategory(cat)
                              setIsEditCategoryMode(true)
                              setIsCategoryModalOpen(true)
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#4318FF'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EBF3FF')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.categoryid)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#F56565'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FED7D7')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SIZES TAB */}
      {activeTab === 'sizes' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Tên kích thước</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Giá thêm</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : sizes.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Không tìm thấy kích thước
                    </td>
                  </tr>
                ) : (
                  sizes.map(size => (
                    <tr
                      key={size.sizeid}
                      style={{ borderBottom: '1px solid #E0E5F2' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F7FE')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2B3674' }}>{size.name}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>+{size.additionalprice?.toLocaleString()} VNĐ</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedSize(size)
                              setIsEditSizeMode(true)
                              setIsSizeModalOpen(true)
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#4318FF'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EBF3FF')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSize(size.sizeid)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#F56565'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FED7D7')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TOPPINGS TAB */}
      {activeTab === 'toppings' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Ảnh</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Topping</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Giá</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Tình trạng</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : toppings.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Không tìm thấy topping
                    </td>
                  </tr>
                ) : (
                  toppings.map(topping => (
                    <tr
                      key={topping.toppingid}
                      style={{ borderBottom: '1px solid #E0E5F2' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F7FE')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        {topping.imageurl ? (
                          <img src={topping.imageurl} alt={topping.name} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '56px', height: '56px', borderRadius: '8px', backgroundColor: '#E0E5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8F9CB8' }}>-</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2B3674' }}>{topping.name}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>{topping.price?.toLocaleString()} VNĐ</td>
                      <td style={{ padding: '12px 16px' }}>
                        <TogglableStatusBadge
                          status={topping.isavailable}
                          type="topping"
                          onClick={() => handleToppingStatusToggle(topping.toppingid, topping.isavailable)}
                          isLoading={toppingStatusLoading === topping.toppingid}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedTopping(topping)
                              setIsEditToppingMode(true)
                              setIsToppingModalOpen(true)
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#4318FF'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EBF3FF')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTopping(topping.toppingid)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#F56565'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FED7D7')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODALS */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        categories={categories}
        onClose={() => setIsAddProductModalOpen(false)}
        onSuccess={() => {
          showToast('Tạo sản phẩm thành công', 'success')
          loadProducts()
        }}
        onError={msg => showToast(msg, 'error')}
      />

      <EditProductModal
        isOpen={isEditProductModalOpen}
        product={selectedProduct}
        categories={categories}
        onClose={() => setIsEditProductModalOpen(false)}
        onSuccess={() => {
          showToast('Cập nhật sản phẩm thành công', 'success')
          loadProducts()
        }}
        onError={msg => showToast(msg, 'error')}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        isEdit={isEditCategoryMode}
        category={selectedCategory}
        onClose={() => {
          setIsCategoryModalOpen(false)
          setSelectedCategory(null)
        }}
        onSuccess={() => {
          showToast(isEditCategoryMode ? 'Cập nhật danh mục thành công' : 'Tạo danh mục thành công', 'success')
          loadCategories()
        }}
        onError={msg => showToast(msg, 'error')}
      />

      <SizeModal
        isOpen={isSizeModalOpen}
        isEdit={isEditSizeMode}
        size={selectedSize}
        onClose={() => {
          setIsSizeModalOpen(false)
          setSelectedSize(null)
        }}
        onSuccess={() => {
          showToast(isEditSizeMode ? 'Cập nhật kích thước thành công' : 'Tạo kích thước thành công', 'success')
          loadSizes()
        }}
        onError={msg => showToast(msg, 'error')}
      />

      <ToppingModal
        isOpen={isToppingModalOpen}
        isEdit={isEditToppingMode}
        topping={selectedTopping}
        onClose={() => {
          setIsToppingModalOpen(false)
          setSelectedTopping(null)
        }}
        onSuccess={() => {
          showToast(isEditToppingMode ? 'Cập nhật topping thành công' : 'Tạo topping thành công', 'success')
          loadToppings()
        }}
        onError={msg => showToast(msg, 'error')}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
