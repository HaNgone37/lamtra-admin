import React, { useState, useEffect, useRef } from 'react'

interface Voucher {
  voucherid: number
  code: string
  title: string
  discountvalue: number
  discounttype: string
  scope: string
  expirydate: string
}

interface VoucherSelectorProps {
  publicVouchers: Voucher[]
  personalVouchers: Voucher[]
  appliedVoucher: { code: string; discountAmount: number } | null
  onApplyVoucher: (voucherCode: string) => void
  onClearVoucher: () => void
  isValidating?: boolean
  errorMessage?: string
}

const PINK_PRIMARY = '#f06192'
const PINK_LIGHT = '#f5d5e0'
const PINK_VERY_LIGHT = '#fce0ed'
const TEXT_NAVY = '#1a1840'
const TEXT_LIGHT = '#8B7E9E'

export const VoucherSelector: React.FC<VoucherSelectorProps> = ({
  publicVouchers,
  personalVouchers,
  appliedVoucher,
  onApplyVoucher,
  onClearVoucher,
  isValidating = false,
  errorMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Combine vouchers
  const allVouchers = [
    ...publicVouchers.map(v => ({ ...v, type: 'public' })),
    ...personalVouchers.map(v => ({ ...v, type: 'personal' })),
  ]

  // Filter only if search text is entered, else show all
  const filteredVouchers = searchText.trim() 
    ? allVouchers.filter(v =>
        v.code.toUpperCase().includes(searchText.toUpperCase()) ||
        v.title.toUpperCase().includes(searchText.toUpperCase())
      )
    : allVouchers  // Show all when no search text

  // Format voucher display text
  const formatVoucherText = (voucher: any) => {
    const discount = `${voucher.discountvalue}${voucher.discounttype === '%' ? '%' : 'k'}`
    return `${voucher.code} - Giảm ${discount}`
  }

  // Handle selection from dropdown
  const handleSelectVoucher = (voucher: any) => {
    onApplyVoucher(voucher.code)
    setSearchText('')  // Clear search after selection
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value.toUpperCase())
    setSelectedIndex(-1)
    setIsOpen(true)  // Keep dropdown open while typing
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredVouchers.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredVouchers[selectedIndex]) {
          handleSelectVoucher(filteredVouchers[selectedIndex])
        } else if (searchText.trim()) {
          // Manual code input (user typed but didn't select from list)
          onApplyVoucher(searchText.trim())
          setSearchText('')
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus on input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Main Dropdown Container */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          placeholder={appliedVoucher ? appliedVoucher.code : "Chọn hoặc nhập mã ưu đãi"}
          value={searchText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          disabled={isValidating}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '12px 14px',
            border: `1.5px solid ${isOpen ? PINK_PRIMARY : PINK_LIGHT}`,
            borderRadius: '16px', // rounded-2xl
            fontSize: '14px',
            fontWeight: '500',
            boxSizing: 'border-box',
            color: TEXT_NAVY,
            backgroundColor: '#FFFFFF',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'Be Vietnam Pro, sans-serif',
            cursor: isValidating ? 'not-allowed' : 'text',
            opacity: isValidating ? 0.7 : 1,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = PINK_PRIMARY
            e.target.style.boxShadow = `0 0 0 2px ${PINK_VERY_LIGHT}`
          }}
          onBlur={(e) => {
            if (!isOpen) {
              e.target.style.borderColor = PINK_LIGHT
              e.target.style.boxShadow = 'none'
            }
          }}
        />

        {/* Dropdown List - Shows on click or typing */}
        {isOpen && allVouchers.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              maxHeight: '360px',
              overflowY: 'auto',
              border: `1px solid ${PINK_LIGHT}`,
              scrollBehavior: 'smooth',
            }}
          >
            {filteredVouchers.length > 0 ? (
              filteredVouchers.map((voucher, idx) => (
                <button
                  key={`${voucher.type}-${voucher.voucherid}`}
                  onClick={() => handleSelectVoucher(voucher)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: 'none',
                    backgroundColor: selectedIndex === idx ? PINK_VERY_LIGHT : '#FFFFFF',
                    color: TEXT_NAVY,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: selectedIndex === idx ? '600' : '500',
                    borderBottom: idx < filteredVouchers.length - 1 ? `0.5px solid #F5F5F5` : 'none',
                    transition: 'all 0.12s ease',
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = PINK_VERY_LIGHT
                    e.currentTarget.style.fontWeight = '600'
                    setSelectedIndex(idx)
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIndex !== idx) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF'
                      e.currentTarget.style.fontWeight = '500'
                    }
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {formatVoucherText(voucher)}
                  </span>
                  {voucher.type === 'personal' && (
                    <span style={{
                      fontSize: '10px',
                      color: TEXT_LIGHT,
                      marginLeft: '12px',
                      backgroundColor: PINK_VERY_LIGHT,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      fontWeight: '500',
                    }}>
                      Cá nhân
                    </span>
                  )}
                </button>
              ))
            ) : (
              // No results message when filtering
              <div
                style={{
                  padding: '16px 14px',
                  fontSize: '13px',
                  color: TEXT_LIGHT,
                  textAlign: 'center',
                  fontFamily: 'Be Vietnam Pro, sans-serif',
                }}
              >
                Không tìm thấy ưu đãi nào
              </div>
            )}
          </div>
        )}
      </div>

      {/* Applied Status - Elegant Result Display */}
      {appliedVoucher && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            fontWeight: '600',
            color: PINK_PRIMARY,
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}
        >
          ✓ Đã áp dụng mã <span style={{ fontWeight: '700' }}>{appliedVoucher.code}</span>: giảm{' '}
          <span style={{ fontWeight: '700' }}>
            {appliedVoucher.discountAmount.toLocaleString('vi-VN')}đ
          </span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#D32F2F',
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}
        >
          ✗ {errorMessage}
        </div>
      )}

      {/* Validation Loading State */}
      {isValidating && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '11px',
            color: TEXT_LIGHT,
            fontFamily: 'Be Vietnam Pro, sans-serif',
          }}
        >
          Đang kiểm tra...
        </div>
      )}
    </div>
  )
}

export default VoucherSelector
