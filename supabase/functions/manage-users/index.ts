import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// ============================================================
// CORS HEADERS - Cho phép gọi từ client
// ============================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================
interface CreateUserRequest {
  action: 'CREATE_USER'
  email: string
  password: string
  employeeId: string | number
  branchId: string | number
  role?: 'Super Admin' | 'Branch Manager' | 'Staff'
}

interface ResetPasswordRequest {
  action: 'RESET_PASSWORD'
  userId: string
  newPassword: string
}

interface ToggleStatusRequest {
  action: 'TOGGLE_STATUS'
  userId: string
  isBanned: boolean
}

type ManageUserRequest = CreateUserRequest | ResetPasswordRequest | ToggleStatusRequest

serve(async (req: Request) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Validate request method
  if (req.method !== 'POST') {
    console.log(`[ERROR] Invalid method: ${req.method}`)
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: corsHeaders,
      }
    )
  }

  try {
    // Parse request body
    let requestData: ManageUserRequest
    try {
      requestData = await req.json()
      console.log('[REQUEST] Action:', requestData.action)
    } catch (e) {
      console.error('[ERROR] Invalid JSON:', e)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: corsHeaders,
        }
      )
    }

    // Extract authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[ERROR] Missing or invalid Authorization header')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Missing or invalid Authorization header',
        }),
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    const token = authHeader.substring(7)
    console.log('[AUTH] Token extracted, length:', token.length)

    // Initialize Supabase client with SERVICE_ROLE_KEY
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[ERROR] Missing Supabase configuration')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error: Missing Supabase configuration',
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify user token
    console.log('[AUTH] Verifying user token...')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('[ERROR] Token verification failed:', authError?.message)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Invalid or expired token',
        }),
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    console.log('[AUTH] User verified:', user.id)

    // Check user role in accounts table
    console.log('[RBAC] Checking user role...')
    const { data: userAccount, error: accountError } = await supabase
      .from('accounts')
      .select('role')
      .eq('accountid', user.id)
      .single()

    if (accountError || !userAccount) {
      console.error('[ERROR] Failed to fetch user account:', accountError?.message)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden: User account not found',
        }),
        {
          status: 403,
          headers: corsHeaders,
        }
      )
    }

    // Verify role permissions
    const allowedRoles = ['Super Admin']
    if (!allowedRoles.includes(userAccount.role)) {
      console.error('[ERROR] User does not have permission. Role:', userAccount.role)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden: Insufficient permissions',
        }),
        {
          status: 403,
          headers: corsHeaders,
        }
      )
    }

    console.log('[RBAC] Authorization passed')

    // Handle CREATE_USER action
    if (requestData.action === 'CREATE_USER') {
      console.log('[ACTION] Processing CREATE_USER')
      const createReq = requestData as CreateUserRequest

      if (!createReq.email || !createReq.password || !createReq.employeeId) {
        console.error('[ERROR] Missing required fields for CREATE_USER')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Bad request: Missing required fields',
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        )
      }

      if (createReq.password.length < 6) {
        console.error('[ERROR] Password too short')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Bad request: Password must be at least 6 characters',
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        )
      }

      try {
        // Create auth user
        console.log('[CREATE_USER] Creating auth user:', createReq.email)
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: createReq.email,
          password: createReq.password,
          email_confirm: true,
        })

        if (createError || !authUser?.user) {
          console.error('[ERROR] Auth user creation failed:', createError?.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to create auth user',
            }),
            {
              status: 500,
              headers: corsHeaders,
            }
          )
        }

        const userId = authUser.user.id
        console.log('[CREATE_USER] Auth user created with ID:', userId)

        // Insert into accounts table
        const employeeIdNum = Number(createReq.employeeId)
        const branchIdNum = createReq.branchId ? Number(createReq.branchId) : null

        console.log('[CREATE_USER] Inserting account record')

        const { error: accountInsertError } = await supabase
          .from('accounts')
          .insert([
            {
              accountid: userId,
              role: createReq.role || 'Staff',
              branchid: branchIdNum,
              employeeid: employeeIdNum,
            },
          ])

        if (accountInsertError) {
          console.error('[ERROR] Account insertion failed:', accountInsertError.message)
          console.log('[ROLLBACK] Deleting auth user...')

          await supabase.auth.admin.deleteUser(userId)

          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to create account record',
            }),
            {
              status: 500,
              headers: corsHeaders,
            }
          )
        }

        console.log('[CREATE_USER] Account created successfully')
        return new Response(
          JSON.stringify({
            success: true,
            message: 'User created',
            userId: userId,
            email: createReq.email,
          }),
          {
            status: 200,
            headers: corsHeaders,
          }
        )
      } catch (error) {
        console.error('[ERROR] CREATE_USER exception:', error)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unexpected error during user creation',
          }),
          {
            status: 500,
            headers: corsHeaders,
          }
        )
      }
    }

    // Handle RESET_PASSWORD action
    if (requestData.action === 'RESET_PASSWORD') {
      console.log('[ACTION] Processing RESET_PASSWORD')
      const resetReq = requestData as ResetPasswordRequest

      if (!resetReq.userId || !resetReq.newPassword) {
        console.error('[ERROR] Missing required fields for RESET_PASSWORD')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Bad request: Missing required fields',
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        )
      }

      if (resetReq.newPassword.length < 6) {
        console.error('[ERROR] New password too short')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Bad request: Password must be at least 6 characters',
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        )
      }

      try {
        console.log('[RESET_PASSWORD] Updating password for user:', resetReq.userId)

        const { error: updateError } = await supabase.auth.admin.updateUserById(resetReq.userId, {
          password: resetReq.newPassword,
        })

        if (updateError) {
          console.error('[ERROR] Password reset failed:', updateError.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to reset password',
            }),
            {
              status: 500,
              headers: corsHeaders,
            }
          )
        }

        console.log('[RESET_PASSWORD] Password reset successfully')
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Password reset',
            userId: resetReq.userId,
          }),
          {
            status: 200,
            headers: corsHeaders,
          }
        )
      } catch (error) {
        console.error('[ERROR] RESET_PASSWORD exception:', error)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unexpected error during password reset',
          }),
          {
            status: 500,
            headers: corsHeaders,
          }
        )
      }
    }

    // Handle TOGGLE_STATUS action
    if (requestData.action === 'TOGGLE_STATUS') {
      console.log('[ACTION] Processing TOGGLE_STATUS')
      const toggleReq = requestData as ToggleStatusRequest

      if (!toggleReq.userId || toggleReq.isBanned === undefined) {
        console.error('[ERROR] Missing required fields for TOGGLE_STATUS')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Bad request: Missing required fields',
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        )
      }

      try {
        console.log('[TOGGLE_STATUS] Setting ban status:', toggleReq.isBanned)

        const { error: updateError } = await supabase.auth.admin.updateUserById(toggleReq.userId, {
          ban_duration: toggleReq.isBanned ? '24h' : '0s',
        })

        if (updateError) {
          console.error('[ERROR] Account status update failed:', updateError.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to update account status',
            }),
            {
              status: 500,
              headers: corsHeaders,
            }
          )
        }

        console.log('[TOGGLE_STATUS] Account status updated successfully')
        return new Response(
          JSON.stringify({
            success: true,
            message: toggleReq.isBanned ? 'User locked' : 'User unlocked',
            userId: toggleReq.userId,
            isBanned: toggleReq.isBanned,
          }),
          {
            status: 200,
            headers: corsHeaders,
          }
        )
      } catch (error) {
        console.error('[ERROR] TOGGLE_STATUS exception:', error)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unexpected error during account status update',
          }),
          {
            status: 500,
            headers: corsHeaders,
          }
        )
      }
    }

    // Unknown action
    console.error('[ERROR] Unknown action:', (requestData as any).action)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Bad request: Unknown action',
      }),
      {
        status: 400,
        headers: corsHeaders,
      }
    )
  } catch (error) {
    console.error('[FATAL ERROR]', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
})
