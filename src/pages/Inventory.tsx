import { useState, useEffect } from 'react'
import {
  ClipboardList,
  Box,
  FlaskConical,
  Plus,
  Trash2,
  CheckCircle,
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

// ============ PILL BADGE COMPONENT ============
const PillBadge = ({ 
  label, 
  color, 
  bgColor 
}: { 
  label: string
  color: string
  bgColor: string
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      paddingLeft: '12px',
      paddingRight: '14px',
      paddingTop: '6px',
      paddingBottom: '6px',
      borderRadius: '100px',
      backgroundColor: bgColor,
      color: color,
      fontSize: '12px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color,
      }}
    />
    {label}
  </span>
)

// ============ MAIN COMPONENT ============
export default function Inventory() {
  // ===== Auth - Read from localStorage (set during login) =====
  const userRole = (localStorage.getItem('userRole') || 'staff').toLowerCase()
  const userBranchId = localStorage.getItem('userBranchId') || ''
  const isSuperAdmin = userRole.toLowerCase().includes('super')

  // ===== State =====
  const [activeTab, setActiveTab] = useState<'categories' | 'inventory' | 'recipes'>('categories')
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('')
  const [restockForm, setRestockForm] = useState({ quantity: '', unitprice: '' })
  
  // ===== Audit State =====
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [selectedIngredientForAudit, setSelectedIngredientForAudit] = useState<string>('')
  const [auditForm, setAuditForm] = useState({ actualStock: '', reason: 'Hao hụt' })

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
    console.log('🔄 [Inventory] INITIAL LOAD')
    loadInitialData()
  }, [])

  // Auto-load inventory for manager when entering inventory tab
  useEffect(() => {
    console.log('👁️ [Inventory] AUTO-LOAD useEffect:', {
      activeTab,
      isSuperAdmin,
      userBranchId,
      selectedBranch,
    })

    if (activeTab === 'inventory' && !isSuperAdmin && userBranchId) {
      console.log('💡 Conditions met - auto-loading inventory for branch:', userBranchId)
      loadBranchInventory(userBranchId)
      setSelectedBranch(userBranchId)
    }
  }, [activeTab, userBranchId, isSuperAdmin]) // ✅ Thêm userBranchId, isSuperAdmin vào dependency

  // ===== Functions =====
  const loadInitialData = async () => {
    try {
      console.log('🔄 [loadInitialData] START')
      console.log('👤 User info:', { userRole, userBranchId, isSuperAdmin })

      // Load ingredients
      const ingredientsData = await ingredientService.getIngredients()
      setIngredients(ingredientsData || [])
      console.log('📦 Loaded ingredients:', ingredientsData?.length)

      // Load products
      const productsData = await productService.getProducts()
      setProducts(productsData || [])
      console.log('🍹 Loaded products:', productsData?.length)

      // Load branches based on role
      if (isSuperAdmin) {
        console.log('👑 Super Admin - loading ALL branches')
        const branchesData = await branchService.getActiveBranches()
        setBranches(branchesData || [])
        if (branchesData && branchesData.length > 0) {
          setSelectedBranch(branchesData[0].branchid)
          console.log('✅ Set first branch:', branchesData[0].branchid)
        }
      } else {
        console.log('🏪 Manager - loading ONLY his branch:', userBranchId)
        if (userBranchId) {
          const branchData = await branchService.getBranchById(userBranchId)
          console.log('📍 Branch data received:', branchData)
          if (branchData) {
            setBranches([branchData])
            setSelectedBranch(userBranchId)
            console.log('✅ Manager branch set:', userBranchId)
          } else {
            console.warn('⚠️ Failed to fetch branch data for:', userBranchId)
          }
        } else {
          console.warn('⚠️ userBranchId is empty!')
        }
      }

      console.log('✅ [loadInitialData] COMPLETE')
    } catch (error) {
      console.error('❌ [loadInitialData] Error:', error)
      showToast('Lỗi khi tải dữ liệu', 'error')
    }
  }

  const loadBranchInventory = async (branchId: string) => {
    if (!branchId) {
      console.warn('⚠️ [loadBranchInventory] branchId is empty!')
      return
    }

    try {
      console.log('📡 [loadBranchInventory] START with branchId:', branchId)
      console.log('🔍 TYPE CHECK:')
      console.log('   - input branchId (string):', branchId, 'typeof:', typeof branchId)
      console.log('   - converted to Number:', Number(branchId), 'typeof:', typeof Number(branchId))

      // BƯỚC 1: Fetch data
      const data = await branchInventoryService.getBranchInventoryByBranch(branchId)
      console.log('📊 [loadBranchInventory] Received data length:', data?.length)
      console.log('📋 [loadBranchInventory] Raw data:', data)

      // BƯỚC 2: Set state
      setBranchInventory(data || [])
      console.log('✅ [loadBranchInventory] State updated successfully')

      // BƯỚC 3: Check if empty
      if (!data || data.length === 0) {
        console.warn('⚠️ [loadBranchInventory] Data is empty! Check these:')
        console.warn('   1. Does branchid', branchId, 'have any records in branchinventory table?')
        console.warn('   2. Are branchid values NUMBERS in DB (not strings)?')
        console.warn('   3. Try querying branchinventory directly without filter')
      }
    } catch (error) {
      console.error('❌ [loadBranchInventory] ERROR:', error)
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

  const handleRestock = async () => {
    if (!selectedIngredientId || !restockForm.quantity || !restockForm.unitprice) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }

    try {
      // Import supabase client
      const { supabase } = await import('@/utils/supabaseClient')
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      
      const quantity = parseInt(restockForm.quantity, 10)
      const unitprice = parseFloat(restockForm.unitprice)
      const totalcost = quantity * unitprice

      // 1. Create stockreceipts record
      const { data: receiptData, error: receiptError } = await supabase
        .from('stockreceipts')
        .insert({
          importdate: new Date().toISOString(),
          totalcost: totalcost,
          branchid: userBranchId || selectedBranch,
          employeeid: currentUser.employeeid || currentUser.id || 'unknown',
        })
        .select()

      if (receiptError) throw receiptError
      const receiptid = receiptData?.[0]?.receiptid

      // 2. Create receiptdetails record
      if (receiptid) {
        const { error: detailError } = await supabase
          .from('receiptdetails')
          .insert({
            receiptid: receiptid,
            ingredientid: selectedIngredientId,
            quantity: quantity,
            unitprice: unitprice,
            amount: totalcost,
          })

        if (detailError) throw detailError

        // 3. Update branchinventory currentstock
        const branchId = userBranchId || selectedBranch
        
        // Get current stock
        const { data: currentInventory, error: getError } = await supabase
          .from('branchinventory')
          .select('currentstock')
          .eq('branchid', branchId)
          .eq('ingredientid', selectedIngredientId)
          .single()

        if (getError && getError.code !== 'PGRST116') throw getError

        const currentStock = currentInventory?.currentstock || 0
        const newStock = currentStock + quantity

        const { error: updateError } = await supabase
          .from('branchinventory')
          .upsert({
            branchid: branchId,
            ingredientid: selectedIngredientId,
            currentstock: newStock,
          })

        if (updateError) throw updateError
      }

      showToast('Nhập kho thành công', 'success')
      setIsRestockModalOpen(false)
      setSelectedIngredientId('')
      setRestockForm({ quantity: '', unitprice: '' })
      
      // Reload inventory
      if (selectedBranch) {
        loadBranchInventory(selectedBranch)
      }
    } catch (error) {
      console.error('Error restocking:', error)
      showToast('Lỗi khi nhập kho', 'error')
    }
  }

  // ===== Handle Audit =====
  const handleAudit = async () => {
    if (!selectedIngredientForAudit || !auditForm.actualStock) {
      showToast('Vui lòng nhập số lượng thực tế', 'error')
      return
    }

    try {
      const { supabase } = await import('@/utils/supabaseClient')
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      
      const branchId = userBranchId || selectedBranch
      const actualStock = parseInt(auditForm.actualStock, 10)

      // Get current stock
      const { data: currentInventory, error: getError } = await supabase
        .from('branchinventory')
        .select('currentstock')
        .eq('branchid', branchId)
        .eq('ingredientid', selectedIngredientForAudit)
        .single()

      if (getError && getError.code !== 'PGRST116') throw getError

      const currentStock = currentInventory?.currentstock || 0
      const difference = actualStock - currentStock

      // 1. Create inventoryaudits record
      const { data: auditData, error: auditError } = await supabase
        .from('inventoryaudits')
        .insert({
          auditdate: new Date().toISOString(),
          branchid: branchId,
          employeeid: currentUser.employeeid || currentUser.id || 'unknown',
          totaldifference: difference,
        })
        .select()

      if (auditError) throw auditError
      const auditid = auditData?.[0]?.auditid

      // 2. Create auditdetails record
      if (auditid) {
        const { error: detailError } = await supabase
          .from('auditdetails')
          .insert({
            auditid: auditid,
            ingredientid: selectedIngredientForAudit,
            expectedstock: currentStock,
            actualstock: actualStock,
            difference: difference,
            reason: auditForm.reason,
          })

        if (detailError) throw detailError
      }

      // 3. Update branchinventory currentstock with actual value
      const { error: updateError } = await supabase
        .from('branchinventory')
        .upsert({
          branchid: branchId,
          ingredientid: selectedIngredientForAudit,
          currentstock: actualStock,
        })

      if (updateError) throw updateError

      showToast(`Kiểm kê thành công (Chênh lệch: ${difference > 0 ? '+' : ''}${difference})`, 'success')
      setIsAuditModalOpen(false)
      setSelectedIngredientForAudit('')
      setAuditForm({ actualStock: '', reason: 'Hao hụt' })
      
      // Reload inventory
      if (selectedBranch) {
        loadBranchInventory(selectedBranch)
      }
    } catch (error) {
      console.error('Error auditing inventory:', error)
      showToast('Lỗi khi kiểm kê', 'error')
    }
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

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false)
          setSelectedIngredientId('')
          setRestockForm({ quantity: '', unitprice: '' })
        }}
        onSubmit={handleRestock}
        form={restockForm}
        onFormChange={(field, value) => setRestockForm(prev => ({ ...prev, [field]: value }))}
        selectedIngredientName={branchInventory.find(item => item.ingredientid === selectedIngredientId)?.ingredient?.name || ''}
      />

      {/* Audit Modal */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false)
          setSelectedIngredientForAudit('')
          setAuditForm({ actualStock: '', reason: 'Hao hụt' })
        }}
        onSubmit={handleAudit}
        form={auditForm}
        onFormChange={(field, value) => setAuditForm(prev => ({ ...prev, [field]: value }))}
        selectedIngredientName={branchInventory.find(item => item.ingredientid === selectedIngredientForAudit)?.ingredient?.name || ''}
        currentStock={branchInventory.find(item => item.ingredientid === selectedIngredientForAudit)?.currentstock || 0}
      />

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
          isSuperAdmin={isSuperAdmin}
          onRestockClick={(ingredientId) => {
            setSelectedIngredientId(ingredientId)
            setIsRestockModalOpen(true)
          }}
          onAuditClick={(ingredientId) => {
            setSelectedIngredientForAudit(ingredientId)
            setIsAuditModalOpen(true)
          }}
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
  isSuperAdmin,
  onRestockClick,
  onAuditClick,
}: {
  branches: Branch[]
  selectedBranch: string
  onBranchChange: (branchId: string) => void
  branchInventory: BranchInventory[]
  isSuperAdmin: boolean
  onRestockClick: (ingredientId: string) => void
  onAuditClick: (ingredientId: string) => void
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
      {/* Branch Selector - Only for Super Admin */}
      {isSuperAdmin && (
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
      )}

      {/* Manager view - Show branch info */}
      {!isSuperAdmin && branches.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
          <span style={{ color: colors.text, fontWeight: '600' }}>Chi nhánh: {branches[0].name}</span>
        </div>
      )}

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
            <th style={tableHeaderStyle}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {branchInventory.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: colors.textLight }}>
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
                  <td style={tableCellStyle}>
                    {isLow ? (
                      <PillBadge 
                        label="Sắp hết hàng" 
                        color={colors.error}
                        bgColor="rgba(243, 104, 90, 0.1)"
                      />
                    ) : (
                      <PillBadge 
                        label="Còn hàng" 
                        color={colors.success}
                        bgColor="rgba(5, 183, 93, 0.1)"
                      />
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onRestockClick(item.ingredientid)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        <Plus size={14} />
                        Nhập
                      </button>
                      <button
                        onClick={() => onAuditClick(item.ingredientid)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: colors.success,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        <CheckCircle size={14} />
                        Kiểm kê
                      </button>
                    </div>
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
        background: active ? `linear-gradient(135deg, ${colors.primary} 0%, #5B31FF 100%)` : 'transparent',
        color: active ? '#FFFFFF' : colors.textLight,
        borderBottom: active ? 'none' : `1px solid ${colors.border}`,
        borderRadius: active ? '8px 8px 0 0' : '0',
        cursor: 'pointer',
        fontWeight: active ? '600' : '500',
        fontSize: '14px',
        transition: 'all 0.3s ease',
        marginBottom: active ? '0' : '0',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: active ? '#FFFFFF' : colors.textLight }}>
        {icon}
      </span>
      {label}
    </button>
  )
}

// ============ RESTOCK MODAL COMPONENT ============
function RestockModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  selectedIngredientName,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  form: { quantity: string; unitprice: string }
  onFormChange: (field: string, value: string) => void
  selectedIngredientName: string
}) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: colors.text, marginTop: 0, marginBottom: '20px' }}>Nhập kho</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Nguyên liệu:
          </label>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: colors.background,
              borderRadius: '6px',
              color: colors.text,
              fontWeight: '500',
            }}
          >
            {selectedIngredientName || 'N/A'}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Số lượng nhập:
          </label>
          <input
            type="number"
            value={form.quantity}
            onChange={e => onFormChange('quantity', e.target.value)}
            placeholder="Nhập số lượng"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Đơn giá (đ):
          </label>
          <input
            type="number"
            value={form.unitprice}
            onChange={e => onFormChange('unitprice', e.target.value)}
            placeholder="Nhập đơn giá"
            step="0.01"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div
          style={{
            backgroundColor: colors.background,
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.text, fontWeight: '600' }}>
            <span>Tổng cộng:</span>
            <span>
              {(parseInt(form.quantity || '0') * parseFloat(form.unitprice || '0')).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.text,
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            style={{
              flex: 1,
              padding: '10px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ AUDIT MODAL COMPONENT ============
function AuditModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  selectedIngredientName,
  currentStock,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  form: { actualStock: string; reason: string }
  onFormChange: (field: string, value: string) => void
  selectedIngredientName: string
  currentStock: number
}) {
  if (!isOpen) return null

  const actualStock = parseInt(form.actualStock || '0')
  const difference = actualStock - currentStock

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: colors.text, marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>
          Kiểm kê nguyên liệu
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Nguyên liệu:
          </label>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: colors.background,
              borderRadius: '6px',
              color: colors.text,
              fontWeight: '500',
            }}
          >
            {selectedIngredientName || 'N/A'}
          </div>
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#EBF3FF', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>
            Số lượng trên máy (Hiện tại):
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: colors.primary }}>
            {currentStock}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Số lượng thực tế (đếm được):
          </label>
          <input
            type="number"
            value={form.actualStock}
            onChange={e => onFormChange('actualStock', e.target.value)}
            placeholder="Nhập số lượng thực tế"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: difference > 0 ? '#E8FFE8' : '#FFE8E8', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>
            Chênh lệch:
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: difference > 0 ? colors.success : colors.error }}>
            {difference > 0 ? '+' : ''}{difference}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
            Lý do chênh lệch:
          </label>
          <select
            value={form.reason}
            onChange={e => onFormChange('reason', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="Hao hụt">Hao hụt</option>
            <option value="Hỏng">Hỏng</option>
            <option value="Đếm lại">Đếm lại</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.text,
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            style={{
              flex: 1,
              padding: '10px',
              background: colors.success,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Lưu kiểm kê
          </button>
        </div>
      </div>
    </div>
  )
}
