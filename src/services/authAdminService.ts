import { supabase } from '@/utils/supabaseClient'

// ============================================================
// TYPE DEFINITIONS
// ============================================================
export interface CreateEmployeeAccountRequest {
  email: string
  password: string
  employeeId: string | number
  branchId: string | number
  role?: 'Super Admin' | 'Branch Manager' | 'Staff'
}

export interface ResetPasswordRequest {
  userId: string
  newPassword: string
}

export interface UpdateAccountStatusRequest {
  userId: string
  isBanned: boolean
}

export interface AccountInfo {
  accountid: string
  role: string
  employeeid: number
  branchid: number | null
  email?: string
  isActive?: boolean
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function getAuthToken(): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    console.error('[AUTH] No active session found')
    throw new Error('Unauthorized: No active session. Please login first.')
  }

  if (!session.access_token) {
    console.error('[AUTH] Session exists but no access token')
    throw new Error('Unauthorized: No access token in session.')
  }

  console.log('[AUTH] Token retrieved, length:', session.access_token.length)
  return session.access_token
}

/**
 * Convert ID to number safely
 * Throws error if conversion fails
 */
function convertToNumber(id: string | number, fieldName: string): number {
  const num = Number(id)
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid ${fieldName}: must be a positive number. Received: ${id}`)
  }
  return num
}

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

export const authAdminService = {
  /**
   * Tạo tài khoản mới cho nhân viên
   * @param request - Thông tin tài khoản cần tạo
   * @returns Kết quả tạo tài khoản (userId, email)
   */
  async createEmployeeAccount(request: CreateEmployeeAccountRequest): Promise<{ userId: string; email: string }> {
    try {
      console.log('[CREATE_ACCOUNT] Starting...')

      // Validate input
      if (!request.email || !request.password) {
        throw new Error('Email and password are required')
      }

      if (request.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Convert IDs to numbers
      const employeeIdNum = convertToNumber(request.employeeId, 'employeeId')
      const branchIdNum = convertToNumber(request.branchId, 'branchId')

      console.log('[CREATE_ACCOUNT] Data validated:', {
        email: request.email,
        employeeId: employeeIdNum,
        branchId: branchIdNum,
        role: request.role || 'Staff',
      })

      // Get auth token
      const token = await getAuthToken()

      // Call Edge Function with Authorization header
      console.log('[CREATE_ACCOUNT] Calling Edge Function...')
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'CREATE_USER',
          email: request.email,
          password: request.password,
          employeeId: employeeIdNum, // Send as number
          branchId: branchIdNum, // Send as number
          role: request.role || 'Staff',
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (error) {
        console.error('[CREATE_ACCOUNT] Edge Function error:', error)
        throw new Error(error.message || 'Failed to create account on Edge Function')
      }

      console.log('[CREATE_ACCOUNT] Success:', { userId: data.userId, email: data.email })
      return {
        userId: data.userId,
        email: data.email,
      }
    } catch (error) {
      console.error('[CREATE_ACCOUNT] Error:', error)
      throw error
    }
  },

  /**
   * Đặt lại mật khẩu cho người dùng
   * @param request - Thông tin reset password
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    try {
      console.log('[RESET_PASSWORD] Starting...')

      if (!request.userId || !request.newPassword) {
        throw new Error('userId and newPassword are required')
      }

      if (request.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters')
      }

      console.log('[RESET_PASSWORD] Data validated')

      const token = await getAuthToken()

      console.log('[RESET_PASSWORD] Calling Edge Function...')
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'RESET_PASSWORD',
          userId: request.userId,
          newPassword: request.newPassword,
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (error) {
        console.error('[RESET_PASSWORD] Edge Function error:', error)
        throw new Error(error.message || 'Failed to reset password on Edge Function')
      }

      console.log('[RESET_PASSWORD] Success')
    } catch (error) {
      console.error('[RESET_PASSWORD] Error:', error)
      throw error
    }
  },

  /**
   * Khóa/Mở khóa tài khoản người dùng
   * @param request - Thông tin khóa/mở tài khoản
   */
  async updateAccountStatus(request: UpdateAccountStatusRequest): Promise<void> {
    try {
      console.log('[UPDATE_STATUS] Starting...', { userId: request.userId, isBanned: request.isBanned })

      if (!request.userId || request.isBanned === undefined) {
        throw new Error('userId and isBanned are required')
      }

      console.log('[UPDATE_STATUS] Data validated')

      const token = await getAuthToken()

      console.log('[UPDATE_STATUS] Calling Edge Function...')
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'TOGGLE_STATUS',
          userId: request.userId,
          isBanned: request.isBanned,
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (error) {
        console.error('[UPDATE_STATUS] Edge Function error:', error)
        throw new Error(error.message || 'Failed to update account status on Edge Function')
      }

      console.log('[UPDATE_STATUS] Success:', { isBanned: request.isBanned })
    } catch (error) {
      console.error('[UPDATE_STATUS] Error:', error)
      throw error
    }
  },

  /**
   * Kiểm tra xem nhân viên có tài khoản đăng nhập hay không
   * @param employeeId - ID của nhân viên
   * @returns Thông tin tài khoản nếu có, null nếu không
   */
  async checkEmployeeAccount(employeeId: string | number): Promise<AccountInfo | null> {
    try {
      console.log('[CHECK_ACCOUNT] Starting for employeeId:', employeeId)

      // Convert ID to number
      const employeeIdNum = convertToNumber(employeeId, 'employeeId')

      // Query accounts table
      const { data, error } = await supabase
        .from('accounts')
        .select('accountid, role, employeeid, branchid')
        .eq('employeeid', employeeIdNum) // Use number ID
        .single()

      if (error) {
        // PGRST116 = no rows returned (expected for employees without accounts)
        if (error.code === 'PGRST116') {
          console.log('[CHECK_ACCOUNT] No account found for employeeId:', employeeIdNum)
          return null
        }

        console.error('[CHECK_ACCOUNT] Query error:', error)
        throw error
      }

      if (!data) {
        console.log('[CHECK_ACCOUNT] No data returned')
        return null
      }

      console.log('[CHECK_ACCOUNT] Account found:', data.accountid)
      return {
        ...data,
        isActive: true,
      }
    } catch (error) {
      console.error('[CHECK_ACCOUNT] Error:', error)
      return null
    }
  },

  /**
   * Lấy thông tin tài khoản của người dùng
   * @param userId - UUID của người dùng trong auth.users
   */
  async getAccountInfo(userId: string): Promise<AccountInfo | null> {
    try {
      console.log('[GET_ACCOUNT_INFO] Starting for userId:', userId)

      // Query accounts table
      const { data, error } = await supabase
        .from('accounts')
        .select('accountid, role, employeeid, branchid')
        .eq('accountid', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[GET_ACCOUNT_INFO] No account found for userId:', userId)
          return null
        }

        console.error('[GET_ACCOUNT_INFO] Query error:', error)
        throw error
      }

      console.log('[GET_ACCOUNT_INFO] Account found')
      return data
    } catch (error) {
      console.error('[GET_ACCOUNT_INFO] Error:', error)
      throw error
    }
  },
}

// ============================================================
// NAMED EXPORTS FOR COMPONENT USAGE
// ============================================================

/**
 * Wrapper: Create employee account
 * Used by Employees component
 */
export async function createEmployeeAccount(
  email: string,
  employeeId: string | number,
  branchId: string | number,
  password: string,
  role: string
): Promise<{ userId: string; email: string }> {
  return authAdminService.createEmployeeAccount({
    email,
    password,
    employeeId,
    branchId,
    role: role as 'Super Admin' | 'Branch Manager' | 'Staff',
  })
}

/**
 * Wrapper: Reset password by email
 * Used by Employees component
 */
export async function resetPassword(email: string, newPassword: string): Promise<void> {
  // Note: This requires the userId which we need to look up from email
  // For now, we use email as placeholder - Edge Function should handle it
  return authAdminService.resetPassword({
    userId: email, // This will be handled by Edge Function
    newPassword,
  })
}

/**
 * Wrapper: Update account status by email
 * Used by Employees component
 */
export async function updateAccountStatus(email: string, isBanned: boolean): Promise<void> {
  // Note: This requires the userId which we need to look up from email
  // For now, we use email as placeholder - Edge Function should handle it
  return authAdminService.updateAccountStatus({
    userId: email, // This will be handled by Edge Function
    isBanned,
  })
}
