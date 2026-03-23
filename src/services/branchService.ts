import { supabase } from '@/utils/supabaseClient'
import { Branch } from '@/types'

export const branchService = {
  // Fetch all branches
  async getBranches(): Promise<Branch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('branchid', { ascending: true })

    if (error) {
      console.error('Error fetching branches:', error)
      throw error
    }
    return data || []
  },

  // Get single branch by ID
  // ⚠️ DEBUG: branchId từ localStorage là STRING, ép thành NUMBER!
  async getBranchById(branchId: string): Promise<Branch | null> {
    try {
      const branchIdNum = Number(branchId)
      console.log('🔍 [getBranchById] Input:', branchId, '-> Converted:', branchIdNum)

      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('branchid', branchIdNum) // 🔑 Dùng NUMBER, không STRING!
        .single()

      if (error) {
        console.error('❌ [getBranchById] Error:', error)
        throw error
      }

      console.log('✅ [getBranchById] Found:', data)
      return data
    } catch (error) {
      console.error('❌ [getBranchById] Exception:', error)
      throw error
    }
  },

  // Create new branch
  async createBranch(branch: Omit<Branch, 'branchid'>): Promise<Branch> {
    const { data, error } = await supabase
      .from('branches')
      .insert([branch])
      .select()
      .single()

    if (error) {
      console.error('Error creating branch:', error)
      throw error
    }
    return data
  },

  // Update branch
  async updateBranch(branchId: string, updates: Partial<Branch>): Promise<Branch> {
    const { data, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('branchid', branchId)
      .select()
      .single()

    if (error) {
      console.error('Error updating branch:', error)
      throw error
    }
    return data
  },

  // Toggle branch active status
  async toggleBranchStatus(branchId: string, isActive: boolean): Promise<Branch> {
    return branchService.updateBranch(branchId, { isactive: isActive })
  },

  // Delete branch
  async deleteBranch(branchId: string): Promise<void> {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('branchid', branchId)

    if (error) {
      console.error('Error deleting branch:', error)
      throw error
    }
  }
}
