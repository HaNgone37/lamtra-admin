import React, { useState } from 'react'
import { DateRangeFilter } from './DateRangeFilter'
import { DateRange } from '@/utils/dateRangeUtils'

/**
 * Example Component showing how to use DateRangeFilter
 * 
 * This demonstrates:
 * 1. How to handle date range changes
 * 2. How to use the returned dates for API calls
 * 3. How to display the filtered results
 */
export const DateRangeFilterExample: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  /**
   * Handle date range change from the filter component
   */
  const handleDateRangeChange = async (dateRange: DateRange) => {
    console.log('[DateRangeFilter] Date range changed:', dateRange)
    setSelectedRange(dateRange)

    // Simulate API call with date range
    setLoading(true)
    try {
      // Example: Call your Supabase query with date range
      // const { data, error } = await supabase
      //   .from('orders')
      //   .select('*')
      //   .gte('orderdate', `${dateRange.startDate}T00:00:00`)
      //   .lte('orderdate', `${dateRange.endDate}T23:59:59`)
      //   .order('orderdate', { ascending: false })

      // Simulate data fetch
      await new Promise(resolve => setTimeout(resolve, 500))
      setResults([
        {
          id: 1,
          name: 'Đơn hàng #001',
          date: dateRange.startDate,
          amount: 150000
        },
        {
          id: 2,
          name: 'Đơn hàng #002',
          date: dateRange.endDate,
          amount: 250000
        }
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#4318FF' }}>
          Ví dụ sử dụng DateRangeFilter
        </h1>
        <p style={{ color: '#8F9CB8' }}>
          Thay đổi khoảng thời gian để xem dữ liệu cập nhật
        </p>
      </div>

      {/* Date Range Filter Component */}
      <DateRangeFilter
        label="Chọn khoảng thời gian xem doanh thu"
        onDateRangeChange={handleDateRangeChange}
        showQuickFilters={true}
      />

      {/* Display selected range */}
      {selectedRange && (
        <div
          className="p-6 rounded-lg"
          style={{ backgroundColor: '#EDFCF3', border: '1px solid #C8F7DC' }}
        >
          <h3 className="font-semibold mb-2" style={{ color: '#00A869' }}>
            ✅ Dữ liệu được lọc thành công
          </h3>
          <p style={{ color: '#047857', fontSize: '14px' }}>
            <strong>From:</strong> {selectedRange.startDate}
          </p>
          <p style={{ color: '#047857', fontSize: '14px' }}>
            <strong>To:</strong> {selectedRange.endDate}
          </p>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4"></div>
          <p style={{ color: '#8F9CB8' }}>Đang tải dữ liệu...</p>
        </div>
      )}

      {results.length > 0 && !loading && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid #E0E5F2' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F4F7FE' }}>
                <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#2B3674' }}>
                  STT
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#2B3674' }}>
                  Tên
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#2B3674' }}>
                  Ngày
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#2B3674' }}>
                  Số tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr
                  key={result.id}
                  style={{ borderBottom: '1px solid #E0E5F2' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F4F7FE')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-6 py-4 text-sm" style={{ color: '#2B3674' }}>
                    {idx + 1}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: '#2B3674' }}>
                    {result.name}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: '#8F9CB8' }}>
                    {result.date}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold" style={{ color: '#4318FF' }}>
                    ~{(result.amount / 1000).toFixed(0)}K
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Usage Guide */}
      <div
        className="p-6 rounded-lg"
        style={{ backgroundColor: '#EBF3FF', border: '1px solid #D1E0FF' }}
      >
        <h3 className="font-semibold mb-4" style={{ color: '#4318FF' }}>
          📚 Cách sử dụng:
        </h3>
        <ol className="space-y-2 text-sm" style={{ color: '#2B3674' }}>
          <li>
            <strong>1. Import component:</strong>
            <pre className="bg-white px-3 py-2 rounded mt-1 text-xs overflow-x-auto">
              {`import { DateRangeFilter } from '@/components/DateRangeFilter'`}
            </pre>
          </li>
          <li>
            <strong>2. Sử dụng trong component:</strong>
            <pre className="bg-white px-3 py-2 rounded mt-1 text-xs overflow-x-auto">
              {`const [dateRange, setDateRange] = useState<DateRange | null>(null)

<DateRangeFilter 
  onDateRangeChange={(range) => {
    setDateRange(range)
    // Gọi API với range.startDate và range.endDate
  }}
  label="Chọn khoảng thời gian"
/>
`}
            </pre>
          </li>
          <li>
            <strong>3. Gửi API:</strong>
            <pre className="bg-white px-3 py-2 rounded mt-1 text-xs overflow-x-auto">
              {`const { data } = await supabase
  .from('orders')
  .select('*')
  .gte('orderdate', dateRange.startDate + 'T00:00:00')
  .lte('orderdate', dateRange.endDate + 'T23:59:59')`}
            </pre>
          </li>
        </ol>
      </div>
    </div>
  )
}

export default DateRangeFilterExample
