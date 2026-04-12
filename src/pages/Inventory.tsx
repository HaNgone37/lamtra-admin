import { useState, useEffect } from 'react'
import {
  ClipboardList,
  Box,
  FlaskConical,
} from 'lucide-react'
import { supabase } from '@/utils/supabaseClient'
import {
  ingredientService,
  branchInventoryService,
  recipeService,
  productService,
  branchService,
} from '@/services/inventoryService'
import { Ingredient, Recipe, Product, BranchInventory } from '@/types'
import Toast from '@/components/Toast'
import { RestockModal } from '@/components/inventory/RestockModal'
import { AuditModal } from '@/components/inventory/AuditModal'
import { AddIngredientModal } from '@/components/inventory/AddIngredientModal'
import { InventoryCategoriesTab } from '@/components/inventory/InventoryCategoriesTab'
import { InventoryStockTab } from '@/components/inventory/InventoryStockTab'
import { RecipesTab } from '@/components/inventory/RecipesTab'
import { TabButton } from '@/components/inventory/TabButton'

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
  // ===== Auth - Read from localStorage (set during login) =====
  const userRole = (localStorage.getItem('userRole') || 'branch manager').toLowerCase()
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
  const [currentStockForAudit, setCurrentStockForAudit] = useState<number>(0)
  const [auditForm, setAuditForm] = useState({ actualStock: '', reason: 'Hao hụt', notes: '' })

  // ===== Categories Tab State =====
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [searchIngredient, setSearchIngredient] = useState('')
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false)

  // ===== Inventory Tab State =====
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([])

  // ===== Recipes Tab State =====
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [sizes, setSizes] = useState<any[]>([])
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [newIngredientForm, setNewIngredientForm] = useState({ ingredientid: '', amount: '', sizeid: '' })

  // ===== Lifecycle =====
  useEffect(() => {
    console.log('[INIT] Inventory module loading')
    loadInitialData()
  }, [])

  // Auto-load inventory for manager when entering inventory tab
  useEffect(() => {
    console.log('[AUTO-LOAD] useEffect triggered:', {
      activeTab,
      isSuperAdmin,
      userBranchId,
      selectedBranch,
    })

    if (activeTab === 'inventory' && !isSuperAdmin && userBranchId) {
      console.log('[INFO] Auto-loading inventory for branch:', userBranchId)
      loadBranchInventory(userBranchId)
      setSelectedBranch(userBranchId)
    }
  }, [activeTab, userBranchId, isSuperAdmin])

  // ===== Functions =====
  const loadInitialData = async () => {
    try {
      console.log('[START] loadInitialData')
      console.log('[USER] Role:', { userRole, userBranchId, isSuperAdmin })

      // Load ingredients
      const ingredientsData = await ingredientService.getIngredients()
      setIngredients(ingredientsData || [])
      console.log('[LOAD] Ingredients count:', ingredientsData?.length)

      // Load products
      const productsData = await productService.getProducts()
      setProducts(productsData || [])
      console.log('[LOAD] Products count:', productsData?.length)

      // Load sizes
      const { data: sizesData } = await supabase.from('sizes').select('*')
      if (sizesData) {
        setSizes(sizesData)
        setSelectedSize(String(sizesData[0]?.sizeid || ''))
        console.log('[LOAD] Sizes count:', sizesData?.length)
      }

      // Load branches based on role
      if (isSuperAdmin) {
        console.log('[ROLE] Super Admin - loading all branches')
        const branchesData = await branchService.getActiveBranches()
        setBranches(branchesData || [])
        if (branchesData && branchesData.length > 0) {
          setSelectedBranch(branchesData[0].branchid)
          console.log('[SUCCESS] First branch set:', branchesData[0].branchid)
        }
      } else {
        console.log('[ROLE] Manager - loading own branch:', userBranchId)
        if (userBranchId) {
          const branchData = await branchService.getBranchById(userBranchId)
          console.log('[DATA] Branch received:', branchData)
          if (branchData) {
            setBranches([branchData])
            setSelectedBranch(userBranchId)
            console.log('[SUCCESS] Manager branch set:', userBranchId)
          } else {
            console.warn('[WARN] Failed to fetch branch data:', userBranchId)
          }
        } else {
          console.warn('[WARN] userBranchId is empty')
        }
      }

      console.log('[COMPLETE] loadInitialData finished')
    } catch (error) {
      console.error('[ERROR] loadInitialData failed:', error)
      showToast('Lỗi khi tải dữ liệu', 'error')
    }
  }

  const loadBranchInventory = async (branchId: string) => {
    if (!branchId) {
      console.warn('[WARN] branchId is empty')
      return
    }

    try {
      console.log('[START] loadBranchInventory with branch:', branchId)
      const data = await branchInventoryService.getBranchInventoryByBranch(branchId)
      console.log('[DATA] Branch inventory count:', data?.length)
      setBranchInventory(data || [])
      console.log('[SUCCESS] Branch inventory state updated')
    } catch (error) {
      console.error('[ERROR] loadBranchInventory failed:', error)
      showToast('Lỗi khi tải tồn kho', 'error')
    }
  }

  const loadRecipes = async (productId: string, sizeId?: string) => {
    if (!productId) return
    try {
      console.log('[Inventory] Loading recipes for productId:', productId, 'sizeId:', sizeId)
      const data = await recipeService.getRecipesByProduct(productId, sizeId)
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

  const handleAddIngredient = async (data: { name: string; unit: string; baseprice: string; minstocklevel: string }) => {
    try {
      await ingredientService.createIngredient({
        name: data.name,
        unit: data.unit,
        baseprice: Number(data.baseprice),
        minstocklevel: Number(data.minstocklevel),
      })
      showToast(`Đã thêm nguyên liệu '${data.name}' thành công`, 'success')
      // Reload ingredients list
      const updatedIngredients = await ingredientService.getIngredients()
      setIngredients(updatedIngredients || [])
    } catch (error) {
      console.error('Error adding ingredient:', error)
      throw error
    }
  }

  const handleRestock = async () => {
    if (!selectedIngredientId || !restockForm.quantity || !restockForm.unitprice) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }

    try {
      const { supabase } = await import('@/utils/supabaseClient')
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      
      // ===== CONVERT & VALIDATE ALL NUMERIC FIELDS =====
      const quantity = Math.floor(parseFloat(restockForm.quantity) || 0)
      const unitprice = Math.floor(parseFloat(restockForm.unitprice) || 0)
      const totalcost = quantity * unitprice
      
      // Convert branch + ingredient IDs to numbers
      const branchId = Number(userBranchId || selectedBranch)
      const ingredientId = Number(selectedIngredientId)
      const employeeid = Number(currentUser.employeeid) || Number(currentUser.id) || 0
      
      console.log('[RESTOCK] Converted values:', { quantity, unitprice, totalcost, branchId, ingredientId, employeeid })

      // 1. Create stockreceipts record (Phiếu nhập)
      const { data: receiptData, error: receiptError } = await supabase
        .from('stockreceipts')
        .insert({
          importdate: new Date().toISOString(),
          totalcost: totalcost,
          branchid: branchId,
          employeeid: employeeid,
        })
        .select()

      if (receiptError) {
        console.error('[RESTOCK] stockreceipts error:', receiptError)
        throw receiptError
      }
      const receiptid = receiptData?.[0]?.receiptid
      console.log('[RESTOCK] Receipt created:', receiptid)

      // 2. Create receiptdetails record (Chi tiết nhập)
      if (receiptid) {
        const { error: detailError } = await supabase
          .from('receiptdetails')
          .insert({
            receiptid: receiptid,
            ingredientid: ingredientId,
            quantity: quantity,
            unitprice: unitprice,
            amount: totalcost,
          })

        if (detailError) {
          console.error('[RESTOCK] receiptdetails error:', detailError)
          throw detailError
        }
        console.log('[RESTOCK] Receipt details created')

        // 3. Update branchinventory currentstock (Cập nhật tồn kho)
        const { data: currentInventory, error: getError } = await supabase
          .from('branchinventory')
          .select('currentstock')
          .eq('branchid', branchId)
          .eq('ingredientid', ingredientId)
          .single()

        if (getError && getError.code !== 'PGRST116') {
          console.error('[RESTOCK] Get current stock error:', getError)
          throw getError
        }

        const currentStock = currentInventory?.currentstock || 0
        const newStock = currentStock + quantity

        const { error: updateError } = await supabase
          .from('branchinventory')
          .upsert({
            branchid: branchId,
            ingredientid: ingredientId,
            currentstock: newStock,
          })

        if (updateError) {
          console.error('[RESTOCK] Update inventory error:', updateError)
          throw updateError
        }
        console.log('[RESTOCK] Inventory updated. New stock:', newStock)
      }

      showToast('Nhập kho thành công', 'success')
      setIsRestockModalOpen(false)
      setSelectedIngredientId('')
      setRestockForm({ quantity: '', unitprice: '' })
      
      if (selectedBranch) {
        loadBranchInventory(selectedBranch)
      }
    } catch (error) {
      console.error('Error restocking:', error)
      showToast('Lỗi khi nhập kho', 'error')
    }
  }

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
      const currentStock = currentStockForAudit
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
            notes: auditForm.notes || null,
          })

        if (detailError) throw detailError
      }

      // 3. Update branchinventory currentstock
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
      setCurrentStockForAudit(0)
      setAuditForm({ actualStock: '', reason: 'Hao hụt', notes: '' })
      
      if (selectedBranch) {
        loadBranchInventory(selectedBranch)
      }
    } catch (error) {
      console.error('[ERROR] handleAudit failed:', error)
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

    if (!newIngredientForm.sizeid) {
      showToast('Vui lòng chọn Size', 'error')
      return
    }

    try {
      const recipe = {
        productid: selectedProduct,
        ingredientid: newIngredientForm.ingredientid,
        amount: Number(newIngredientForm.amount),
        sizeid: Number(newIngredientForm.sizeid),
      }
      console.log('[Inventory] Creating recipe with sizeid:', recipe.sizeid)
      await recipeService.createRecipe(recipe)
      showToast('Thêm nguyên liệu thành công', 'success')
      loadRecipes(selectedProduct, selectedSize)
      setNewIngredientForm({ ingredientid: '', amount: '', sizeid: '' })
    } catch (error) {
      console.error('Error adding ingredient:', error)
      showToast('Lỗi khi thêm nguyên liệu', 'error')
    }
  }

  const handleRemoveRecipe = async (recipeid: string) => {
    try {
      await recipeService.deleteRecipe(recipeid)
      showToast('Xóa công thức thành công', 'success')
      if (selectedProduct) loadRecipes(selectedProduct, selectedSize)
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
        selectedIngredientUnit={branchInventory.find(item => item.ingredientid === selectedIngredientId)?.ingredient?.unit || ''}
      />

      {/* Audit Modal */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false)
          setSelectedIngredientForAudit('')
          setCurrentStockForAudit(0)
          setAuditForm({ actualStock: '', reason: 'Hao hụt', notes: '' })
        }}
        onSubmit={handleAudit}
        form={auditForm}
        onFormChange={(field, value) => setAuditForm(prev => ({ ...prev, [field]: value }))}
        selectedIngredientName={branchInventory.find(item => item.ingredientid === selectedIngredientForAudit)?.ingredient?.name || ''}
        currentStock={currentStockForAudit}
      />

      {/* Add Ingredient Modal */}
      <AddIngredientModal
        isOpen={isAddIngredientModalOpen}
        onClose={() => setIsAddIngredientModalOpen(false)}
        onSubmit={handleAddIngredient}
      />

      <h1 style={{ color: colors.text, marginBottom: '24px', overflow: 'visible', whiteSpace: 'normal' }}>Quản lý Kho hàng</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
        {/* Danh mục tab */}
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
        <InventoryCategoriesTab 
          ingredients={ingredients} 
          searchIngredient={searchIngredient} 
          onSearchChange={setSearchIngredient}
          isSuperAdmin={isSuperAdmin}
          onAddCategory={() => setIsAddIngredientModalOpen(true)}
        />
      )}
      {activeTab === 'inventory' && (
        <InventoryStockTab
          branches={branches}
          selectedBranch={selectedBranch}
          onBranchChange={(branchId) => {
            setSelectedBranch(branchId)
            loadBranchInventory(branchId)
          }}
          branchInventory={branchInventory}
          canEdit={true}
          onRestockClick={(ingredientId: string) => {
            setSelectedIngredientId(ingredientId)
            setIsRestockModalOpen(true)
          }}
          onAuditClick={(ingredientId: string, currentStock: number) => {
            setSelectedIngredientForAudit(ingredientId)
            setCurrentStockForAudit(currentStock)
            setAuditForm({ actualStock: String(currentStock), reason: 'Hao hụt', notes: '' })
            setIsAuditModalOpen(true)
          }}
        />
      )}
      {activeTab === 'recipes' && (
        <RecipesTab
          products={products}
          sizes={sizes}
          selectedProduct={selectedProduct}
          selectedSize={selectedSize}
          onProductChange={(productId) => {
            setSelectedProduct(productId)
            loadRecipes(productId, selectedSize)
          }}
          onSizeChange={(sizeId) => {
            console.log('[Inventory] Size changed to:', sizeId)
            setSelectedSize(sizeId)
            // Re-fetch recipes with new size filter
            if (selectedProduct) {
              loadRecipes(selectedProduct, sizeId)
            }
          }}
          recipes={recipes}
          availableIngredients={ingredients}
          newIngredientForm={newIngredientForm}
          onFormChange={onFormChange}
          onAddIngredient={handleAddIngredientToProduct}
          onRemoveRecipe={handleRemoveRecipe}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  )
}
