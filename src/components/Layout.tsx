import React, { useEffect, useState } from 'react'
import { Menu, X, Bell, User as UserIcon } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  sidebarOpen: boolean
  onMenuClick: () => void
  onLogout: () => void
  userName?: string
  userRole?: string
  branchName?: string
  branchId?: string
}

/**
 * Layout Component - Horizon UI Light Theme
 * - Nền trang: #F4F7FE
 * - Cards: #FFFFFF
 * - Text: #2B3674
 * - Primary: #4318FF
 * - Border Radius: 20px
 * - Shadow: rgba(112, 144, 176, 0.08) 0px 18px 40px
 */
export const Layout: React.FC<LayoutProps> = ({
  children,
  sidebarOpen,
  onMenuClick,
  onLogout,
  userName = 'User',
  userRole = 'staff',
  branchName = 'Chi nhánh chính',
  branchId = ''
}) => {
  const [notificationCount, setNotificationCount] = useState(0)

  const getRoleLabel = () => {
    if (!userRole) return 'Người dùng'
    const lower = userRole.toLowerCase().trim()
    
    if (lower === 'admin' || lower === 'super admin' || lower === 'super_admin') {
      return 'Super Admin'
    }
    if (lower === 'manager') {
      return 'Quản Lý Chi Nhánh'
    }
    if (lower === 'staff') {
      return 'Nhân Viên'
    }
    return userRole
  }

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ backgroundColor: '#F4F7FE' }}
    >
      {/* Header - Horizon UI Style */}
      <header
        className="sticky top-0 z-30 w-full border-b"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E0E5F2'
        }}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left Section - Menu + Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{ color: '#4318FF' }}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Breadcrumb / Title */}
            <div className="hidden sm:block">
              <h1
                className="text-2xl font-bold"
                style={{ color: '#2B3674' }}
              >
                LAM TRÀ Admin
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {userRole && userRole.toLowerCase().trim() === 'admin' || userRole.toLowerCase().trim() === 'super admin' ? 'Quản trị toàn hệ thống' : `${branchName}`}
              </p>
            </div>
          </div>

          {/* Right Section - Notifications + User */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              className="relative p-2.5 rounded-lg transition-all duration-200 hover:bg-gray-50"
              style={{ color: '#4318FF' }}
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ backgroundColor: '#4318FF' }}
                >
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div
              className="hidden sm:block h-6 w-px"
              style={{ backgroundColor: '#E0E5F2' }}
            ></div>

            {/* User Profile - Static */}
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 px-3 py-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: '#4318FF' }}
                >
                  <UserIcon size={16} />
                </div>
                <div className="text-left hidden md:block">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#2B3674' }}
                  >
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                </div>
              </div>
            </div>

            {/* Mobile User Avatar - Static */}
            <div
              className="lg:hidden p-2 cursor-default"
              style={{ color: '#4318FF' }}
            >
              <UserIcon size={20} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto ">
        {/* Max width container */}
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>

      {/* Footer */}
      <footer
        className="border-t text-center py-4 text-sm text-gray-600"
        style={{ borderColor: '#E0E5F2' }}
      >
        <p>© 2024 LAM TRÀ System. All rights reserved.</p>
      </footer>
    </div>
  )
}
