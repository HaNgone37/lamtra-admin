import { supabase } from '@/utils/supabaseClient'
import { Product, Category, Size, Topping, Branch } from '@/types'

// ============= PRODUCT SERVICE =============
export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('categoryid', categoryId)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }
  },

  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('productid', productId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  },

  async createProduct(product: {
    name: string
    subtitle: string
    description: string
    baseprice: number
    imageurl: string
    status: string
    categoryid: string
  }): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('productid', productId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  },

  async updateProductStatus(productId: string, newStatus: string): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('productid', productId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating product status:', error)
      throw error
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('productid', productId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }
}

// ============= CATEGORY SERVICE =============
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },

  async createCategory(category: { name: string; description: string }): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('categoryid', categoryId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  },

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('categoryid', categoryId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }
}

// ============= SIZE SERVICE =============
export const sizeService = {
  async getSizes(): Promise<Size[]> {
    try {
      const { data, error } = await supabase
        .from('sizes')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sizes:', error)
      throw error
    }
  },

  async createSize(size: { name: string; additionalprice: number }): Promise<Size> {
    try {
      const { data, error } = await supabase
        .from('sizes')
        .insert([size])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating size:', error)
      throw error
    }
  },

  async updateSize(sizeId: string, updates: Partial<Size>): Promise<Size> {
    try {
      const { data, error } = await supabase
        .from('sizes')
        .update(updates)
        .eq('sizeid', sizeId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating size:', error)
      throw error
    }
  },

  async deleteSize(sizeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sizes')
        .delete()
        .eq('sizeid', sizeId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting size:', error)
      throw error
    }
  }
}

// ============= TOPPING SERVICE =============
export const toppingService = {
  async getToppings(): Promise<Topping[]> {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching toppings:', error)
      throw error
    }
  },

  async createTopping(topping: {
    name: string
    price: number
    imageurl: string
    isavailable: boolean
  }): Promise<Topping> {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .insert([topping])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating topping:', error)
      throw error
    }
  },

  async updateTopping(toppingId: string, updates: Partial<Topping>): Promise<Topping> {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .update(updates)
        .eq('toppingid', toppingId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating topping:', error)
      throw error
    }
  },

  async updateToppingStatus(toppingId: string, isavailable: boolean): Promise<Topping> {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .update({ isavailable })
        .eq('toppingid', toppingId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating topping status:', error)
      throw error
    }
  },

  async deleteTopping(toppingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('toppings')
        .delete()
        .eq('toppingid', toppingId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting topping:', error)
      throw error
    }
  }
}

// ============= BRANCH SERVICE =============
export const branchProductStatusService = {
  async getAllBranches(): Promise<Branch[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('isactive', true)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching branches:', error)
      throw error
    }
  },

  async createBranchProductStatus(
    branchId: string,
    productId: string,
    status: string = 'Còn món'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('branchproductstatus')
        .insert([{ branchid: branchId, productid: productId, status }])
      
      if (error) throw error
    } catch (error) {
      console.error('Error creating branch product status:', error)
      throw error
    }
  },

  async syncProductToAllBranches(productId: string): Promise<void> {
    try {
      const branches = await this.getAllBranches()
      
      for (const branch of branches) {
        await this.createBranchProductStatus(branch.branchid, productId, 'Còn món')
      }
    } catch (error) {
      console.error('Error syncing product to all branches:', error)
      throw error
    }
  }
}
