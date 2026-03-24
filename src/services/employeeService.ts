import { supabase } from '@/utils/supabaseClient'
import type { Branch, EmployeeWithBranch, EmployeeFormData } from '@/types'

// Re-export types for backward compatibility
export type { EmployeeWithBranch, EmployeeFormData }

export const employeeService = {
  // Fetch all employees with branch info
  async getAllEmployees(): Promise<EmployeeWithBranch[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('employeeid, fullname, email, phone, position, status, branchid, created_at, branches(name)')
        .order('fullname', { ascending: true })

      if (error) {
        console.error('Chi tiết lỗi Supabase (getAllEmployees):', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Lỗi tải nhân viên: ${error.message}`)
      }
      
      if (!data) {
        console.warn('Không có dữ liệu nhân viên được trả về')
        return []
      }
      
      return data as unknown as EmployeeWithBranch[]
    } catch (err) {
      console.error('Chi tiết lỗi Supabase (getAllEmployees):', err)
      throw err
    }
  },

  // Fetch employees by branch
  async getEmployeesByBranch(branchId: string): Promise<EmployeeWithBranch[]> {
    try {
      if (!branchId) {
        console.warn('BranchId trống - không thể lọc theo chi nhánh')
        return []
      }
      
      const { data, error } = await supabase
        .from('employees')
        .select('employeeid, fullname, email, phone, position, status, branchid, created_at, branches(name)')
        .eq('branchid', branchId)
        .order('fullname', { ascending: true })

      if (error) {
        console.error('Chi tiết lỗi Supabase (getEmployeesByBranch):', {
          branchId,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Lỗi tải nhân viên chi nhánh ${branchId}: ${error.message}`)
      }
      
      if (!data) {
        console.warn(`Không có nhân viên trong chi nhánh ${branchId}`)
        return []
      }
      
      return data as unknown as EmployeeWithBranch[]
    } catch (err) {
      console.error('Chi tiết lỗi Supabase (getEmployeesByBranch):', err)
      throw err
    }
  },

  // Get single employee
  async getEmployeeById(employeeId: string): Promise<EmployeeWithBranch | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        employeeid,
        fullname,
        email,
        phone,
        position,
        status,
        branchid,
        created_at,
        branches(name)
      `)
      .eq('employeeid', employeeId)
      .single()

    if (error) {
      console.error('Error fetching employee:', error)
      throw error
    }
    return data as unknown as EmployeeWithBranch
  },

  // Create new employee
  async createEmployee(employee: EmployeeFormData): Promise<EmployeeWithBranch> {
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        fullname: employee.fullname,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        branchid: employee.branchid,
        status: employee.status || 'active'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      throw error
    }

    // Fetch with branch info
    return employeeService.getEmployeeById(data.employeeid) as Promise<EmployeeWithBranch>
  },

  // Update employee
  async updateEmployee(employeeId: string, updates: Partial<EmployeeFormData>): Promise<EmployeeWithBranch> {
    const { error } = await supabase
      .from('employees')
      .update(updates)
      .eq('employeeid', employeeId)

    if (error) {
      console.error('Error updating employee:', error)
      throw error
    }

    return employeeService.getEmployeeById(employeeId) as Promise<EmployeeWithBranch>
  },

  // Get branches (for dropdown)
  async getBranches(): Promise<Branch[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Chi tiết lỗi Supabase (getBranches):', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Lỗi tải chi nhánh: ${error.message}`)
      }
      
      if (!data) {
        console.warn('Không có chi nhánh được trả về')
        return []
      }
      
      return data
    } catch (err) {
      console.error('Chi tiết lỗi Supabase (getBranches):', err)
      throw err
    }
  },

  // Check if employee has account
  async checkEmployeeAccount(employeeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('accounts')
      .select('accountid')
      .eq('employeeid', employeeId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking account:', error)
      throw error
    }
    return !!data
  },

  // Get stats
  async getEmployeeStats(branchId?: string) {
    try {
      let query = supabase.from('employees').select('*', { count: 'exact', head: true })
      if (branchId) {
        query = query.eq('branchid', branchId)
      }
      const { count: totalEmployees, error: errTotal } = await query

      if (errTotal) {
        console.error('Chi tiết lỗi Supabase (getEmployeeStats - total):', {
          branchId,
          code: errTotal.code,
          message: errTotal.message
        })
      }

      // Get manager count
      let managerQuery = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('position', 'manager')
      if (branchId) {
        managerQuery = managerQuery.eq('branchid', branchId)
      }
      const { count: managers, error: errManagers } = await managerQuery

      if (errManagers) {
        console.error('Chi tiết lỗi Supabase (getEmployeeStats - managers):', {
          branchId,
          code: errManagers.code,
          message: errManagers.message
        })
      }

      // Get barista count
      let baristaQuery = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('position', 'barista')
      if (branchId) {
        baristaQuery = baristaQuery.eq('branchid', branchId)
      }
      const { count: baristas, error: errBaristas } = await baristaQuery

      if (errBaristas) {
        console.error('Chi tiết lỗi Supabase (getEmployeeStats - baristas):', {
          branchId,
          code: errBaristas.code,
          message: errBaristas.message
        })
      }

      return {
        totalEmployees: totalEmployees || 0,
        managers: managers || 0,
        baristas: baristas || 0
      }
    } catch (err) {
      console.error('Chi tiết lỗi Supabase (getEmployeeStats):', err)
      return {
        totalEmployees: 0,
        managers: 0,
        baristas: 0
      }
    }
  }
}
