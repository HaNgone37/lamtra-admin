import { supabase } from '@/utils/supabaseClient'
import { Recipe, Ingredient, Product } from '@/types'

/**
 * ============================================
 * ≡ƒÅ¡ INVENTORY SERVICE - KHO H├ÇNG
 * ============================================
 * 
 * Service layer cho tß║Ñt cß║ú c├íc bß║úng li├¬n quan:
 * - ingredients (danh mß╗Ñc nguy├¬n liß╗çu)
 * - branchinventory (tß╗ôn kho chi nh├ính)
 * - recipes (c├┤ng thß╗⌐c)
 */

// ============ TYPES ============

export interface BranchInventory {
  branchid: string
  ingredientid: string
  currentstock: number
  minstocklevel?: number
  ingredient?: Ingredient
  branch?: {
    branchid: string
    name: string
  }
}

export interface Branch {
  branchid: string
  name: string
  address: string
  isactive: boolean
}

export const ingredientService = {
  /**
   * Lß║Ñy tß║Ñt cß║ú nguy├¬n liß╗çu (danh mß╗Ñc)
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
      console.error('Γ¥î Error fetching ingredients:', error)
      throw error
    }
  },

  /**
   * Tß║ío nguy├¬n liß╗çu mß╗¢i (chß╗ë Super Admin)
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
      console.error('Γ¥î Error creating ingredient:', error)
      throw error
    }
  },

  /**
   * Cß║¡p nhß║¡t nguy├¬n liß╗çu (chß╗ë Super Admin)
   */
  async updateIngredient(ingredientId: string, updates: Partial<Ingredient>): Promise<Ingredient> {
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
      console.error('Γ¥î Error updating ingredient:', error)
      throw error
    }
  },

  /**
   * X├│a nguy├¬n liß╗çu (chß╗ë Super Admin)
   */
  async deleteIngredient(ingredientId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('ingredientid', ingredientId)

      if (error) throw error
    } catch (error) {
      console.error('Γ¥î Error deleting ingredient:', error)
      throw error
    }
  },
}

// ============ BRANCH INVENTORY SERVICE ============

export const branchInventoryService = {
  /**
   * Lß║Ñy tß╗ôn kho cß╗ºa Tß║ñT Cß║ó chi nh├ính (chß╗ë Super Admin)
   */
  async getAllBranchInventory(): Promise<BranchInventory[]> {
    try {
      const { data, error } = await supabase
        .from('branchinventory')
        .select('*, ingredients:ingredients(name, unit, minstocklevel)')
        .order('branchid', { ascending: true })

      if (error) throw error
      
      return (data || []).map(item => ({
        branchid: item.branchid,
        ingredientid: item.ingredientid,
        currentstock: item.currentstock,
        minstocklevel: item.minstocklevel,
        ingredient: item.ingredients as any,
      }))
    } catch (error) {
      console.error('Γ¥î Error fetching all branch inventory:', error)
      throw error
    }
  },

  /**
   * Lß║Ñy tß╗ôn kho cß╗ºa 1 chi nh├ính cß╗Ñ thß╗â
   * ΓÜá∩╕Å DEBUG: branchId tß╗½ localStorage l├á STRING, cß║ºn ├⌐p th├ánh NUMBER!
   */
  async getBranchInventoryByBranch(branchId: string): Promise<BranchInventory[]> {
    try {
      // ===== B╞»ß╗ÜC 1: ├ëp kiß╗âu branchId =====
      const branchIdNum = Number(branchId)
      console.log('≡ƒöì [getBranchInventoryByBranch] START')
      console.log('≡ƒôÑ branchId input (string):', branchId)
      console.log('≡ƒôñ branchId converted (number):', branchIdNum)
      console.log('ΓÜá∩╕Å  typeof branchIdNum:', typeof branchIdNum)

      // ===== B╞»ß╗ÜC 2: Fetch tß╗ôn kho + JOIN ingredients =====
      const { data, error } = await supabase
        .from('branchinventory')
        .select('*, ingredients:ingredients(name, unit, baseprice, minstocklevel)')
        .eq('branchid', branchIdNum) // ≡ƒöæ ─É├éY L├Ç KH├ôA: d├╣ng NUMBER, kh├┤ng STRING!
        .order('ingredientid', { ascending: true })

      console.log('≡ƒôè Supabase response:', {
        errorCode: error?.code,
        errorMessage: error?.message,
        dataLength: data?.length || 0,
        data: data,
      })

      if (error) throw error

      // ===== B╞»ß╗ÜC 3: Map dß╗» liß╗çu =====
      const mappedData = (data || []).map((item: any) => {
        console.log('≡ƒöù Mapping item:', {
          branchid: item.branchid,
          ingredientid: item.ingredientid,
          currentstock: item.currentstock,
          hasIngredient: !!item.ingredients,
        })
        return {
          branchid: item.branchid,
          ingredientid: item.ingredientid,
          currentstock: item.currentstock,
          minstocklevel: item.minstocklevel,
          ingredient: item.ingredients as any,
        }
      })

      console.log('Γ£à [getBranchInventoryByBranch] SUCCESS - returned', mappedData.length, 'items')
      return mappedData
    } catch (error) {
      console.error('Γ¥î [getBranchInventoryByBranch] ERROR:', error)
      throw error
    }
  },

  /**
   * Cß║¡p nhß║¡t stock cß╗ºa nguy├¬n liß╗çu
   */
  async updateStock(branchId: string, ingredientId: string, currentstock: number): Promise<BranchInventory> {
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
      console.error('Γ¥î Error updating stock:', error)
      throw error
    }
  },

  /**
   * Cß║¡p nhß║¡t min stock level (ng╞░ß╗íng cß║únh b├ío)
   */
  async updateMinStockLevel(branchId: string, ingredientId: string, minstocklevel: number): Promise<BranchInventory> {
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
      console.error('Γ¥î Error updating min stock level:', error)
      throw error
    }
  },

  /**
   * Th├¬m nguy├¬n liß╗çu v├áo tß╗ôn kho cß╗ºa chi nh├ính
   */
  async addToInventory(branchId: string, ingredientId: string, currentstock: number, minstocklevel: number = 0): Promise<BranchInventory> {
    try {
      const { data, error } = await supabase
        .from('branchinventory')
        .insert([
          {
            branchid: branchId,
            ingredientid: ingredientId,
            currentstock,
            minstocklevel,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Γ¥î Error adding to inventory:', error)
      throw error
    }
  },
}

// ============ RECIPES SERVICE ============

export const recipeService = {
  /**
   * Lß║Ñy tß║Ñt cß║ú c├┤ng thß╗⌐c vß╗¢i JOIN products v├á ingredients
   * Γ£à Sß╗¡ dß╗Ñng cß╗Öt 'amount' (thay v├¼ quantity)
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
      
      return (data || []).map(item => ({
        recipeid: item.recipeid,
        productid: item.productid,
        ingredientid: item.ingredientid,
        amount: item.amount,
        product: item.products as any,
        ingredient: item.ingredients as unknown as Ingredient,
      }))
    } catch (error) {
      console.error('Γ¥î Error fetching recipes:', error)
      throw error
    }
  },

  /**
   * Lß║Ñy c├┤ng thß╗⌐c cß╗ºa sß║ún phß║⌐m cß╗Ñ thß╗â
   * Γ£à Sß╗¡ dß╗Ñng cß╗Öt 'amount'
   */
  async getRecipesByProduct(productId: string, sizeId?: number | string): Promise<Recipe[]> {
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

      // Add size filter if sizeId is provided
      if (sizeId !== undefined && sizeId !== null && sizeId !== 'all') {
        query = query.eq('sizeid', sizeId)
        console.log('[RecipeService] Filtering by sizeid:', sizeId)
      }

      const { data, error } = await query.order('ingredientid', { ascending: true })

      if (error) throw error
      
      console.log('[RecipeService] Fetched recipes count:', data?.length, 'for productId:', productId, 'sizeId:', sizeId)
      
      return (data || []).map(item => ({
        recipeid: item.recipeid,
        productid: item.productid,
        sizeid: item.sizeid,
        ingredientid: item.ingredientid,
        amount: item.amount,
        product: item.products as any,
        ingredient: item.ingredients as unknown as Ingredient,
        sizes: item.sizes as any,
      }))
    } catch (error) {
      console.error('Γ¥î Error fetching recipes by product:', error)
      throw error
    }
  },

  /**
   * Th├¬m c├┤ng thß╗⌐c mß╗¢i (chß╗ë Super Admin)
   * Γ£à Gß╗¡i 'amount' (kh├┤ng 'quantity')
   */
  async createRecipe(recipe: Omit<Recipe, 'recipeid'>): Promise<Recipe> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          productid: recipe.productid,
          ingredientid: recipe.ingredientid,
          amount: recipe.amount,
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
        product: data.products as any,
        ingredient: data.ingredients as unknown as Ingredient,
      }
    } catch (error) {
      console.error('Γ¥î Error creating recipe:', error)
      throw error
    }
  },

  /**
   * Cß║¡p nhß║¡t c├┤ng thß╗⌐c (chß╗ë Super Admin)
   * Γ£à Cß║¡p nhß║¡t 'amount' field
   */
  async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
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
        product: data.products as any,
        ingredient: data.ingredients as unknown as Ingredient,
      }
    } catch (error) {
      console.error('Γ¥î Error updating recipe:', error)
      throw error
    }
  },

  /**
   * X├│a c├┤ng thß╗⌐c (chß╗ë Super Admin)
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('recipeid', recipeId)

      if (error) throw error
    } catch (error) {
      console.error('Γ¥î Error deleting recipe:', error)
      throw error
    }
  },
}

// ============ PRODUCTS SERVICE ============

export const productService = {
  /**
   * Lß║Ñy tß║Ñt cß║ú sß║ún phß║⌐m (cho dropdown trong recipes form)
   */
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('productid, name')
        .eq('status', '─Éang b├ín')
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []) as any
    } catch (error) {
      console.error('Γ¥î Error fetching products:', error)
      throw error
    }
  },
}

// ============ BRANCHES SERVICE ============

export const branchService = {
  /**
   * Lß║Ñy tß║Ñt cß║ú chi nh├ính hoß║ít ─æß╗Öng
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
      console.error('Γ¥î Error fetching branches:', error)
      throw error
    }
  },

  /**
   * Lß║Ñy chi nh├ính cß╗Ñ thß╗â theo ID
   */
  async getBranchById(branchId: string): Promise<Branch | null> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('branchid', branchId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('Γ¥î Error fetching branch:', error)
      throw error
    }
  },
}

// ============ STOCK RECEIPTS SERVICE ============

export const stockReceiptService = {
  /**
   * Tß║ío phiß║┐u nhß║¡p kho (stockreceipts + receiptdetails)
   * 
   * Γ£à Kh├┤ng gß╗¡i receiptid (tß╗▒ t─âng)
   * Γ£à Sß╗¡ dß╗Ñng quantity (sß╗æ l╞░ß╗úng nhß║¡p) + amount (th├ánh tiß╗ün)
   */
  async createReceipt(
    branchId: number,
    employeeid: number | string,
    items: Array<{
      ingredientid: number
      quantity: number
      unitprice: number
    }>
  ): Promise<{ receiptid: number; totalcost: number }> {
    try {
      const totalcost = items.reduce((sum, item) => sum + item.quantity * item.unitprice, 0)

      // 1. Tß║ío stockreceipts record
      const { data: receiptData, error: receiptError } = await supabase
        .from('stockreceipts')
        .insert({
          importdate: new Date().toISOString(),
          totalcost: totalcost,
          branchid: branchId,
          employeeid: employeeid,
        })
        .select()
        .single()

      if (receiptError) throw receiptError
      const receiptid = receiptData?.receiptid

      // 2. Tß║ío receiptdetails records
      if (receiptid) {
        const detailsData = items.map(item => ({
          receiptid: receiptid,
          ingredientid: item.ingredientid,
          quantity: item.quantity,
          unitprice: item.unitprice,
          amount: item.quantity * item.unitprice,
        }))

        const { error: detailError } = await supabase
          .from('receiptdetails')
          .insert(detailsData)

        if (detailError) throw detailError
      }

      console.log('Γ£à Receipt created successfully:', receiptid)
      return { receiptid, totalcost }
    } catch (error) {
      console.error('Γ¥î Error creating receipt:', error)
      throw error
    }
  },

  /**
   * Lß║Ñy chi tiß║┐t nhß║¡p tß╗½ receiptdetails
   */
  async getReceiptDetails(receiptId: number) {
    try {
      const { data, error } = await supabase
        .from('receiptdetails')
        .select(`
          id,
          receiptid,
          ingredientid,
          quantity,
          unitprice,
          amount,
          ingredients(name, unit)
        `)
        .eq('receiptid', receiptId)
        .order('ingredientid', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Γ¥î Error fetching receipt details:', error)
      throw error
    }
  },
}

// ============ INVENTORY AUDITS SERVICE ============

export const inventoryAuditService = {
  /**
   * Tß║ío phiß║┐u kiß╗âm k├¬ (inventoryaudits + auditdetails)
   * 
   * Γ£à Kh├┤ng gß╗¡i id hoß║╖c auditid (tß╗▒ t─âng)
   * Γ£à Sß╗¡ dß╗Ñng systemstock (tß╗ôn hß╗ç thß╗æng) + physicalstock (tß╗ôn thß╗▒c tß║┐)
   */
  async createAudit(
    branchId: number | string,
    employeeid: number | string,
    items: Array<{
      ingredientid: number | string
      systemstock: number
      physicalstock: number
      reason: string
    }>
  ): Promise<{ auditid: number; totaldifference: number }> {
    try {
      const totaldifference = items.reduce(
        (sum, item) => sum + (item.physicalstock - item.systemstock),
        0
      )

      // 1. Tß║ío inventoryaudits record
      const { data: auditData, error: auditError } = await supabase
        .from('inventoryaudits')
        .insert({
          auditdate: new Date().toISOString(),
          branchid: branchId,
          employeeid: employeeid,
          totaldifference: totaldifference,
        })
        .select()
        .single()

      if (auditError) throw auditError
      const auditid = auditData?.auditid

      // 2. Tß║ío auditdetails records
      if (auditid) {
        const detailsData = items.map(item => ({
          auditid: auditid,
          ingredientid: item.ingredientid,
          systemstock: item.systemstock,
          physicalstock: item.physicalstock,
          difference: item.physicalstock - item.systemstock,
          reason: item.reason,
        }))

        const { error: detailError } = await supabase
          .from('auditdetails')
          .insert(detailsData)

        if (detailError) throw detailError
      }

      console.log('Γ£à Audit created successfully:', auditid)
      return { auditid, totaldifference }
    } catch (error) {
      console.error('Γ¥î Error creating audit:', error)
      throw error
    }
  },

  /**
   * Lß║Ñy chi tiß║┐t kiß╗âm k├¬ tß╗½ auditdetails
   */
  async getAuditDetails(auditId: number) {
    try {
      const { data, error } = await supabase
        .from('auditdetails')
        .select(`
          id,
          auditid,
          ingredientid,
          systemstock,
          physicalstock,
          difference,
          reason,
          ingredients(name, unit)
        `)
        .eq('auditid', auditId)
        .order('ingredientid', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Γ¥î Error fetching audit details:', error)
      throw error
    }
  },
}
