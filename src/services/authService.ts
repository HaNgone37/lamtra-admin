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
        
        return {
          email: data.user.email || '',
          name: data.user.user_metadata?.name || '',
          accountid: data.user.id,
          role: account?.role || 'staff',
          branchid: account?.branchid || '',
          employeeid: account?.employeeid || ''
        }
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
