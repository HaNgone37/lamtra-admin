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

// ============ HORIZON UI COLORS ============
const SIDEBAR_COLORS = {
  inactive: '#A3AED1',
  active: '#4318FF',
  activeBg: '#F4F7FE',
  hoverBg: '#F4F7FE',
  text: '#2B3674',
  textLight: '#8F9CB8',
  background: '#FFFFFF',
  border: '#E0E5F2',
}

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
}

/**
 * Sidebar Component - Phân quyền theo RBAC
 * Super Admin: Tất cả menu
 * Branch Manager: Tổng quan, Đơn hàng, Thực đơn, Nhân sự, Kho
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onPageChange,
  userRole = 'Staff',
  branchName = 'Chi nhánh',
  onLogout
}) => {
  // Đọc role từ localStorage (được set trong AuthContext.login)
  const role = localStorage.getItem('userRole') || userRole
  
  // Check if user is Super Admin
  const isSuperAdmin = role.toLowerCase().includes('super')
  const isManager = role.toLowerCase() === 'branch manager'

  // Menu items toàn bộ
  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      icon: <Home size={20} strokeWidth={2} />,
    },
    {
      id: 'orders',
      label: 'Đơn Hàng',
      icon: <ShoppingCart size={20} strokeWidth={2} />,
    },
    {
      id: 'products',
      label: 'Thực Đơn',
      icon: <Package size={20} strokeWidth={2} />,
    },
    {
      id: 'employees',
      label: 'Nhân Sự',
      icon: <Users size={20} strokeWidth={2} />,
    },
    {
      id: 'inventory',
      label: 'Kho',
      icon: <Warehouse size={20} strokeWidth={2} />,
    },
    {
      id: 'customers',
      label: 'Khách Hàng',
      icon: <Users size={20} strokeWidth={2} />,
    },
    // Chỉ show cho Super Admin
    {
      id: 'branches',
      label: 'Chi Nhánh',
      icon: <MapPin size={20} strokeWidth={2} />,
    },
    {
      id: 'analytics',
      label: 'Phân Tích',
      icon: <BarChart3 size={20} strokeWidth={2} />,
    },
    {
      id: 'news',
      label: 'Bài Viết',
      icon: <FileText size={20} strokeWidth={2} />,
    },
    {
      id: 'vouchers',
      label: 'Voucher & CRM',
      icon: <Ticket size={20} strokeWidth={2} />,
    },
  ]

  // Lọc menu theo role
  const visibleMenu = useMemo(() => {
    if (isSuperAdmin) {
      // Super Admin: toàn bộ menu
      return allMenuItems
    } else {
      // Branch Manager: ẩn Chi nhánh, Phân tích, Bài Viết, Voucher
      return allMenuItems.filter(item =>
        ['dashboard', 'orders', 'products', 'employees', 'inventory', 'customers'].includes(item.id)
      )
    }
  }, [isSuperAdmin, isManager])

  const handleNavigate = (pageId: string) => {
    onPageChange(pageId)
    onClose()
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
        {/* Logo Section */}
        <div className="px-6 py-8 border-b border-gray-100 flex flex-col items-center space-y-4">
          <img
            src="https://tpwgbutlqmubdnnnfhdp.supabase.co/storage/v1/object/public/lamtra-media/products/LAMTRA_WP_FOOTER_LOGO-1.png"
            alt="LAM TRÀ"
            className="w-32 h-32 object-contain"
          />

          {/* User Branch Info - Show for non-Super Admin */}
          {!isSuperAdmin && (
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
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                  currentPage === item.id
                    ? 'text-white shadow-lg shadow-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`}
                style={
                  currentPage === item.id
                    ? { 
                        background: `linear-gradient(135deg, ${SIDEBAR_COLORS.active} 0%, #5B31FF 100%)`,
                        color: '#FFFFFF'
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: SIDEBAR_COLORS.text
                      }
                }
              >
                <span 
                  style={{
                    color: currentPage === item.id ? '#FFFFFF' : SIDEBAR_COLORS.inactive,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))
          )}
        </nav>

        {/* Footer - Logout Button */}
        <div className="px-4 py-6 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200"
            style={{
              backgroundColor: '#FF4444',
              color: '#FFFFFF'
            }}
          >
            <LogOut size={20} strokeWidth={2} style={{ color: '#FFFFFF' }} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  )
}
