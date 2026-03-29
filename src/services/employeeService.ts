import { supabase } from '@/utils/supabaseClient'
import type { Branch, EmployeeWithBranch, EmployeeFormData } from '@/types'

// Re-export types for backward compatibility
export type { EmployeeWithBranch, EmployeeFormData }

export const employeeService = {
  // ============================================================
  // GET ALL EMPLOYEES (with optional branch filter)
  // ============================================================
  async getAllEmployees(branchId?: number | null): Promise<EmployeeWithBranch[]> {
    try {
      let query = supabase
        .from('employees')
        .select('employeeid, fullname, email, phone, position, status, branchid, created_at, branches(name), accounts(accountid, role, isactive)')
        .order('fullname', { ascending: true })

      // Apply branch filter if provided
      if (branchId) {
        query = query.eq('branchid', branchId)
        console.log('[DATA] Filter by branchid:', branchId)
      }

      const { data, error } = await query

      if (error) {
        console.error('[ERROR] getAllEmployees:', error.message)
        throw new Error(`Lỗi tải nhân viên: ${error.message}`)
      }

      if (!data) {
        console.warn('[WARN] Không có dữ liệu nhân viên')
        return []
      }

      console.log('[DATA] getAllEmployees returned:', data.length, 'employees')
      return data as unknown as EmployeeWithBranch[]
    } catch (err) {
      console.error('[ERROR] getAllEmployees:', err)
      throw err
    }
  },

  // ============================================================
  // GET BRANCHES
  // ============================================================
  async getBranches(): Promise<Branch[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('branchid, name, address, longitude, latitude, isactive')
        .order('name', { ascending: true })

      if (error) {
        console.error('[ERROR] getBranches:', error.message)
        throw new Error(`Lỗi tải chi nhánh: ${error.message}`)
      }

      if (!data) {
        console.warn('[WARN] Không có chi nhánh')
        return []
      }

      console.log('[DATA] getBranches returned:', data.length, 'branches')
      return data
    } catch (err) {
      console.error('[ERROR] getBranches:', err)
      throw err
    }
  },

  // ============================================================
  // GET EMPLOYEE STATS
  // ============================================================
  async getEmployeeStats(branchId?: number | null) {
    try {
      let query = supabase.from('employees').select('*')

      if (branchId) {
        query = query.eq('branchid', branchId)
      }

      const { data, error } = await query

      if (error) {
        console.error('[ERROR] getEmployeeStats:', error.message)
        throw error
      }

      if (!data) {
        return { totalEmployees: 0, activeEmployees: 0, newThisMonth: 0 }
      }

      const totalEmployees = data.length
      const activeEmployees = data.filter((emp: any) => emp.status === 'Đang làm').length

      // New employees this month
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const newThisMonth = data.filter((emp: any) => {
        if (!emp.created_at) return false
        const empDate = new Date(emp.created_at)
        return empDate.getMonth() === currentMonth && empDate.getFullYear() === currentYear
      }).length

      console.log('[DATA] getEmployeeStats:', { totalEmployees, activeEmployees, newThisMonth })
      return { totalEmployees, activeEmployees, newThisMonth }
    } catch (err) {
      console.error('[ERROR] getEmployeeStats:', err)
      return { totalEmployees: 0, activeEmployees: 0, newThisMonth: 0 }
    }
  },

  // ============================================================
  // GET SINGLE EMPLOYEE
  // ============================================================
  async getEmployeeById(employeeId: string | number): Promise<EmployeeWithBranch | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('employeeid, fullname, email, phone, position, status, branchid, created_at, branches(name)')
        .eq('employeeid', employeeId)
        .single()

      if (error) {
        console.error('[ERROR] getEmployeeById:', error.message)
        throw error
      }

      return data as unknown as EmployeeWithBranch
    } catch (err) {
      console.error('[ERROR] getEmployeeById:', err)
      throw err
    }
  },

  // ============================================================
  // CREATE EMPLOYEE
  // ============================================================
  async createEmployee(employee: EmployeeFormData): Promise<EmployeeWithBranch> {
    try {
      const branchId = Number(employee.branchid)
      if (isNaN(branchId)) {
        throw new Error('Invalid branchid')
      }

      console.log('[START] Creating employee with branchid:', branchId)

      const { data, error } = await supabase
        .from('employees')
        .insert([{
          fullname: employee.fullname,
          email: employee.email,
          phone: employee.phone,
          position: employee.position,
          branchid: branchId,
          status: employee.status || 'active'
        }])
        .select()
        .single()

      if (error) {
        console.error('[ERROR] Creating employee:', error.message)
        throw error
      }

      console.log('[SUCCESS] Employee created:', data.employeeid)

      const fetchedEmployee = await employeeService.getEmployeeById(data.employeeid)
      if (!fetchedEmployee) throw new Error('Failed to fetch created employee')
      return fetchedEmployee
    } catch (err) {
      console.error('[ERROR] createEmployee:', err)
      throw err
    }
  },

  // ============================================================
  // UPDATE EMPLOYEE
  // ============================================================
  async updateEmployee(employeeId: string | number, updates: Partial<EmployeeFormData>): Promise<EmployeeWithBranch> {
    try {
      const updateData: any = { ...updates }

      if (updates.branchid) {
        const branchId = Number(updates.branchid)
        if (isNaN(branchId)) {
          throw new Error('Invalid branchid')
        }
        updateData.branchid = branchId
      }

      console.log('[START] Updating employee:', employeeId)

      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('employeeid', employeeId)

      if (error) {
        console.error('[ERROR] Updating employee:', error.message)
        throw error
      }

      console.log('[SUCCESS] Employee updated:', employeeId)

      const updatedEmployee = await employeeService.getEmployeeById(employeeId)
      if (!updatedEmployee) throw new Error('Failed to fetch updated employee')
      return updatedEmployee
    } catch (err) {
      console.error('[ERROR] updateEmployee:', err)
      throw err
    }
  },

  // ============================================================
  // DELETE EMPLOYEE
  // ============================================================
  async deleteEmployee(employeeId: string | number): Promise<void> {
    try {
      console.log('[START] Deleting employee:', employeeId)

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('employeeid', employeeId)

      if (error) {
        console.error('[ERROR] Deleting employee:', error.message)
        throw error
      }

      console.log('[SUCCESS] Employee deleted:', employeeId)
    } catch (err) {
      console.error('[ERROR] deleteEmployee:', err)
      throw err
    }
  },
}
