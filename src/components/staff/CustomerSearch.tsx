import React, { useState, useCallback } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { Search, X, AlertCircle } from 'lucide-react'
import { Toast } from '@/components/Toast'

// ═════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════

export interface Customer {
  customerid: number
  fullname: string
  phone: string
  email: string
  totalpoints: number
  accumulated_points: number
  membership: string
}

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer | null) => void
  selectedCustomer?: Customer | null
}

// ═════════════════════════════════════════════════════════════════
// CUSTOMER SEARCH COMPONENT
// ═════════════════════════════════════════════════════════════════

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  onCustomerSelect,
  selectedCustomer
}) => {
  const [searchPhone, setSearchPhone] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showResults, setShowResults] = useState(false)

  // ─────────────────────────────────────────────────────────────
  // SEARCH LOGIC
  // ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async (phone: string) => {
    if (!phone.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('customerid, fullname, phone, email, totalpoints, accumulated_points, membership')
        .eq('phone', phone.trim())

      if (error) throw error

      if (data && data.length > 0) {
        setSearchResults(data as Customer[])
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(true)
        setToast({ type: 'error', message: 'SĐT chưa có tài khoản' })
      }
    } catch (error) {
      console.error('❌ Error searching customer:', error)
      setToast({ type: 'error', message: 'Lỗi tìm kiếm khách' })
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSelectCustomer = (customer: Customer) => {
    setSearchPhone('')
    setSearchResults([])
    setShowResults(false)
    onCustomerSelect(customer)
  }

  const handleClear = () => {
    setSearchPhone('')
    setSearchResults([])
    setShowResults(false)
    onCustomerSelect(null)
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: SELECTED STATE
  // ─────────────────────────────────────────────────────────────

  if (selectedCustomer) {
    return (
      <div className="bg-white rounded-[20px] p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-medium">👤 Khách hàng</p>
            <p className="text-sm font-semibold text-navy mt-1">{selectedCustomer.fullname}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-gray-600">
                📱 {selectedCustomer.phone}
              </span>
              <span className="bg-blue-100 text-primary px-2 py-1 rounded-full font-medium">
                {selectedCustomer.membership} | {selectedCustomer.totalpoints} điểm
              </span>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: SEARCH INPUT
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-[20px] p-4 border border-gray-200">
      <label className="block text-xs text-gray-600 font-medium mb-2">
        🔍 Tìm kiếm khách (SĐT)
      </label>

      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-gray-100 rounded-[15px] px-4 py-3">
          <Search size={18} className="text-gray-600" />
          <input
            type="text"
            placeholder="Nhập số điện thoại..."
            value={searchPhone}
            onChange={(e) => {
              setSearchPhone(e.target.value)
              handleSearch(e.target.value)
            }}
            className="bg-transparent flex-1 outline-none text-sm text-navy placeholder-gray-500"
          />
          {isSearching && (
            <div className="w-4 h-4 border-2 border-primary border-t-gray-200 rounded-full animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-[15px] shadow-lg z-10">
            {searchResults.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {searchResults.map((customer) => (
                  <button
                    key={customer.customerid}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-navy text-sm">{customer.fullname}</p>
                        <p className="text-xs text-gray-600 mt-1">{customer.phone}</p>
                      </div>
                      <span className="bg-blue-100 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        {customer.totalpoints} điểm
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600 text-sm font-medium">SĐT chưa có tài khoản</p>
                <p className="text-xs text-gray-500 mt-1">Không thể tạo mới</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* No Customer (Khách Lẻ Button) */}
      <button
        onClick={() => {
          onCustomerSelect(null)
          setSearchPhone('')
          setShowResults(false)
        }}
        className="w-full mt-3 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-center text-sm font-medium text-gray-700 rounded-[15px] transition-colors"
      >
        👤 Khách lẻ (Không tích điểm)
      </button>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
