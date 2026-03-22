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
  async getBranchById(branchId: string): Promise<Branch | null> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('branchid', branchId)
      .single()

    if (error) {
      console.error('Error fetching branch:', error)
      throw error
    }
    return data
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
