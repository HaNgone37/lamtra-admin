import React, { useMemo } from 'react'
import {
  Home,
  ShoppingCart,
  Package,
  MapPin,
  BarChart3,
  Users,
  Warehouse,
  Ticket,
  FileText,
  LogOut
} from 'lucide-react'

// Icon styling constants
const ICON_STYLE = {
  size: 20,
  strokeWidth: 2
} as const

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPage: string
  onPageChange: (page: string) => void
  userRole?: string
  branchName?: string
  onLogout: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  roles: string[]
  divider?: boolean
}

/**
 * Sidebar Component - Phân quyền theo RBAC
 * Super Admin (admin/super admin): Tất cả menu - Tổng quan, Đơn hàng, Thực đơn, Chi nhánh, Phân tích, Nhân viên, Cài đặt
 * Manager: Dashboard, Orders, Employees, Inventory  
 * Staff: Orders only
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onPageChange,
  userRole = 'staff',
  branchName = 'Chi nhánh',
  onLogout
}) => {
  // Normalize role - handle 'super admin' from database
  const normalizedRole = useMemo(() => {
    if (!userRole) return 'staff'
    const lower = userRole.toLowerCase().trim()
    if (lower === 'super admin' || lower === 'super_admin' || lower === 'admin') {
      return 'super_admin'
    }
    if (lower === 'manager') {
      return 'manager'
    }
    return 'staff'
  }, [userRole])

  // Menu items với RBAC logic
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      icon: <Home size={20} />,
      roles: ['super_admin', 'manager', 'staff']
    },
    {
      id: 'orders',
      label: 'Đơn Hàng',
      icon: <ShoppingCart size={20} />,
      roles: ['super_admin', 'manager', 'staff']
    },
    {
      id: 'products',
      label: 'Thực Đơn',
      icon: <Package size={20} />,
      roles: ['super_admin', 'manager']
    },
    {
      id: 'branches',
      label: 'Chi Nhánh',
      icon: <MapPin size={20} />,
      roles: ['super_admin']
    },
    {
      id: 'analytics',
      label: 'Phân Tích',
      icon: <BarChart3 size={20} />,
      roles: ['super_admin']
    },
    {
      id: 'news',
      label: 'Bài Viết',
      icon: <FileText size={20} />,
      roles: ['super_admin']
    },
    {
      id: 'employees',
      label: 'Nhân Sự',
      icon: <Users size={20} />,
      roles: ['super_admin', 'manager']
    },
    {
      id: 'inventory',
      label: 'Kho',
      icon: <Warehouse size={20} />,
      roles: ['super_admin', 'manager']
    },
    {
      id: 'vouchers',
      label: 'Voucher & CRM',
      icon: <Ticket size={20} />,
      roles: ['super_admin']
    }
  ], [])

  // Lọc menu theo role
  const visibleMenu = useMemo(() => {
    return menuItems.filter(item => item.roles.includes(normalizedRole))
  }, [normalizedRole, menuItems])

  const handleNavigate = (pageId: string) => {
    onPageChange(pageId)
    onClose()
  }

  const getRoleLabel = () => {
    switch (normalizedRole) {
      case 'super_admin':
        return 'Super Admin'
      case 'manager':
        return 'Quản Lý Chi Nhánh'
      case 'staff':
        return 'Nhân Viên'
      default:
        return userRole || 'Người dùng'
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white transition-all duration-300 transform flex flex-col h-screen border-r border-gray-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section - Horizon UI Style */}
        <div className="px-6 py-8 border-b border-gray-100 flex flex-col items-center space-y-4">
          <img
            src="https://tpwgbutlqmubdnnnfhdp.supabase.co/storage/v1/object/public/lamtra-media/products/LAMTRA_WP_FOOTER_LOGO-1.png"
            alt="LAM TRÀ"
            className="w-32 h-32 object-contain"
          />

          {/* User Info Card - Only for Manager & Staff */}
          {(userRole === 'manager' || userRole === 'staff') && (
            <div
              className="w-full p-3 rounded-lg border"
              style={{ backgroundColor: '#F4F7FE', borderColor: '#D1E0FF' }}
            >
              <p className="text-xs text-gray-600 font-medium mb-1">Chi nhánh</p>
              <p
                className="text-sm font-bold"
                style={{ color: '#4318FF' }}
              >
                {branchName}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
          {visibleMenu.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Không có menu</p>
            </div>
          ) : (
            visibleMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  currentPage === item.id
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`}
                style={
                  currentPage === item.id
                    ? { background: `linear-gradient(135deg, #4318FF 0%, #5B31FF 100%)` }
                    : {}
                }
              >
                <span className={currentPage === item.id ? 'text-white' : 'text-gray-600'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))
          )}
        </nav>

        {/* Footer - Logout */}
        <div className="px-4 py-6 border-t border-gray-100 space-y-3 bg-gray-50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  )
}
