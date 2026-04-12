import { supabase } from '@/utils/supabaseClient'
import { User } from '@/types'

export const authService = {
  async login(email: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Fetch user role and account info
      if (data.user) {
        const { data: account } = await supabase
          .from('accounts')
          .select('*')
          .eq('accountid', data.user.id)
          .single()
        
        const user: User = {
          email: data.user.email || '',
          name: data.user.user_metadata?.name || '',
          accountid: data.user.id,
          role: account?.role || 'staff',
          branchid: account?.branchid || null,
          employeeid: account?.employeeid || ''
        }

        // Save role and branchid to localStorage
        localStorage.setItem('userRole', user.role || '')
        localStorage.setItem('userBranchId', String(user.branchid || ''))

        return user
      }
      
      return null
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    }
  },

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear localStorage
      localStorage.removeItem('userRole')
      localStorage.removeItem('userBranchId')
      localStorage.removeItem('user')
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await supabase.auth.getSession()
      
      if (data.session?.user) {
        const { data: account } = await supabase
          .from('accounts')
          .select('*')
          .eq('accountid', data.session.user.id)
          .single()
        
        return {
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          accountid: data.session.user.id,
          role: account?.role || 'staff',
          branchid: account?.branchid || '',
          employeeid: account?.employeeid || ''
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
}
