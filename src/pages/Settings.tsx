import React, { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { Lock, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react'

const COLORS = {
  bg: '#F4F7FE',
  card: '#FFFFFF',
  text: '#2B3674',
  textLight: '#A3AED0',
  primary: '#4318FF',
  success: '#00A869',
  successBg: '#EDFCF3',
  error: '#EE5A6F',
  errorBg: '#FFE8EB',
  border: '#E0E5F2'
}

interface AccountInfo {
  email: string
  fullname?: string
  role?: string
  created_at?: string
}

interface Toast {
  message: string
  type: 'success' | 'error'
  visible: boolean
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'password'>('account')
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast>({ message: '', type: 'success', visible: false })

  // Account form
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Load current user
  useEffect(() => {
    loadAccountInfo()
  }, [])

  const loadAccountInfo = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Try to get employee info
        const { data: employee } = await supabase
          .from('employees')
          .select('fullname')
          .eq('email', user.email)
          .single()

        const accountInfo: AccountInfo = {
          email: user.email || '',
          fullname: employee?.fullname || user.user_metadata?.fullname || '',
          role: user.user_metadata?.role || 'user',
          created_at: user.created_at
        }

        setAccount(accountInfo)
        setFullname(accountInfo.fullname || '')
        setEmail(accountInfo.email)
      }
    } catch (error) {
      console.error('[ERROR] Failed to load account info:', error)
      showToast('Lỗi tải thông tin tài khoản', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
  }

  const handleUpdateAccount = async () => {
    if (!fullname.trim()) {
      showToast('Vui lòng nhập họ tên', 'error')
      return
    }

    try {
      setLoading(true)
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showToast('Không tìm thấy người dùng', 'error')
        return
      }

      // Update employee record if exists
      const { data: employee } = await supabase
        .from('employees')
        .select('employeeid')
        .eq('email', user.email)
        .single()

      if (employee) {
        await supabase
          .from('employees')
          .update({ fullname })
          .eq('employeeid', employee.employeeid)
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          fullname,
          role: account?.role
        }
      })

      showToast('Cập nhật thông tin thành công', 'success')
      loadAccountInfo()
    } catch (error) {
      console.error('[ERROR] Failed to update account:', error)
      showToast('Lỗi cập nhật thông tin', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Vui lòng điền tất cả các trường', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu mới không khớp', 'error')
      return
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error')
      return
    }

    try {
      setLoading(true)

      // Update password
      await supabase.auth.updateUser({ password: newPassword })

      showToast('Đổi mật khẩu thành công', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('[ERROR] Failed to change password:', error)
      showToast('Lỗi đổi mật khẩu', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !account) {
    return (
      <div style={{
        backgroundColor: COLORS.card,
        borderRadius: '20px',
        border: `1px solid ${COLORS.border}`,
        padding: '60px 20px',
        textAlign: 'center',
        color: COLORS.textLight
      }}>
        Đang tải...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: COLORS.text,
          margin: 0,
          marginBottom: '8px'
        }}>
          Cài Đặt Tài Khoản
        </h1>
        <p style={{
          fontSize: '14px',
          color: COLORS.textLight,
          margin: 0
        }}>
          Quản lý thông tin cá nhân và bảo mật tài khoản
        </p>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div style={{
          marginBottom: '20px',
          padding: '16px 20px',
          backgroundColor: toast.type === 'success' ? COLORS.successBg : COLORS.errorBg,
          border: `1px solid ${toast.type === 'success' ? COLORS.success : COLORS.error}`,
          borderRadius: '12px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          color: toast.type === 'success' ? COLORS.success : COLORS.error,
          fontSize: '14px'
        }}>
          {toast.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('account')}
          style={{
            padding: '16px 24px',
            border: 'none',
            backgroundColor: activeTab === 'account' ? COLORS.primary : 'transparent',
            color: activeTab === 'account' ? COLORS.card : COLORS.textLight,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'account' ? `3px solid ${COLORS.primary}` : 'none',
            transition: 'all 0.3s ease',
            marginBottom: '-2px'
          }}
        >
          <UserIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Thông Tin Cá Nhân
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            padding: '16px 24px',
            border: 'none',
            backgroundColor: activeTab === 'password' ? COLORS.primary : 'transparent',
            color: activeTab === 'password' ? COLORS.card : COLORS.textLight,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'password' ? `3px solid ${COLORS.primary}` : 'none',
            transition: 'all 0.3s ease',
            marginBottom: '-2px'
          }}
        >
          <Lock size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Đổi Mật Khẩu
        </button>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          padding: '32px',
          maxWidth: '600px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                color: COLORS.textLight,
                backgroundColor: COLORS.bg,
                cursor: 'not-allowed',
                boxSizing: 'border-box'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: COLORS.textLight,
              margin: '8px 0 0 0'
            }}>
              Email không thể thay đổi
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: '8px'
            }}>
              Họ Tên
            </label>
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Nhập họ tên"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                color: COLORS.text,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {account?.role && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: COLORS.text,
                marginBottom: '8px'
              }}>
                Vai Trò
              </label>
              <input
                type="text"
                value={account.role}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: COLORS.textLight,
                  backgroundColor: COLORS.bg,
                  cursor: 'not-allowed',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <button
            onClick={handleUpdateAccount}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: loading ? COLORS.textLight : COLORS.primary,
              color: COLORS.card,
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Đang cập nhật...' : 'Cập Nhật Thông Tin'}
          </button>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          padding: '32px',
          maxWidth: '600px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: '8px'
            }}>
              Mật Khẩu Hiện Tại
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                color: COLORS.text,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: '8px'
            }}>
              Mật Khẩu Mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                color: COLORS.text,
                boxSizing: 'border-box'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: COLORS.textLight,
              margin: '8px 0 0 0'
            }}>
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: '8px'
            }}>
              Xác Nhận Mật Khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                color: COLORS.text,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: loading ? COLORS.textLight : COLORS.primary,
              color: COLORS.card,
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Đang đổi...' : 'Đổi Mật Khẩu'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Settings
