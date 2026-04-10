import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import {
  formatDateForDisplay,
  parseDateFromDisplay,
  getTodayRange,
  getLast7DaysRange,
  getLast30DaysRange,
  isValidDateRange,
  DateRange
} from '@/utils/dateRangeUtils'

interface DateRangeFilterProps {
  /**
   * Callback when date range changes
   * Returns object with startDate and endDate in YYYY-MM-DD format
   */
  onDateRangeChange?: (dateRange: DateRange) => void

  /**
   * Optional custom label for the component
   */
  label?: string

  /**
   * Show/hide quick filter buttons
   */
  showQuickFilters?: boolean
}

/**
 * DateRangeFilter Component
 * 
 * A professional date range picker with quick filters.
 * Returns dates in YYYY-MM-DD format for API usage.
 * 
 * @param onDateRangeChange - Callback function when dates change
 * @param label - Custom label (default: "Chọn khoảng thời gian")
 * @param showQuickFilters - Show/hide quick filter buttons
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateRangeChange,
  label,
  showQuickFilters = true,
}) => {
  // State: Store dates in YYYY-MM-DD format internally
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    return getLast30DaysRange() // Default: Last 30 days
  })

  // State: For display input fields (dd/mm/yyyy format)
  const [displayFromDate, setDisplayFromDate] = useState<string>(() => {
    return formatDateForDisplay(getLast30DaysRange().startDate)
  })
  const [displayToDate, setDisplayToDate] = useState<string>(() => {
    return formatDateForDisplay(getLast30DaysRange().endDate)
  })

  const [errorMessage, setErrorMessage] = useState<string>('')
  
  // State: Track which quick filter is active
  const [activeFilter, setActiveFilter] = useState<'today' | 'last7' | 'last30'>('last30')

  // ========== HANDLERS ==========

  /**
   * Handle "From date" input change
   */
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayValue = e.target.value
    setDisplayFromDate(displayValue)
    setErrorMessage('')
    setActiveFilter('last30') // Reset filter when manually changed (but can be overridden if exact match)

    // Convert to YYYY-MM-DD for storage
    const parsedDate = parseDateFromDisplay(displayValue)
    if (parsedDate && isValidDateRange(parsedDate, dateRange.endDate)) {
      const newRange = { ...dateRange, startDate: parsedDate }
      setDateRange(newRange)
      onDateRangeChange?.(newRange)
    }
  }

  /**
   * Handle "To date" input change
   */
  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayValue = e.target.value
    setDisplayToDate(displayValue)
    setErrorMessage('')
    setActiveFilter('last30') // Reset filter when manually changed (but can be overridden if exact match)

    // Convert to YYYY-MM-DD for storage
    const parsedDate = parseDateFromDisplay(displayValue)
    if (parsedDate && isValidDateRange(dateRange.startDate, parsedDate)) {
      const newRange = { ...dateRange, endDate: parsedDate }
      setDateRange(newRange)
      onDateRangeChange?.(newRange)
    }
  }

  /**
   * Quick filter: Today
   */
  const handleFilterToday = () => {
    const range = getTodayRange()
    setDateRange(range)
    setDisplayFromDate(formatDateForDisplay(range.startDate))
    setDisplayToDate(formatDateForDisplay(range.endDate))
    setErrorMessage('')
    setActiveFilter('today')
    onDateRangeChange?.(range)
  }

  /**
   * Quick filter: Last 7 days
   */
  const handleFilterLast7Days = () => {
    const range = getLast7DaysRange()
    setDateRange(range)
    setDisplayFromDate(formatDateForDisplay(range.startDate))
    setDisplayToDate(formatDateForDisplay(range.endDate))
    setErrorMessage('')
    setActiveFilter('last7')
    onDateRangeChange?.(range)
  }

  /**
   * Quick filter: Last 30 days
   */
  const handleFilterLast30Days = () => {
    const range = getLast30DaysRange()
    setDateRange(range)
    setDisplayFromDate(formatDateForDisplay(range.startDate))
    setDisplayToDate(formatDateForDisplay(range.endDate))
    setErrorMessage('')
    setActiveFilter('last30')
    onDateRangeChange?.(range)
  }



  // ========== RENDER ==========

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm" style={{
      backgroundColor: '#F4F7FE',
      border: '1px solid #E0E5F2'
    }}>
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#EBF3FF', color: '#4318FF' }}
        >
          <Calendar size={20} />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: '#2B3674' }}>
          {label || 'Chọn khoảng thời gian'}
        </h3>
      </div>

      {/* Date Inputs Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* From Date Input */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2B3674' }}>
            Từ ngày
          </label>
          <input
            type="text"
            placeholder="dd/mm/yyyy"
            value={displayFromDate}
            onChange={handleFromDateChange}
            className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              borderColor: '#E0E5F2',
              backgroundColor: '#FFFFFF',
              color: '#2B3674'
            }}
          />
        </div>

        {/* To Date Input */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2B3674' }}>
            Đến ngày
          </label>
          <input
            type="text"
            placeholder="dd/mm/yyyy"
            value={displayToDate}
            onChange={handleToDateChange}
            className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              borderColor: '#E0E5F2',
              backgroundColor: '#FFFFFF',
              color: '#2B3674'
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{ backgroundColor: '#FFE5E5', color: '#E53E3E' }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Quick Filter Buttons */}
      {showQuickFilters && (
        <div className="mb-6">
          <p className="text-sm font-medium mb-3" style={{ color: '#2B3674' }}>
            Lọc nhanh:
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleFilterToday}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activeFilter === 'today' ? '#4318FF' : '#EBF3FF',
                color: activeFilter === 'today' ? '#FFFFFF' : '#4318FF',
                border: activeFilter === 'today' ? '1px solid #4318FF' : '1px solid #D1E0FF'
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== 'today') {
                  e.currentTarget.style.backgroundColor = '#D1E0FF'
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== 'today') {
                  e.currentTarget.style.backgroundColor = '#EBF3FF'
                }
              }}
            >
              Hôm nay
            </button>

            <button
              onClick={handleFilterLast7Days}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activeFilter === 'last7' ? '#4318FF' : '#EBF3FF',
                color: activeFilter === 'last7' ? '#FFFFFF' : '#4318FF',
                border: activeFilter === 'last7' ? '1px solid #4318FF' : '1px solid #D1E0FF'
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== 'last7') {
                  e.currentTarget.style.backgroundColor = '#D1E0FF'
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== 'last7') {
                  e.currentTarget.style.backgroundColor = '#EBF3FF'
                }
              }}
            >
              7 ngày qua
            </button>

            <button
              onClick={handleFilterLast30Days}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activeFilter === 'last30' ? '#4318FF' : '#EBF3FF',
                color: activeFilter === 'last30' ? '#FFFFFF' : '#4318FF',
                border: activeFilter === 'last30' ? '1px solid #4318FF' : '1px solid #D1E0FF'
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== 'last30') {
                  e.currentTarget.style.backgroundColor = '#D1E0FF'
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== 'last30') {
                  e.currentTarget.style.backgroundColor = '#EBF3FF'
                }
              }}
            >
              30 ngày qua
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default DateRangeFilter
