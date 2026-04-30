import { supabase } from './supabaseClient'
import { getTableDisplayName } from './tableNameMapping'

export interface DependencyCheckResult {
  hasDependencies: boolean
  dependencies: {
    table: string
    tableName: string
    count: number
  }[]
}

// ============= CHECK PRODUCT DEPENDENCIES =============
export async function checkProductDependencies(productId: string | number): Promise<DependencyCheckResult> {
  try {
    const deps: DependencyCheckResult['dependencies'] = []

    // Check orderdetails
    const { count: orderDetailsCount } = await supabase
      .from('orderdetails')
      .select('*', { count: 'exact', head: true })
      .eq('productid', productId)

    if (orderDetailsCount && orderDetailsCount > 0) {
      deps.push({
        table: 'orderdetails',
        tableName: getTableDisplayName('orderdetails'),
        count: orderDetailsCount
      })
    }

    // Check branchproductstatus
    const { count: branchStatusCount } = await supabase
      .from('branchproductstatus')
      .select('*', { count: 'exact', head: true })
      .eq('productid', productId)

    if (branchStatusCount && branchStatusCount > 0) {
      deps.push({
        table: 'branchproductstatus',
        tableName: getTableDisplayName('branchproductstatus'),
        count: branchStatusCount
      })
    }

    // Check recipes
    const { count: recipesCount } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('productid', productId)

    if (recipesCount && recipesCount > 0) {
      deps.push({
        table: 'recipes',
        tableName: getTableDisplayName('recipes'),
        count: recipesCount
      })
    }

    // Check product_favorites
    const { count: favoritesCount } = await supabase
      .from('product_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('productid', productId)

    if (favoritesCount && favoritesCount > 0) {
      deps.push({
        table: 'product_favorites',
        tableName: getTableDisplayName('product_favorites'),
        count: favoritesCount
      })
    }

    return {
      hasDependencies: deps.length > 0,
      dependencies: deps
    }
  } catch (error) {
    console.error('Error checking product dependencies:', error)
    throw error
  }
}

// ============= CHECK CATEGORY DEPENDENCIES =============
export async function checkCategoryDependencies(categoryId: string | number): Promise<DependencyCheckResult> {
  try {
    const deps: DependencyCheckResult['dependencies'] = []

    // Check products
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('categoryid', categoryId)

    if (productsCount && productsCount > 0) {
      deps.push({
        table: 'products',
        tableName: getTableDisplayName('products'),
        count: productsCount
      })
    }

    return {
      hasDependencies: deps.length > 0,
      dependencies: deps
    }
  } catch (error) {
    console.error('Error checking category dependencies:', error)
    throw error
  }
}

// ============= CHECK SIZE DEPENDENCIES =============
export async function checkSizeDependencies(sizeId: string | number): Promise<DependencyCheckResult> {
  try {
    const deps: DependencyCheckResult['dependencies'] = []

    // Check orderdetails
    const { count: orderDetailsCount } = await supabase
      .from('orderdetails')
      .select('*', { count: 'exact', head: true })
      .eq('sizeid', sizeId)

    if (orderDetailsCount && orderDetailsCount > 0) {
      deps.push({
        table: 'orderdetails',
        tableName: getTableDisplayName('orderdetails'),
        count: orderDetailsCount
      })
    }

    // Check recipes
    const { count: recipesCount } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('sizeid', sizeId)

    if (recipesCount && recipesCount > 0) {
      deps.push({
        table: 'recipes',
        tableName: getTableDisplayName('recipes'),
        count: recipesCount
      })
    }

    return {
      hasDependencies: deps.length > 0,
      dependencies: deps
    }
  } catch (error) {
    console.error('Error checking size dependencies:', error)
    throw error
  }
}

// ============= CHECK TOPPING DEPENDENCIES =============
export async function checkToppingDependencies(toppingId: string | number): Promise<DependencyCheckResult> {
  try {
    const deps: DependencyCheckResult['dependencies'] = []

    // Check ordertoppings
    const { count: orderToppingsCount } = await supabase
      .from('ordertoppings')
      .select('*', { count: 'exact', head: true })
      .eq('toppingid', toppingId)

    if (orderToppingsCount && orderToppingsCount > 0) {
      deps.push({
        table: 'ordertoppings',
        tableName: getTableDisplayName('ordertoppings'),
        count: orderToppingsCount
      })
    }

    // Check recipes
    const { count: recipesCount } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('toppingid', toppingId)

    if (recipesCount && recipesCount > 0) {
      deps.push({
        table: 'recipes',
        tableName: getTableDisplayName('recipes'),
        count: recipesCount
      })
    }

    return {
      hasDependencies: deps.length > 0,
      dependencies: deps
    }
  } catch (error) {
    console.error('Error checking topping dependencies:', error)
    throw error
  }
}

// ============= CHECK VOUCHER DEPENDENCIES =============
export async function checkVoucherDependencies(voucherId: number | string): Promise<DependencyCheckResult> {
  try {
    const deps: DependencyCheckResult['dependencies'] = []

    // Check customervouchers
    const { count: customerVouchersCount } = await supabase
      .from('customervouchers')
      .select('*', { count: 'exact', head: true })
      .eq('voucherid', voucherId)

    if (customerVouchersCount && customerVouchersCount > 0) {
      deps.push({
        table: 'customervouchers',
        tableName: getTableDisplayName('customervouchers'),
        count: customerVouchersCount
      })
    }

    return {
      hasDependencies: deps.length > 0,
      dependencies: deps
    }
  } catch (error) {
    console.error('Error checking voucher dependencies:', error)
    throw error
  }
}

// ============= CHECK EMPLOYEE DEPENDENCIES =============
export async function checkEmployeeDependencies(employeeId: string | number): Promise<DependencyCheckResult> {
  try {
    const deps: DependencyCheckResult['dependencies'] = []

    // Check stockreceipts
    const { count: stockReceiptsCount } = await supabase
      .from('stockreceipts')
      .select('*', { count: 'exact', head: true })
      .eq('employeeid', employeeId)

    if (stockReceiptsCount && stockReceiptsCount > 0) {
      deps.push({
        table: 'stockreceipts',
        tableName: getTableDisplayName('stockreceipts'),
        count: stockReceiptsCount
      })
    }

    // Check inventoryaudits
    const { count: auditsCount } = await supabase
      .from('inventoryaudits')
      .select('*', { count: 'exact', head: true })
      .eq('employeeid', employeeId)

    if (auditsCount && auditsCount > 0) {
      deps.push({
        table: 'inventoryaudits',
        tableName: getTableDisplayName('inventoryaudits'),
        count: auditsCount
      })
    }

    // Check accounts
    const { count: accountsCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('employeeid', employeeId)

    if (accountsCount && accountsCount > 0) {
      deps.push({
        table: 'accounts',
        tableName: getTableDisplayName('accounts'),
        count: accountsCount
      })
    }

    return {
      hasDependencies: deps.length > 0,
      dependencies: deps
    }
  } catch (error) {
    console.error('Error checking employee dependencies:', error)
    throw error
  }
}

// ============= CHECK BRANCH DEPENDENCIES =============
export async function checkBranchDependencies(branchId: string | number): Promise<DependencyCheckResult> {
  try {
    const deps: DependencyCheckResult['dependencies'] = []

    // Check orders
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('branchid', branchId)

    if (ordersCount && ordersCount > 0) {
      deps.push({
        table: 'orders',
        tableName: getTableDisplayName('orders'),
        count: ordersCount
      })
    }

    // Check employees
    const { count: employeesCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('branchid', branchId)

    if (employeesCount && employeesCount > 0) {
      deps.push({
        table: 'employees',
        tableName: getTableDisplayName('employees'),
        count: employeesCount
      })
    }

    // Check branchproductstatus
    const { count: productStatusCount } = await supabase
      .from('branchproductstatus')
      .select('*', { count: 'exact', head: true })
      .eq('branchid', branchId)

    if (productStatusCount && productStatusCount > 0) {
      deps.push({
        table: 'branchproductstatus',
        tableName: getTableDisplayName('branchproductstatus'),
        count: productStatusCount
      })
    }

    // Check branchinventory
    const { count: inventoryCount } = await supabase
      .from('branchinventory')
      .select('*', { count: 'exact', head: true })
      .eq('branchid', branchId)

    if (inventoryCount && inventoryCount > 0) {
      deps.push({
        table: 'branchinventory',
        tableName: getTableDisplayName('branchinventory'),
        count: inventoryCount
      })
    }

    return {
      hasDependencies: deps.length > 0,
      dependencies: deps
    }
  } catch (error) {
    console.error('Error checking branch dependencies:', error)
    throw error
  }
}
