import { supabase } from '@/utils/supabaseClient'
import { Recipe, Ingredient, Product } from '@/types'

/**
 * ============================================
 * 🏭 INVENTORY SERVICE - KHO HÀNG (ZERO-ERROR)
 * ============================================
 * 
 * Quy tắc Zero-Error:
 * ✅ Không gửi ID tự tăng (receiptid, auditid, id)
 * ✅ Sử dụng .select().single() để lấy dòng vừa tạo
 * ✅ Không gửi ':1' hoặc ký tự lạ trong API
 * ✅ JOIN đầy đủ để tránh hiện '?'
 */

// ============ TYPES ============

export interface BranchInventory {
  branchid: string | number
  ingredientid: string | number
  currentstock: number
  minstocklevel?: number
  ingredient?: Ingredient
  branch?: {
    branchid: string | number
    name: string
  }
}

export interface Branch {
  branchid: string | number
  name: string
  address: string
  isactive: boolean
}

// ============ INGREDIENT SERVICE ============

export const ingredientService = {
  /**
   * Lấy tất cả nguyên liệu (danh mục)
   */
  async getIngredients(): Promise<Ingredient[]> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching ingredients:', error)
      throw error
    }
  },

  /**
   * Tạo nguyên liệu mới (chỉ Super Admin)
   * ✅ Không gửi ingredientid
   */
  async createIngredient(ingredient: Omit<Ingredient, 'ingredientid'>): Promise<Ingredient> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .insert([ingredient])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error creating ingredient:', error)
      throw error
    }
  },

  /**
   * Cập nhật nguyên liệu (chỉ Super Admin)
   */
  async updateIngredient(ingredientId: string | number, updates: Partial<Ingredient>): Promise<Ingredient> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('ingredientid', ingredientId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error updating ingredient:', error)
      throw error
    }
  },

  /**
   * Xóa nguyên liệu (chỉ Super Admin)
   */
  async deleteIngredient(ingredientId: string | number): Promise<void> {
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('ingredientid', ingredientId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Error deleting ingredient:', error)
      throw error
    }
  },
}

// ============ BRANCH INVENTORY SERVICE ============

export const branchInventoryService = {
  /**
   * Lấy tồn kho của TẤT CẢ chi nhánh (chỉ Super Admin)
   * ✅ JOIN đầy đủ ingredients để tránh hiện '?'
   */
  async getAllBranchInventory(): Promise<BranchInventory[]> {
    try {
      const { data, error } = await supabase
        .from('branchinventory')
        .select(`
          branchid,
          ingredientid,
          currentstock,
          ingredients(ingredientid, name, unit, baseprice, minstocklevel)
        `)
        .order('branchid', { ascending: true })

      if (error) throw error

      return (data || []).map((item: any) => ({
        branchid: item.branchid,
        ingredientid: item.ingredientid,
        currentstock: item.currentstock,
        minstocklevel: item.ingredients?.minstocklevel || 0,
        ingredient: item.ingredients,
      }))
    } catch (error) {
      console.error('❌ Error fetching all branch inventory:', error)
      throw error
    }
  },

  /**
   * Lấy tồn kho của 1 chi nhánh cụ thể
   * ✅ JOIN đầy đủ ingredients để tránh hiện '?'
   */
  async getBranchInventoryByBranch(branchId: string | number): Promise<BranchInventory[]> {
    try {
      const branchIdNum = Number(branchId)
      
      const { data, error } = await supabase
        .from('branchinventory')
        .select(`
          branchid,
          ingredientid,
          currentstock,
          ingredients(ingredientid, name, unit, baseprice, minstocklevel)
        `)
        .eq('branchid', branchIdNum)
        .order('ingredientid', { ascending: true })

      if (error) throw error

      return (data || []).map((item: any) => ({
        branchid: item.branchid,
        ingredientid: item.ingredientid,
        currentstock: item.currentstock,
        minstocklevel: item.ingredients?.minstocklevel || 0,
        ingredient: item.ingredients,
      }))
    } catch (error) {
      console.error('❌ Error fetching branch inventory:', error)
      throw error
    }
  },

  /**
   * Cập nhật stock của nguyên liệu
   */
  async updateStock(branchId: string | number, ingredientId: string | number, currentstock: number): Promise<BranchInventory> {
    try {
      const { data, error } = await supabase
        .from('branchinventory')
        .update({ currentstock })
        .eq('branchid', branchId)
        .eq('ingredientid', ingredientId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error updating stock:', error)
      throw error
    }
  },

  /**
   * Cập nhật min stock level (ngưỡng cảnh báo)
   */
  async updateMinStockLevel(branchId: string | number, ingredientId: string | number, minstocklevel: number): Promise<BranchInventory> {
    try {
      const { data, error } = await supabase
        .from('branchinventory')
        .update({ minstocklevel })
        .eq('branchid', branchId)
        .eq('ingredientid', ingredientId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error updating min stock level:', error)
      throw error
    }
  },

  /**
   * Lấy danh sách nguyên liệu chưa có trong chi nhánh
   * ✅ Lọc nguyên liệu không có trong branchinventory
   */
  async getAvailableIngredientsForBranch(branchId: string | number): Promise<Ingredient[]> {
    try {
      const branchIdNum = Number(branchId)

      // Lấy tất cả nguyên liệu
      const { data: allIngredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true })

      if (ingredientsError) throw ingredientsError

      // Lấy nguyên liệu đã có trong chi nhánh
      const { data: existingItems, error: existingError } = await supabase
        .from('branchinventory')
        .select('ingredientid')
        .eq('branchid', branchIdNum)

      if (existingError) throw existingError

      const existingIds = (existingItems || []).map((item: any) => Number(item.ingredientid))

      // Lọc nguyên liệu chưa có
      const available = (allIngredients || []).filter((ing: any) => !existingIds.includes(Number(ing.ingredientid)))

      return available
    } catch (error) {
      console.error('❌ Error fetching available ingredients:', error)
      throw error
    }
  },

  /**
   * Thêm nguyên liệu vào tồn kho của chi nhánh
   * ✅ Chỉ insert: branchid, ingredientid, currentstock (minstocklevel nằm trong ingredients table)
   */
  async addToInventory(branchId: string | number, ingredientId: string | number, currentstock: number): Promise<BranchInventory> {
    try {
      const { data, error } = await supabase
        .from('branchinventory')
        .insert([
          {
            branchid: branchId,
            ingredientid: ingredientId,
            currentstock,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error adding to inventory:', error)
      throw error
    }
  },
}

// ============ RECIPES SERVICE ============

export const recipeService = {
  /**
   * Lấy tất cả công thức với JOIN products và ingredients
   * ✅ Sử dụng cột 'amount'
   */
  async getRecipes(): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          recipeid,
          productid,
          ingredientid,
          amount,
          products(productid, name),
          ingredients(ingredientid, name, unit, baseprice)
        `)
        .order('productid', { ascending: true })

      if (error) throw error

      return (data || []).map((item: any) => ({
        recipeid: item.recipeid,
        productid: item.productid,
        ingredientid: item.ingredientid,
        amount: item.amount,
        product: item.products,
        ingredient: item.ingredients,
      }))
    } catch (error) {
      console.error('❌ Error fetching recipes:', error)
      throw error
    }
  },

  /**
   * Lấy công thức của sản phẩm cụ thể
   * ✅ Sử dụng cột 'amount'
   */
  async getRecipesByProduct(productId: string | number, sizeId?: number | string): Promise<Recipe[]> {
    try {
      let query = supabase
        .from('recipes')
        .select(`
          recipeid,
          productid,
          sizeid,
          ingredientid,
          amount,
          products(productid, name),
          ingredients(ingredientid, name, unit, baseprice),
          sizes(sizeid, name)
        `)
        .eq('productid', productId)

      if (sizeId !== undefined && sizeId !== null && sizeId !== 'all') {
        query = query.eq('sizeid', sizeId)
      }

      const { data, error } = await query.order('ingredientid', { ascending: true })

      if (error) throw error

      return (data || []).map((item: any) => ({
        recipeid: item.recipeid,
        productid: item.productid,
        sizeid: item.sizeid,
        ingredientid: item.ingredientid,
        amount: item.amount,
        product: item.products,
        ingredient: item.ingredients,
        sizes: item.sizes,
      }))
    } catch (error) {
      console.error('❌ Error fetching recipes by product:', error)
      throw error
    }
  },

  /**
   * Thêm công thức mới (chỉ Super Admin)
   * ✅ Không gửi recipeid
   * ✅ Sử dụng 'amount'
   */
  async createRecipe(recipe: Omit<Recipe, 'recipeid'>): Promise<Recipe> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          productid: recipe.productid,
          ingredientid: recipe.ingredientid,
          amount: recipe.amount,
          sizeid: recipe.sizeid || null,
        }])
        .select(`
          recipeid,
          productid,
          ingredientid,
          amount,
          products(productid, name),
          ingredients(ingredientid, name, unit, baseprice)
        `)
        .single()

      if (error) throw error

      return {
        recipeid: data.recipeid,
        productid: data.productid,
        ingredientid: data.ingredientid,
        amount: data.amount,
        product: (Array.isArray(data.products) ? data.products[0] : data.products) as Product,
        ingredient: (Array.isArray(data.ingredients) ? data.ingredients[0] : data.ingredients) as Ingredient,
      }
    } catch (error) {
      console.error('❌ Error creating recipe:', error)
      throw error
    }
  },

  /**
   * Cập nhật công thức (chỉ Super Admin)
   * ✅ Cập nhật 'amount' field
   */
  async updateRecipe(recipeId: string | number, updates: Partial<Recipe>): Promise<Recipe> {
    try {
      const updateData: any = {}
      if (updates.amount !== undefined) updateData.amount = updates.amount
      if (updates.ingredientid !== undefined) updateData.ingredientid = updates.ingredientid
      if (updates.productid !== undefined) updateData.productid = updates.productid

      const { data, error } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('recipeid', recipeId)
        .select(`
          recipeid,
          productid,
          ingredientid,
          amount,
          products(productid, name),
          ingredients(ingredientid, name, unit, baseprice)
        `)
        .single()

      if (error) throw error

      return {
        recipeid: data.recipeid,
        productid: data.productid,
        ingredientid: data.ingredientid,
        amount: data.amount,
        product: (Array.isArray(data.products) ? data.products[0] : data.products) as Product,
        ingredient: (Array.isArray(data.ingredients) ? data.ingredients[0] : data.ingredients) as Ingredient,
      }
    } catch (error) {
      console.error('❌ Error updating recipe:', error)
      throw error
    }
  },

  /**
   * Xóa công thức (chỉ Super Admin)
   */
  async deleteRecipe(recipeId: string | number): Promise<void> {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('recipeid', recipeId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Error deleting recipe:', error)
      throw error
    }
  },
}

// ============ PRODUCTS SERVICE ============

export const productService = {
  /**
   * Lấy tất cả sản phẩm (cho dropdown trong recipes form)
   */
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('productid, name')
        .eq('status', 'Đang bán')
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []) as any
    } catch (error) {
      console.error('❌ Error fetching products:', error)
      throw error
    }
  },
}

// ============ BRANCHES SERVICE ============

export const branchService = {
  /**
   * Lấy tất cả chi nhánh hoạt động
   */
  async getActiveBranches(): Promise<Branch[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('isactive', true)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching branches:', error)
      throw error
    }
  },

  /**
   * Lấy chi nhánh cụ thể theo ID
   */
  async getBranchById(branchId: string | number): Promise<Branch | null> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('branchid', branchId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('❌ Error fetching branch:', error)
      throw error
    }
  },
}

// ============ STOCK RECEIPT SERVICE ============
/**
 * 🏪 Phiếu nhập kho
 * Luồng: Tạo stockreceipts → Lấy receiptid → Tạo receiptdetails → Cập nhật branchinventory
 */

export const stockReceiptService = {
  /**
   * Tạo phiếu nhập kho
   * 
   * ✅ BƯỚC 1: Insert stockreceipts (KHÔNG gửi receiptid)
   * ✅ BƯỚC 2: Lấy receiptid từ kết quả
   * ✅ BƯỚC 3: Insert receiptdetails (KHÔNG gửi id)
   * ✅ BƯỚC 4: Cập nhật branchinventory
   */
  async createReceipt(params: {
    branchId: number | string
    employeeid: number | string
    quantity: number
    unitprice: number
    ingredientid: number | string
  }): Promise<{ success: boolean; receiptid: number; message: string }> {
    try {
      const { branchId, employeeid, quantity, unitprice, ingredientid } = params
      const totalcost = quantity * unitprice
      const amount = quantity * unitprice

      // ===== BƯỚC 1: Tạo stockreceipts (KHÔNG gửi receiptid) =====
      const { data: receiptData, error: receiptError } = await supabase
        .from('stockreceipts')
        .insert([{
          importdate: new Date().toISOString(),
          totalcost: totalcost,
          branchid: Number(branchId),
          employeeid: String(employeeid),
        }])
        .select()
        .single()

      if (receiptError) {
        console.error('❌ Error creating stockreceipts:', receiptError)
        throw receiptError
      }

      const receiptid = receiptData?.receiptid
      console.log('✅ Receipt created with id:', receiptid)

      // ===== BƯỚC 2 & 3: Tạo receiptdetails (KHÔNG gửi id, receiptid là khóa ngoại) =====
      if (!receiptid) throw new Error('No receiptid returned from database')

      const { error: detailError } = await supabase
        .from('receiptdetails')
        .insert([{
          receiptid: receiptid,
          ingredientid: Number(ingredientid),
          quantity: quantity,
          unitprice: unitprice,
          amount: amount,
        }])

      if (detailError) {
        console.error('❌ Error creating receiptdetails:', detailError)
        throw detailError
      }

      console.log('✅ Receipt details created')

      // ===== BƯỚC 4: Cập nhật branchinventory =====
      const { data: currentInventory } = await supabase
        .from('branchinventory')
        .select('currentstock')
        .eq('branchid', Number(branchId))
        .eq('ingredientid', Number(ingredientid))
        .single()

      const currentStock = currentInventory?.currentstock || 0
      const newStock = currentStock + quantity

      const { error: updateError } = await supabase
        .from('branchinventory')
        .upsert({
          branchid: Number(branchId),
          ingredientid: Number(ingredientid),
          currentstock: newStock,
        })

      if (updateError) {
        console.error('❌ Error updating inventory:', updateError)
        throw updateError
      }

      console.log('✅ Inventory stock updated:', newStock)

      return {
        success: true,
        receiptid: receiptid,
        message: `Nhập kho thành công. Phiếu #${receiptid}`,
      }
    } catch (error) {
      console.error('❌ Error in createReceipt:', error)
      throw error
    }
  },
}

// ============ INVENTORY AUDIT SERVICE ============
/**
 * 📋 Phiếu kiểm kê
 * Luồng: Tạo inventoryaudits → Lấy auditid → Tạo auditdetails → Cập nhật branchinventory
 */

export const inventoryAuditService = {
  /**
   * Tạo phiếu kiểm kê
   * 
   * ✅ BƯỚC 1: Insert inventoryaudits (KHÔNG gửi auditid)
   * ✅ BƯỚC 2: Lấy auditid từ kết quả
   * ✅ BƯỚC 3: Insert auditdetails (KHÔNG gửi id)
   * ✅ BƯỚC 4: Cập nhật branchinventory
   */
  async createAudit(params: {
    branchId: number | string
    employeeid: number | string
    ingredientid: number | string
    systemstock: number
    physicalstock: number
    reason: string
  }): Promise<{ success: boolean; auditid: number; message: string }> {
    try {
      const { branchId, employeeid, ingredientid, systemstock, physicalstock, reason } = params
      const difference = physicalstock - systemstock

      // ===== BƯỚC 1: Tạo inventoryaudits (KHÔNG gửi auditid) =====
      const { data: auditData, error: auditError } = await supabase
        .from('inventoryaudits')
        .insert([{
          auditdate: new Date().toISOString(),
          branchid: Number(branchId),
          employeeid: String(employeeid),
          note: '',
        }])
        .select()
        .single()

      if (auditError) {
        console.error('❌ Error creating inventory audit:', auditError)
        throw auditError
      }

      const auditid = auditData?.auditid
      console.log('✅ Audit created with id:', auditid)

      // ===== BƯỚC 2 & 3: Tạo auditdetails (KHÔNG gửi id) =====
      if (!auditid) throw new Error('No auditid returned from database')

      const { error: detailError } = await supabase
        .from('auditdetails')
        .insert([{
          auditid: auditid,
          ingredientid: Number(ingredientid),
          systemstock: systemstock,
          physicalstock: physicalstock,
          difference: difference,
          reason: reason,
        }])

      if (detailError) {
        console.error('❌ Error creating audit details:', detailError)
        throw detailError
      }

      console.log('✅ Audit details created')

      // ===== BƯỚC 4: Cập nhật branchinventory =====
      const { error: updateError } = await supabase
        .from('branchinventory')
        .upsert({
          branchid: Number(branchId),
          ingredientid: Number(ingredientid),
          currentstock: physicalstock,
        })

      if (updateError) {
        console.error('❌ Error updating inventory:', updateError)
        throw updateError
      }

      console.log('✅ Inventory stock updated:', physicalstock)

      return {
        success: true,
        auditid: auditid,
        message: `Kiểm kê thành công. Chênh lệch: ${difference > 0 ? '+' : ''}${difference}`,
      }
    } catch (error) {
      console.error('❌ Error in createAudit:', error)
      throw error
    }
  },
}
