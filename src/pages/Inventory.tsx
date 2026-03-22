import { useState, useEffect } from 'react'
import {
  ClipboardList,
  Box,
  FlaskConical,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  ingredientService,
  branchInventoryService,
  recipeService,
  productService,
  branchService,
} from '@/services/inventoryService'
import { Ingredient, Recipe, Product, BranchInventory } from '@/types'
import Toast from '@/components/Toast'
import { useAuth } from '@/services/AuthContext'

interface Branch {
  branchid: string
  name: string
  address: string
  isactive: boolean
}

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

// ============ COLOR SCHEME ============
const colors = {
  primary: '#4318FF',
  text: '#2B3674',
  textLight: '#8F9CB8',
  border: '#E0E5F2',
  success: '#05B75D',
  error: '#F3685A',
  warning: '#FEC90F',
  background: '#F3F4F6',
}

// ============ MAIN COMPONENT ============
export default function Inventory() {
  // ===== Auth =====
  const { user } = useAuth()
  const userRole = (user?.role || 'staff').toLowerCase()
  const isSuperAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'super admin'

  // ===== State =====
  const [activeTab, setActiveTab] = useState<'categories' | 'inventory' | 'recipes'>('categories')
  const [loading, setLoading] = useState(false)
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])

  // ===== Categories Tab State =====
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [searchIngredient, setSearchIngredient] = useState('')

  // ===== Inventory Tab State =====
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([])

  // ===== Recipes Tab State =====
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [newIngredientForm, setNewIngredientForm] = useState({ ingredientid: '', amount: '' })

  // ===== Lifecycle =====
  useEffect(() => {
    loadInitialData()
  }, [])

  // ===== Functions =====
  const loadInitialData = async () => {
    setLoading(true)
    try {
      // Load ingredients
      const ingredientsData = await ingredientService.getIngredients()
      setIngredients(ingredientsData || [])

      // Load products
      const productsData = await productService.getProducts()
      setProducts(productsData || [])

      // Load branches based on role
      if (isSuperAdmin) {
        const branchesData = await branchService.getActiveBranches()
        setBranches(branchesData || [])
        if (branchesData && branchesData.length > 0) {
          setSelectedBranch(branchesData[0].branchid)
        }
      } else {
        if (user?.branchid) {
          const branchData = await branchService.getBranchById(user.branchid)
          if (branchData) {
            setBranches([branchData])
            setSelectedBranch(user.branchid)
          }
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      showToast('Lỗi khi tải dữ liệu', 'error')
    }
    setLoading(false)
  }

  const loadBranchInventory = async (branchId: string) => {
    if (!branchId) return
    try {
      const data = await branchInventoryService.getBranchInventoryByBranch(branchId)
      setBranchInventory(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
      showToast('Lỗi khi tải tồn kho', 'error')
    }
  }

  const loadRecipes = async (productId: string) => {
    if (!productId) return
    try {
      const data = await recipeService.getRecipesByProduct(productId)
      setRecipes(data || [])
    } catch (error) {
      console.error('Error loading recipes:', error)
      showToast('Lỗi khi tải công thức', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString()
    setToastMessages(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToastMessages(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const onFormChange = (field: string, value: string | number) => {
    setNewIngredientForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddIngredientToProduct = async () => {
    if (!selectedProduct || !newIngredientForm.ingredientid || !newIngredientForm.amount) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }

    try {
      const recipe = {
        productid: selectedProduct,
        ingredientid: newIngredientForm.ingredientid,
        amount: Number(newIngredientForm.amount),
      }
      await recipeService.createRecipe(recipe)
      showToast('Thêm nguyên liệu thành công', 'success')
      loadRecipes(selectedProduct)
      setNewIngredientForm({ ingredientid: '', amount: '' })
    } catch (error) {
      console.error('Error adding ingredient:', error)
      showToast('Lỗi khi thêm nguyên liệu', 'error')
    }
  }

  const handleRemoveRecipe = async (recipeid: string) => {
    try {
      await recipeService.deleteRecipe(recipeid)
      showToast('Xóa công thức thành công', 'success')
      if (selectedProduct) loadRecipes(selectedProduct)
    } catch (error) {
      console.error('Error deleting recipe:', error)
      showToast('Lỗi khi xóa công thức', 'error')
    }
  }

  // ===== Render =====
  return (
    <div style={{ padding: '20px' }}>
      {/* Toast Notifications */}
      {toastMessages.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToastMessages(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}

      <h1 style={{ color: colors.text, marginBottom: '24px', overflow: 'visible', whiteSpace: 'normal' }}>Quản lý Kho hàng</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
        <TabButton
          active={activeTab === 'categories'}
          onClick={() => setActiveTab('categories')}
          icon={<ClipboardList size={18} />}
          label="Danh mục"
        />
        <TabButton
          active={activeTab === 'inventory'}
          onClick={() => setActiveTab('inventory')}
          icon={<Box size={18} />}
          label="Tồn kho"
        />
        <TabButton
          active={activeTab === 'recipes'}
          onClick={() => setActiveTab('recipes')}
          icon={<FlaskConical size={18} />}
          label="Công thức"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && (
        <TabCategories ingredients={ingredients} searchIngredient={searchIngredient} onSearchChange={setSearchIngredient} />
      )}
      {activeTab === 'inventory' && (
        <TabInventory
          branches={branches}
          selectedBranch={selectedBranch}
          onBranchChange={(branchId) => {
            setSelectedBranch(branchId)
            loadBranchInventory(branchId)
          }}
          branchInventory={branchInventory}
        />
      )}
      {activeTab === 'recipes' && (
        <TabRecipes
          products={products}
          selectedProduct={selectedProduct}
          onProductChange={(productId) => {
            setSelectedProduct(productId)
            loadRecipes(productId)
          }}
          recipes={recipes}
          ingredients={ingredients}
          newIngredientForm={newIngredientForm}
          onFormChange={onFormChange}
          onAddIngredient={handleAddIngredientToProduct}
          onRemoveRecipe={handleRemoveRecipe}
        />
      )}
    </div>
  )
}

// ============ TAB: CATEGORIES (DANH MỤC) ============
function TabCategories({
  ingredients,
  searchIngredient,
  onSearchChange,
}: {
  ingredients: Ingredient[]
  searchIngredient: string
  onSearchChange: (search: string) => void
}) {
  const filteredIngredients = ingredients.filter(
    ing =>
      ing.name.toLowerCase().includes(searchIngredient.toLowerCase()) ||
      ing.unit.toLowerCase().includes(searchIngredient.toLowerCase())
  )

  const tableHeaderStyle = {
    background: '#F3F4F6',
    padding: '12px',
    fontWeight: '700',
    color: '#2B3674',
    textAlign: 'left' as const,
    borderBottom: `1px solid #E0E5F2`,
  }

  const tableCellStyle = {
    padding: '12px',
    borderBottom: `1px solid #E0E5F2`,
    color: '#2B3674',
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Tìm kiếm nguyên liệu..."
        value={searchIngredient}
        onChange={e => onSearchChange(e.target.value)}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '10px 12px',
          border: `1px solid #E0E5F2`,
          borderRadius: '6px',
          fontSize: '14px',
          marginBottom: '20px',
        }}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: colors.background }}>
            <th style={tableHeaderStyle}>STT</th>
            <th style={tableHeaderStyle}>Tên</th>
            <th style={tableHeaderStyle}>Đơn vị</th>
            <th style={tableHeaderStyle}>Giá cơ bản</th>
          </tr>
        </thead>
        <tbody>
          {filteredIngredients.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: colors.textLight }}>
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            filteredIngredients.map((ing, idx) => (
              <tr key={ing.ingredientid}>
                <td style={tableCellStyle}>{idx + 1}</td>
                <td style={tableCellStyle}>{ing.name}</td>
                <td style={tableCellStyle}>{ing.unit}</td>
                <td style={tableCellStyle}>{ing.baseprice.toLocaleString('vi-VN')} đ</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ============ TAB: INVENTORY (TỒN KHO) ============
function TabInventory({
  branches,
  selectedBranch,
  onBranchChange,
  branchInventory,
}: {
  branches: Branch[]
  selectedBranch: string
  onBranchChange: (branchId: string) => void
  branchInventory: BranchInventory[]
}) {
  const tableHeaderStyle = {
    background: '#F3F4F6',
    padding: '12px',
    fontWeight: '700',
    color: '#2B3674',
    textAlign: 'left' as const,
    borderBottom: `1px solid #E0E5F2`,
  }

  const tableCellStyle = {
    padding: '12px',
    borderBottom: `1px solid #E0E5F2`,
    color: '#2B3674',
  }

  return (
    <div>
      {/* Branch Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
          Chọn chi nhánh:
        </label>
        <select
          value={selectedBranch}
          onChange={e => onBranchChange(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="">-- Chọn chi nhánh --</option>
          {branches.map(branch => (
            <option key={branch.branchid} value={branch.branchid}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: colors.background }}>
            <th style={tableHeaderStyle}>STT</th>
            <th style={tableHeaderStyle}>Nguyên liệu</th>
            <th style={tableHeaderStyle}>Tồn kho</th>
            <th style={tableHeaderStyle}>Đơn vị</th>
            <th style={tableHeaderStyle}>Mức cảnh báo</th>
            <th style={tableHeaderStyle}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {branchInventory.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: colors.textLight }}>
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            branchInventory.map((item, idx) => {
              const isLow = (item.ingredient?.minstocklevel || 0) > 0 && item.currentstock < (item.ingredient?.minstocklevel || 0)
              return (
                <tr key={`${item.branchid}-${item.ingredientid}`} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tableCellStyle}>{idx + 1}</td>
                  <td style={tableCellStyle}>{item.ingredient?.name || 'N/A'}</td>
                  <td style={tableCellStyle}>{item.currentstock}</td>
                  <td style={tableCellStyle}>{item.ingredient?.unit || 'N/A'}</td>
                  <td style={tableCellStyle}>{item.ingredient?.minstocklevel || '-'}</td>
                  <td
                    style={{
                      ...tableCellStyle,
                      color: isLow ? colors.error : colors.success,
                      fontWeight: 'bold',
                    }}
                  >
                    {isLow ? '⚠️ Cần nhập' : '✅ Bình thường'}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// ============ TAB: RECIPES (CÔNG THỨC) ============
function TabRecipes({
  products,
  selectedProduct,
  onProductChange,
  recipes,
  ingredients,
  newIngredientForm,
  onFormChange,
  onAddIngredient,
  onRemoveRecipe,
}: {
  products: Product[]
  selectedProduct: string
  onProductChange: (productId: string) => void
  recipes: Recipe[]
  ingredients: Ingredient[]
  newIngredientForm: { ingredientid: string; amount: string }
  onFormChange: (field: string, value: string | number) => void
  onAddIngredient: () => void
  onRemoveRecipe: (recipeid: string) => void
}) {
  const tableHeaderStyle = {
    background: '#F3F4F6',
    padding: '12px',
    fontWeight: '700',
    color: '#2B3674',
    textAlign: 'left' as const,
    borderBottom: `1px solid #E0E5F2`,
  }

  const tableCellStyle = {
    padding: '12px',
    borderBottom: `1px solid #E0E5F2`,
    color: '#2B3674',
  }

  return (
    <div>
      {/* Product Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
          Chọn sản phẩm:
        </label>
        <select
          value={selectedProduct}
          onChange={e => onProductChange(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="">-- Chọn sản phẩm --</option>
          {products.map(product => (
            <option key={product.productid} value={product.productid}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
          {/* Recipes Table */}
          <div>
            <h3 style={{ color: colors.text, marginBottom: '16px' }}>Công thức hiện tại</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: colors.background }}>
                  <th style={tableHeaderStyle}>Nguyên liệu</th>
                  <th style={tableHeaderStyle}>Định lượng</th>
                  <th style={tableHeaderStyle}></th>
                </tr>
              </thead>
              <tbody>
                {recipes.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: colors.textLight }}>
                      Không có nguyên liệu
                    </td>
                  </tr>
                ) : (
                  recipes.map(recipe => (
                    <tr key={recipe.recipeid}>
                      <td style={tableCellStyle}>{recipe.ingredient?.name}</td>
                      <td style={tableCellStyle}>{recipe.amount} {recipe.ingredient?.unit}</td>
                      <td style={tableCellStyle} onClick={() => recipe.recipeid && onRemoveRecipe(recipe.recipeid)}>
                        <Trash2 size={16} style={{ cursor: 'pointer', color: colors.error }} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Ingredient Form */}
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
              height: 'fit-content',
            }}
          >
            <h3 style={{ color: colors.text, marginTop: 0, marginBottom: '20px' }}>
              <Plus size={18} style={{ display: 'inline-block', marginRight: '8px' }} />
              Thêm nguyên liệu
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
                Chọn nguyên liệu:
              </label>
              <select
                value={newIngredientForm.ingredientid}
                onChange={e => onFormChange('ingredientid', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- Chọn nguyên liệu --</option>
                {ingredients
                  .filter(ing => !recipes.some(r => r.ingredientid === ing.ingredientid))
                  .map(ing => (
                    <option key={ing.ingredientid} value={ing.ingredientid}>
                      {ing.name}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
                Định lượng:
              </label>
              <input
                type="number"
                value={newIngredientForm.amount}
                onChange={e => onFormChange('amount', e.target.value)}
                placeholder="Nhập định lượng"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <button
              onClick={onAddIngredient}
              style={{
                width: '100%',
                padding: '10px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Thêm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ TAB BUTTON COMPONENT ============
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        border: 'none',
        background: 'transparent',
        color: active ? colors.primary : colors.textLight,
        borderBottom: active ? `2px solid ${colors.primary}` : 'none',
        cursor: 'pointer',
        fontWeight: active ? '600' : '500',
        fontSize: '14px',
        transition: 'all 0.3s ease',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
