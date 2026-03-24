/**
 * Validation utilities for form data
 */

export interface ValidationError {
  field: string
  message: string
}

export interface EmployeeValidationErrors {
  fullname?: string
  email?: string
  phone?: string
}

/**
 * Validate fullname
 * - Required
 * - 2-100 characters
 * - No leading/trailing whitespace
 * - No multiple consecutive spaces
 */
export const validateFullname = (fullname: string): string | null => {
  const trimmed = fullname.trim()

  if (!trimmed) {
    return 'Tên nhân viên không được để trống'
  }

  if (trimmed.length < 2) {
    return 'Tên nhân viên phải có ít nhất 2 ký tự'
  }

  if (trimmed.length > 100) {
    return 'Tên nhân viên không được vượt quá 100 ký tự'
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    return 'Tên nhân viên không được có khoảng trắng liên tiếp'
  }

  return null
}

/**
 * Validate email
 * - Required
 * - Valid email format
 * - Lowercase normalize
 * - Max 254 characters (RFC 5321)
 */
export const validateEmail = (email: string): string | null => {
  const trimmed = email.trim()

  if (!trimmed) {
    return 'Email không được để trống'
  }

  if (trimmed.length > 254) {
    return 'Email không được vượt quá 254 ký tự'
  }

  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmed)) {
    return 'Email không hợp lệ'
  }

  // More specific email validation
  if (trimmed.includes('..')) {
    return 'Email không hợp lệ (không được có hai dấu chấm liên tiếp)'
  }

  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return 'Email không hợp lệ'
  }

  const [localPart] = trimmed.split('@')
  if (!localPart || localPart.length > 64) {
    return 'Phần trước @ không hợp lệ'
  }

  return null
}

/**
 * Validate phone number (Vietnamese format)
 * - Required
 * - 10+ digits only (input masking removes non-digits)
 * - Only checked on submit
 */
export const validatePhone = (phone: string): string | null => {
  const cleaned = phone.replace(/\D/g, '')

  if (!cleaned) {
    return 'Số điện thoại không được để trống'
  }

  if (cleaned.length < 10) {
    return 'Số điện thoại phải có ít nhất 10 chữ số'
  }

  return null
}

/**
 * Validate position
 * - Required
 * - Must be from predefined list
 */
export const validatePosition = (position: string, validPositions: string[]): string | null => {
  if (!position) {
    return 'Vị trí không được để trống'
  }

  if (!validPositions.includes(position)) {
    return `Vị trí không hợp lệ. Phải là một trong: ${validPositions.join(', ')}`
  }

  return null
}

/**
 * Validate status
 * - Required
 * - Must be from predefined list
 */
export const validateStatus = (status: string, validStatuses: string[]): string | null => {
  if (!status) {
    return 'Trạng thái không được để trống'
  }

  if (!validStatuses.includes(status)) {
    return `Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}`
  }

  return null
}

/**
 * Normalize employee form data (trim, lowercase, etc.)
 */
export const normalizeEmployeeData = (data: {
  fullname: string
  email: string
  phone: string
  position: string
  branchid: string
  status: string
}) => {
  return {
    fullname: data.fullname.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    position: data.position.trim(),
    branchid: data.branchid.trim(),
    status: data.status.trim()
  }
}

/**
 * Validate all employee fields
 * Only validates: fullname, email, phone
 * Position, Status, Branch are controlled by dropdowns and don't need validation
 */
export const validateEmployeeForm = (
  data: {
    fullname: string
    email: string
    phone: string
    position: string
    branchid: string
    status: string
  }
): EmployeeValidationErrors => {
  const errors: EmployeeValidationErrors = {}

  const fullnameError = validateFullname(data.fullname)
  if (fullnameError) errors.fullname = fullnameError

  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError

  const phoneError = validatePhone(data.phone)
  if (phoneError) errors.phone = phoneError

  return errors
}

/**
 * Check if form has any errors
 */
export const hasValidationErrors = (errors: EmployeeValidationErrors): boolean => {
  return Object.keys(errors).length > 0
}

/**
 * Get first error message for display
 */
export const getFirstErrorMessage = (errors: EmployeeValidationErrors): string | null => {
  const firstKey = Object.keys(errors)[0]
  return firstKey ? errors[firstKey as keyof EmployeeValidationErrors] || null : null
}
