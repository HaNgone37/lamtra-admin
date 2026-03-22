import { supabase } from '@/utils/supabaseClient'
import { Recipe, Ingredient, Product } from '@/types'

/**
 * ============================================
 * 🏭 INVENTORY SERVICE - KHO HÀNG
 * ============================================
 * 
 * Service layer cho tất cả các bảng liên quan:
 * - ingredients (danh mục nguyên liệu)
 * - branchinventory (tồn kho chi nhánh)
 * - recipes (công thức)
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
      console.error('❌ Error updating ingredient:', error)
      throw error
    }
  },

  /**
   * Xóa nguyên liệu (chỉ Super Admin)
   */
  async deleteIngredient(ingredientId: string): Promise<void> {
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
      console.error('❌ Error fetching all branch inventory:', error)
      throw error
    }
  },

  /**
   * Lấy tồn kho của 1 chi nhánh cụ thể
   */
  async getBranchInventoryByBranch(branchId: string): Promise<BranchInventory[]> {
    try {
      const { data, error } = await supabase
        .from('branchinventory')
        .select('*, ingredients:ingredients(name, unit, minstocklevel)')
        .eq('branchid', branchId)

      if (error) throw error
      
      return (data || []).map(item => ({
        branchid: item.branchid,
        ingredientid: item.ingredientid,
        currentstock: item.currentstock,
        minstocklevel: item.minstocklevel,
        ingredient: item.ingredients as any,
      }))
    } catch (error) {
      console.error('❌ Error fetching branch inventory:', error)
      throw error
    }
  },

  /**
   * Cập nhật stock của nguyên liệu
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
      console.error('❌ Error updating stock:', error)
      throw error
    }
  },

  /**
   * Cập nhật min stock level (ngưỡng cảnh báo)
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
      console.error('❌ Error updating min stock level:', error)
      throw error
    }
  },

  /**
   * Thêm nguyên liệu vào tồn kho của chi nhánh
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
      console.error('❌ Error adding to inventory:', error)
      throw error
    }
  },
}

// ============ RECIPES SERVICE ============

export const recipeService = {
  /**
   * Lấy tất cả công thức với JOIN products và ingredients
   * ✅ Sử dụng cột 'amount' (thay vì quantity)
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
      console.error('❌ Error fetching recipes:', error)
      throw error
    }
  },

  /**
   * Lấy công thức của sản phẩm cụ thể
   * ✅ Sử dụng cột 'amount'
   */
  async getRecipesByProduct(productId: string): Promise<Recipe[]> {
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
        .eq('productid', productId)
        .order('ingredientid', { ascending: true })

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
      console.error('❌ Error fetching recipes by product:', error)
      throw error
    }
  },

  /**
   * Thêm công thức mới (chỉ Super Admin)
   * ✅ Gửi 'amount' (không 'quantity')
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
      console.error('❌ Error creating recipe:', error)
      throw error
    }
  },

  /**
   * Cập nhật công thức (chỉ Super Admin)
   * ✅ Cập nhật 'amount' field
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
      console.error('❌ Error updating recipe:', error)
      throw error
    }
  },

  /**
   * Xóa công thức (chỉ Super Admin)
   */
  async deleteRecipe(recipeId: string): Promise<void> {
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
      console.error('❌ Error fetching branch:', error)
      throw error
    }
  },
}

