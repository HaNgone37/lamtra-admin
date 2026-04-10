import dayjs from 'dayjs'

/**
 * Interface for date range
 */
export interface DateRange {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
}

/**
 * Format date from YYYY-MM-DD to dd/mm/yyyy for display
 */
export const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return ''
  return dayjs(dateStr).format('DD/MM/YYYY')
}

/**
 * Parse date from dd/mm/yyyy to YYYY-MM-DD for storage/API
 */
export const parseDateFromDisplay = (dateStr: string): string => {
  if (!dateStr) return ''
  // Try to parse dd/mm/yyyy format
  const parsed = dayjs(dateStr, 'DD/MM/YYYY')
  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD')
  }
  // Fallback: try ISO format
  const fallback = dayjs(dateStr)
  return fallback.isValid() ? fallback.format('YYYY-MM-DD') : ''
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * Calculate date range for "Today"
 */
export const getTodayRange = (): DateRange => {
  const today = getTodayDate()
  return {
    startDate: today,
    endDate: today
  }
}

/**
 * Calculate date range for "Last 7 days" (Today - 6 days to Today)
 */
export const getLast7DaysRange = (): DateRange => {
  const endDate = getTodayDate()
  const startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
  return {
    startDate,
    endDate
  }
}

/**
 * Calculate date range for "Last 30 days" (Today - 29 days to Today)
 */
export const getLast30DaysRange = (): DateRange => {
  const endDate = getTodayDate()
  const startDate = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
  return {
    startDate,
    endDate
  }
}

/**
 * Validate if a date string is valid (accepts both YYYY-MM-DD and dd/mm/yyyy)
 */
export const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false
  
  // Try YYYY-MM-DD format
  const iso = dayjs(dateStr, 'YYYY-MM-DD', true)
  if (iso.isValid()) return true
  
  // Try dd/mm/yyyy format
  const display = dayjs(dateStr, 'DD/MM/YYYY', true)
  return display.isValid()
}

/**
 * Check if startDate is before or equal to endDate
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  return start.isValid() && end.isValid() && (start.isBefore(end) || start.isSame(end))
}
