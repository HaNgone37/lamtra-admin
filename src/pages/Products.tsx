import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Product, Category, Size, Topping } from '@/types'
import { Plus, Edit3, Trash2, Package, Layers, Maximize2, Sparkles } from 'lucide-react'
import Toast from '@/components/Toast'
import AddProductModal from '@/components/AddProductModal'
import EditProductModal from '@/components/EditProductModal'
import CategoryModal from '@/components/CategoryModal'
import SizeModal from '@/components/SizeModal'
import ToppingModal from '@/components/ToppingModal'
import UnifiedDeleteModal from '@/components/UnifiedDeleteModal'
import { productService, categoryService, sizeService, toppingService, branchProductStatusService } from '@/services/productService'
import {
  checkProductDependencies,
  checkCategoryDependencies,
  checkSizeDependencies,
  checkToppingDependencies,
  type DependencyCheckResult
} from '@/utils/dependencyValidator'

// ============= TYPES =============
interface ProductWithBranchStatus extends Product {
  branchStatusId?: string | number
  isAvailableAtBranch?: boolean
}

// ============= STATUS BADGE WITH CLICK (TOGGLABLE) =============
const TogglableStatusBadge = ({ 
  status, 
  type = 'product', 
  onClick, 
  isLoading, 
  disabled = false 
}: { 
  status: string | boolean
  type?: 'product' | 'topping' | 'branch'
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean 
}) => {
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
  } else if (type === 'topping' || type === 'branch') {
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
      disabled={isLoading || disabled}
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
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1
      }}
      onMouseEnter={e => !isLoading && !disabled && (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = disabled ? '0.6' : '1')}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor }} />
      {label}
    </button>
  )
}

// ============= BRANCH PRODUCT STATUS SWITCH =============
const BranchProductStatusSwitch = ({ 
  isAvailable, 
  onClick, 
  isLoading = false, 
  disabled = false 
}: { 
  isAvailable: boolean
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: isAvailable ? 'flex-end' : 'flex-start',
        width: '52px',
        height: '28px',
        padding: '2px',
        borderRadius: '14px',
        border: 'none',
        backgroundColor: isAvailable ? '#00A869' : '#CBD5E0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {/* Toggle knob */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isLoading && (
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              border: '2px solid #00A869',
              borderTopColor: 'transparent',
              animation: 'spin 0.6s linear infinite'
            }}
          />
        )}
      </div>
    </button>
  )
}

// ============= MAIN PRODUCTS COMPONENT =============
export const Products: React.FC = () => {
  // ============= RBAC & AUTH =============
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [userBranchId, setUserBranchId] = useState<number | null>(null)
  const [userBranchName, setUserBranchName] = useState<string>('Chi nhánh')

  // ============= STATE =============
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'sizes' | 'toppings'>('products')
  const [products, setProducts] = useState<ProductWithBranchStatus[]>([])
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
  const [branchProductStatusLoading, setBranchProductStatusLoading] = useState<string | null>(null)

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

  // ============= DEPENDENCY WARNING MODAL STATES =============
  const [dependencyWarningOpen, setDependencyWarningOpen] = useState(false)
  const [dependencyCheckResult, setDependencyCheckResult] = useState<DependencyCheckResult | null>(null)
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{ type: string; id: string | number; name: string } | null>(null)
  const [dependencyCheckLoading, setDependencyCheckLoading] = useState(false)

  // ============= GET ROLE & BRANCH INFO =============
  useEffect(() => {
    const roleStr = localStorage.getItem('userRole') || ''
    const branchIdStr = localStorage.getItem('userBranchId') || ''

    const role = roleStr.toLowerCase()
    setIsSuperAdmin(role === 'super admin')
    setIsManager(role === 'branch manager')
    
    const branchId = branchIdStr ? Number(branchIdStr) : null
    setUserBranchId(branchId)

    // Fetch branch name for Branch Manager
    if (role === 'branch manager' && branchId) {
      loadBranchInfo(branchId)
    }
  }, [])

  // ============= LOAD BRANCH INFO =============
  const loadBranchInfo = async (branchId: number) => {
    try {
      const branch = await branchProductStatusService.getBranchById(branchId)
      if (branch) {
        setUserBranchName(branch.name)
      }
    } catch (error) {
      console.error('Error loading branch info:', error)
    }
  }

  // ============= LOAD DATA =============
  useEffect(() => {
    loadAllData()
  }, [isSuperAdmin, isManager, userBranchId])

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      if (isSuperAdmin) {
        // Super Admin: load all products without branch status
        await loadProducts()
      } else if (isManager) {
        // Branch Manager: load products with branch status
        if (userBranchId) {
          await loadProductsWithBranchStatus()
        }
      }

      // Load common data (categories, sizes, toppings) for all users
      await Promise.all([loadCategories(), loadSizes(), loadToppings()])
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

  const loadProductsWithBranchStatus = async () => {
    try {
      if (!userBranchId) return
      const data = await productService.getProductsWithBranchStatus(userBranchId)
      setProducts(data)
    } catch (error) {
      console.error('Error loading products with branch status:', error)
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
    try {
      setDependencyCheckLoading(true)
      const result = await checkProductDependencies(productId)
      
      const productName = products.find(p => String(p.productid) === productId)?.name || 'Sản phẩm'
      
      setDependencyCheckResult(result)
      setPendingDeleteItem({ type: 'product', id: productId, name: productName })
      setDependencyWarningOpen(true)
    } catch (error) {
      console.error('Error checking product dependencies:', error)
      showToast('Lỗi khi kiểm tra dữ liệu liên quan', 'error')
    } finally {
      setDependencyCheckLoading(false)
    }
  }

  const confirmDeleteProduct = async () => {
    if (!pendingDeleteItem) return
    
    try {
      setDependencyCheckLoading(true)
      await productService.deleteProduct(String(pendingDeleteItem.id))
      showToast('Xóa sản phẩm thành công', 'success')
      await loadProducts()
      setDependencyWarningOpen(false)
      setPendingDeleteItem(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      showToast('Lỗi khi xóa sản phẩm', 'error')
    } finally {
      setDependencyCheckLoading(false)
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
    try {
      setDependencyCheckLoading(true)
      const result = await checkCategoryDependencies(categoryId)
      
      const categoryName = categories.find(c => String(c.categoryid) === categoryId)?.name || 'Danh mục'
      
      setDependencyCheckResult(result)
      setPendingDeleteItem({ type: 'category', id: categoryId, name: categoryName })
      setDependencyWarningOpen(true)
    } catch (error) {
      console.error('Error checking category dependencies:', error)
      showToast('Lỗi khi kiểm tra dữ liệu liên quan', 'error')
    } finally {
      setDependencyCheckLoading(false)
    }
  }

  const confirmDeleteCategory = async () => {
    if (!pendingDeleteItem) return
    
    try {
      setDependencyCheckLoading(true)
      await categoryService.deleteCategory(String(pendingDeleteItem.id))
      showToast('Xóa danh mục thành công', 'success')
      await loadCategories()
      setDependencyWarningOpen(false)
      setPendingDeleteItem(null)
    } catch (error) {
      console.error('Error deleting category:', error)
      showToast('Lỗi khi xóa danh mục', 'error')
    } finally {
      setDependencyCheckLoading(false)
    }
  }

  // ============= SIZE HANDLERS =============
  const handleDeleteSize = async (sizeId: string) => {
    try {
      setDependencyCheckLoading(true)
      const result = await checkSizeDependencies(sizeId)
      
      const sizeName = sizes.find(s => String(s.sizeid) === sizeId)?.name || 'Kích thước'
      
      setDependencyCheckResult(result)
      setPendingDeleteItem({ type: 'size', id: sizeId, name: sizeName })
      setDependencyWarningOpen(true)
    } catch (error) {
      console.error('Error checking size dependencies:', error)
      showToast('Lỗi khi kiểm tra dữ liệu liên quan', 'error')
    } finally {
      setDependencyCheckLoading(false)
    }
  }

  const confirmDeleteSize = async () => {
    if (!pendingDeleteItem) return
    
    try {
      setDependencyCheckLoading(true)
      await sizeService.deleteSize(String(pendingDeleteItem.id))
      showToast('Xóa kích thước thành công', 'success')
      await loadSizes()
      setDependencyWarningOpen(false)
      setPendingDeleteItem(null)
    } catch (error) {
      console.error('Error deleting size:', error)
      showToast('Lỗi khi xóa kích thước', 'error')
    } finally {
      setDependencyCheckLoading(false)
    }
  }

  // ============= TOPPING HANDLERS =============
  const handleDeleteTopping = async (toppingId: string) => {
    try {
      setDependencyCheckLoading(true)
      const result = await checkToppingDependencies(toppingId)
      
      const toppingName = toppings.find(t => String(t.toppingid) === toppingId)?.name || 'Topping'
      
      setDependencyCheckResult(result)
      setPendingDeleteItem({ type: 'topping', id: toppingId, name: toppingName })
      setDependencyWarningOpen(true)
    } catch (error) {
      console.error('Error checking topping dependencies:', error)
      showToast('Lỗi khi kiểm tra dữ liệu liên quan', 'error')
    } finally {
      setDependencyCheckLoading(false)
    }
  }

  const confirmDeleteTopping = async () => {
    if (!pendingDeleteItem) return
    
    try {
      setDependencyCheckLoading(true)
      await toppingService.deleteTopping(String(pendingDeleteItem.id))
      showToast('Xóa topping thành công', 'success')
      await loadToppings()
      setDependencyWarningOpen(false)
      setPendingDeleteItem(null)
    } catch (error) {
      console.error('Error deleting topping:', error)
      showToast('Lỗi khi xóa topping', 'error')
    } finally {
      setDependencyCheckLoading(false)
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

  // ============= BRANCH PRODUCT STATUS HANDLERS =============
  const handleBranchProductStatusToggle = async (productId: string | number, currentStatus: boolean, productName: string) => {
    try {
      setBranchProductStatusLoading(String(productId))
      if (!userBranchId) throw new Error('Branch ID not found')
      await productService.updateBranchProductStatus(productId, userBranchId, !currentStatus)
      const newStatus = !currentStatus ? 'Còn món' : 'Hết món'
      showToast(`Đã cập nhật trạng thái "${productName}" thành "${newStatus}" tại quán`, 'success')
      if (userBranchId) {
        await loadProductsWithBranchStatus()
      }
    } catch (error) {
      console.error('Error updating branch product status:', error)
      showToast('Lỗi khi cập nhật trạng thái sản phẩm', 'error')
    } finally {
      setBranchProductStatusLoading(null)
    }
  }

  // ============= CONTEXT-AWARE ADD BUTTON =============
  const handleAddNewClick = () => {
    if (!isSuperAdmin) return // Only Super Admin can add new items

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

  const getCategoryName = (categoryId: string | number) => {
    return categories.find(c => String(c.categoryid) === String(categoryId))?.name || 'Chưa phân loại'
  }

  const tabConfig = [
    { id: 'products', label: 'Sản phẩm', icon: Package },
    { id: 'categories', label: 'Danh mục', icon: Layers },
    { id: 'sizes', label: 'Kích thước', icon: Maximize2 },
    { id: 'toppings', label: 'Topping', icon: Sparkles }
  ]

  // ============= DYNAMIC TITLE =============
  const pageTitle = isManager ? `Thực đơn chi nhánh: ${userBranchName}` : 'Quản lý thực đơn'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#2B3674', margin: 0 }}>{pageTitle}</h1>
        {isSuperAdmin && (
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
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E0E5F2', overflowX: 'auto' }}>
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
                borderBottomColor: isActive ? '#4318FF' : 'transparent',
                whiteSpace: 'nowrap'
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
        <Card style={{ borderRadius: '20px', boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px', padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Ảnh</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Sản phẩm</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Danh mục</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Giá cơ sở</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Trạng thái</th>
                  {isSuperAdmin && <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Thao tác</th>}
                  {isManager && <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Trạng thái tại quán</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 6} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 6} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
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
                      <td style={{ padding: '12px 16px', color: '#8F9CB8' }}>{getCategoryName(String(product.categoryid))}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {product.saleprice != null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: '700', color: '#E53E3E', fontSize: '14px' }}>
                              {product.saleprice.toLocaleString()} VNĐ
                            </span>
                            <span style={{ fontWeight: '400', color: '#A0AEC0', fontSize: '12px', textDecoration: 'line-through' }}>
                              {product.baseprice?.toLocaleString()} VNĐ
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: '600', color: '#2B3674' }}>{product.baseprice?.toLocaleString()} VNĐ</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <TogglableStatusBadge
                          status={product.status}
                          type="product"
                          onClick={() => isSuperAdmin && handleProductStatusToggle(String(product.productid), product.status)}
                          isLoading={productStatusLoading === String(product.productid)}
                          disabled={!isSuperAdmin}
                        />
                      </td>
                      {isSuperAdmin && (
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
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(String(product.productid))}
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
                      )}
                      {isManager && (
                        <td style={{ padding: '12px 16px' }}>
                          <BranchProductStatusSwitch
                            isAvailable={product.isAvailableAtBranch ?? true}
                            onClick={() => handleBranchProductStatusToggle(product.productid, product.isAvailableAtBranch ?? true, product.name)}
                            isLoading={branchProductStatusLoading === String(product.productid)}
                            disabled={false}
                          />
                        </td>
                      )}
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
        <Card style={{ borderRadius: '20px', boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px', padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Tên danh mục</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Mô tả</th>
                  {isSuperAdmin && <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 3 : 2} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 3 : 2} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
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
                      {isSuperAdmin && (
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
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(String(cat.categoryid))}
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
                      )}
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
        <Card style={{ borderRadius: '20px', boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px', padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Tên kích thước</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Giá thêm</th>
                  {isSuperAdmin && <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 3 : 2} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : sizes.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 3 : 2} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
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
                      {isSuperAdmin && (
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
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteSize(String(size.sizeid))}
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
                      )}
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
        <Card style={{ borderRadius: '20px', boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px', padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Ảnh</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Topping</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Giá</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Tình trạng</th>
                  {isSuperAdmin && <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#2B3674' }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : toppings.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '32px 16px', color: '#8F9CB8' }}>
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
                          onClick={() => handleToppingStatusToggle(String(topping.toppingid), topping.isavailable)}
                          isLoading={toppingStatusLoading === String(topping.toppingid)}
                          disabled={!isSuperAdmin}
                        />
                      </td>
                      {isSuperAdmin && (
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
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTopping(String(topping.toppingid))}
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
                      )}
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

      {/* Dependency Warning Modal */}
      <UnifiedDeleteModal
        isOpen={dependencyWarningOpen}
        itemName={pendingDeleteItem?.name || ''}
        itemType={
          pendingDeleteItem?.type === 'product' ? 'Sản phẩm' :
          pendingDeleteItem?.type === 'category' ? 'Danh mục' :
          pendingDeleteItem?.type === 'size' ? 'Kích thước' :
          pendingDeleteItem?.type === 'topping' ? 'Topping' :
          'Mục'
        }
        dependencyResult={dependencyCheckResult}
        onClose={() => {
          setDependencyWarningOpen(false)
          setPendingDeleteItem(null)
          setDependencyCheckResult(null)
        }}
        onConfirmDelete={() => {
          if (pendingDeleteItem?.type === 'product') {
            confirmDeleteProduct()
          } else if (pendingDeleteItem?.type === 'category') {
            confirmDeleteCategory()
          } else if (pendingDeleteItem?.type === 'size') {
            confirmDeleteSize()
          } else if (pendingDeleteItem?.type === 'topping') {
            confirmDeleteTopping()
          }
        }}
        isLoading={dependencyCheckLoading}
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
