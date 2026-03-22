import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { supabase } from '@/utils/supabaseClient'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize user from localStorage and sync with Supabase
  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    try {
      setLoading(true)
      
      // Check localStorage first
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }

      // Check Supabase session
      const { data } = await supabase.auth.getSession()
      
      if (data.session?.user) {
        const { data: account } = await supabase
          .from('accounts')
          .select('*')
          .eq('accountid', data.session.user.id)
          .single()
        
        const userData: User = {
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          accountid: data.session.user.id,
          role: account?.role || 'staff',
          branchid: account?.branchid || '',
          employeeid: account?.employeeid || ''
        }
        
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } else {
        // Clear stored user if session is invalid
        localStorage.removeItem('user')
        setUser(null)
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      if (data.user) {
        // Fetch account info from accounts table using user ID
        const { data: account } = await supabase
          .from('accounts')
          .select('*')
          .eq('accountid', data.user.id)
          .single()
        
        const userData: User = {
          email: data.user.email || '',
          name: data.user.user_metadata?.name || '',
          accountid: data.user.id,
          role: account?.role || 'staff',
          branchid: account?.branchid || '',
          employeeid: account?.employeeid || ''
        }
        
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      }
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem('user')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
