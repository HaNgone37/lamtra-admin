import React from 'react'

// ═════════════════════════════════════════════════════════════════
// RBAC BUTTON WRAPPER
// ═════════════════════════════════════════════════════════════════

interface RBACButtonProps {
  allowedRoles: Array<'super_admin' | 'manager' | 'staff'>
  onClick?: () => void
  className?: string
  children: React.ReactNode
  disabled?: boolean
  title?: string
}

/**
 * RBAC Button - Ẩn button dựa trên role
 * Nếu user không có quyền, button sẽ không render
 */
export const RBACButton: React.FC<RBACButtonProps> = ({
  allowedRoles,
  onClick,
  className,
  children,
  disabled,
  title
}) => {
  const userRole = localStorage.getItem('userRole')?.toLowerCase() || 'staff'

  // Normalize role
  const normalizedRole =
    userRole.includes('super') ? 'super_admin' :
    userRole.includes('manager') ? 'manager' :
    'staff'

  // Check if user has permission
  const hasPermission = allowedRoles.includes(normalizedRole as any)

  if (!hasPermission) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}

// ═════════════════════════════════════════════════════════════════
// RBAC WRAPPER - Cho sections/components
// ═════════════════════════════════════════════════════════════════

interface RBACWrapperProps {
  allowedRoles: Array<'super_admin' | 'manager' | 'staff'>
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * RBAC Wrapper - Ẩn toàn bộ component dựa trên role
 */
export const RBACWrapper: React.FC<RBACWrapperProps> = ({
  allowedRoles,
  children,
  fallback
}) => {
  const userRole = localStorage.getItem('userRole')?.toLowerCase() || 'staff'

  const normalizedRole =
    userRole.includes('super') ? 'super_admin' :
    userRole.includes('manager') ? 'manager' :
    'staff'

  const hasPermission = allowedRoles.includes(normalizedRole as any)

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// ═════════════════════════════════════════════════════════════════
// RBAC READ-ONLY INDICATOR
// ═════════════════════════════════════════════════════════════════

interface ReadOnlyIndicatorProps {
  showFor?: Array<'super_admin' | 'manager' | 'staff'>
  className?: string
}

/**
 * Read-only badge - Hiển thị cho các role không thể edit
 */
export const ReadOnlyIndicator: React.FC<ReadOnlyIndicatorProps> = ({
  showFor = ['staff'],
  className
}) => {
  const userRole = localStorage.getItem('userRole')?.toLowerCase() || 'staff'

  const normalizedRole =
    userRole.includes('super') ? 'super_admin' :
    userRole.includes('manager') ? 'manager' :
    'staff'

  const shouldShow = showFor.includes(normalizedRole as any)

  if (!shouldShow) {
    return null
  }

  return (
    <span className={`text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full ${className}`}>
      🔒 Chỉ đọc
    </span>
  )
}
