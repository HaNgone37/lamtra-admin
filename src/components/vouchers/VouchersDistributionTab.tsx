import React from 'react'
import { Search } from 'lucide-react'
import type { VoucherStatistic, Customer } from '@/services/voucherService'
import { voucherService } from '@/services/voucherService'

const COLORS = {
  bg: '#F4F7FE',
  card: '#FFFFFF',
  text: '#2B3674',
  textLight: '#A3AED0',
  primary: '#4318FF',
  success: '#00A869',
  successBg: '#EDFCF3',
  border: '#E0E5F2',
}

const REASONS = [
  { label: 'Sinh nhật', value: 'Sinh nhật' },
  { label: 'Đền bù', value: 'Đền bù' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Thử nghiệm', value: 'Thử nghiệm' },
]

interface VouchersDistributionTabProps {
  customers: Customer[]
  selectedCustomers: Set<number>
  selectedVoucher: number | null
  selectedReason: string
  searchTerm: string
  membershipFilter: string[]
  isLoading: boolean
  isIssuing: boolean
  stats: VoucherStatistic[]
  onCustomerToggle: (customerId: number) => void
  onToggleAll: () => void
  onVoucherChange: (voucherid: number | null) => void
  onReasonChange: (reason: string) => void
  onSearchChange: (term: string) => void
  onFilterChange: (filter: string[]) => void
  onIssue: () => void
}

export const VouchersDistributionTab: React.FC<VouchersDistributionTabProps> = ({
  customers,
  selectedCustomers,
  selectedVoucher,
  selectedReason,
  searchTerm,
  membershipFilter,
  isLoading,
  isIssuing,
  stats,
  onCustomerToggle,
  onToggleAll,
  onVoucherChange,
  onReasonChange,
  onSearchChange,
  onFilterChange,
  onIssue,
}) => {
  const handleMembershipChange = (tier: string) => {
    if (membershipFilter.includes(tier)) {
      onFilterChange(membershipFilter.filter(t => t !== tier))
    } else {
      onFilterChange([...membershipFilter, tier])
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
      {/* Filters Sidebar */}
      <div style={{
        backgroundColor: COLORS.card,
        borderRadius: '20px',
        border: `1px solid ${COLORS.border}`,
        padding: '20px',
        height: 'fit-content',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '12px' }}>
          Bộ Lọc
        </h3>

        {/* Membership Filter */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textLight, marginBottom: '8px' }}>
            Hạng Thành Viên
          </p>
          {['Đồng', 'Bạc', 'Vàng'].map(tier => (
            <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={membershipFilter.includes(tier)}
                onChange={() => handleMembershipChange(tier)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: COLORS.text }}>{tier}</span>
            </label>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textLight, marginBottom: '8px' }}>
            Tìm Kiếm
          </p>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', top: '10px', left: '10px', color: COLORS.textLight }} />
            <input
              type="text"
              placeholder="Tên/SĐT/Email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 32px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Voucher Selection */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textLight, marginBottom: '8px' }}>
            Chọn Voucher
          </p>
          <select
            value={selectedVoucher || ''}
            onChange={(e) => onVoucherChange(e.target.value ? parseInt(e.target.value) : null)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="">-- Chọn voucher --</option>
            {stats
              .filter(s => voucherService.isVoucherValid(s.expirydate))
              .map(s => (
                <option key={s.voucherid} value={s.voucherid}>
                  {s.code} - {s.title}
                </option>
              ))}
          </select>

          {/* Expiry Date Display */}
          {selectedVoucher && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: COLORS.successBg,
              borderRadius: '8px',
              borderLeft: `4px solid ${COLORS.success}`,
            }}>
              <p style={{
                fontSize: '12px',
                color: COLORS.success,
                fontWeight: '600',
                margin: 0,
              }}>
                Hạn dùng đến: {voucherService.formatVoucherExpiry(stats.find(s => s.voucherid === selectedVoucher)?.expirydate || '')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Reason Selection */}
        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '12px' }}>
            Lý Do Phát Hành
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {REASONS.map(reason => (
              <button
                key={reason.value}
                onClick={() => onReasonChange(reason.value)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${selectedReason === reason.value ? COLORS.primary : COLORS.border}`,
                  borderRadius: '12px',
                  backgroundColor: selectedReason === reason.value ? COLORS.primary : COLORS.card,
                  color: selectedReason === reason.value ? COLORS.card : COLORS.text,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {reason.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Summary */}
        {selectedVoucher && selectedCustomers.size > 0 && (
          <div style={{
            backgroundColor: COLORS.successBg,
            borderRadius: '16px',
            border: `2px solid ${COLORS.success}`,
            padding: '16px',
            marginBottom: '20px',
          }}>
            {(() => {
              const voucher = stats.find(s => s.voucherid === selectedVoucher)
              if (!voucher) return null
              
              // Tính tổng giá trị dự kiến
              let totalEstimatedValue = 0
              if (voucher.discounttype === '%') {
                // Ước tính dựa trên khách hàng
                totalEstimatedValue = selectedCustomers.size * (voucher.minordervalue || 500000) * (voucher.discountvalue / 100)
              } else {
                totalEstimatedValue = selectedCustomers.size * voucher.discountvalue
              }

              return (
                <div style={{ color: COLORS.success, fontSize: '14px', fontWeight: '500' }}>
                  <p style={{ margin: '0 0 8px 0' }}>
                    📋 <strong>Bạn chuẩn bị tặng:</strong> <strong>{voucher.code}</strong> - {voucher.title}
                  </p>
                  <p style={{ margin: '0 0 8px 0' }}>
                    👥 <strong>Cho {selectedCustomers.size} khách hàng</strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    💰 <strong>Tổng giá trị dự kiến: {totalEstimatedValue.toLocaleString()}đ</strong>
                  </p>
                </div>
              )
            })()}
          </div>
        )}

        {/* Customer Preview Table */}
        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text }}>
              Danh Sách Khách Hàng ({selectedCustomers.size}/{customers.length})
            </h3>
            <button
              onClick={onToggleAll}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: `1px solid ${COLORS.primary}`,
                borderRadius: '8px',
                backgroundColor: COLORS.primary,
                color: COLORS.card,
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {selectedCustomers.size === customers.length ? 'Bỏ Chọn Tất Cả' : 'Chọn Tất Cả'}
            </button>
          </div>

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: COLORS.textLight }}>
              Đang tải dữ liệu...
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0 }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.size === customers.length && customers.length > 0}
                        onChange={onToggleAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>Tên</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>SĐT</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Hạng</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.customerid} style={{ borderBottom: `1px solid ${COLORS.border}`, backgroundColor: selectedCustomers.has(Number(customer.customerid)) ? COLORS.successBg : COLORS.card }}>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(Number(customer.customerid))}
                          onChange={() => onCustomerToggle(Number(customer.customerid))}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', color: COLORS.text, fontWeight: '500' }}>
                        {customer.fullname}
                      </td>
                      <td style={{ padding: '12px 16px', color: COLORS.textLight }}>
                        {customer.phone}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: COLORS.text, fontWeight: '500' }}>
                        {customer.membership}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Issue Button */}
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={onIssue}
              disabled={isIssuing || selectedCustomers.size === 0 || !selectedVoucher}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '12px',
                backgroundColor: isIssuing || selectedCustomers.size === 0 || !selectedVoucher ? COLORS.textLight : COLORS.primary,
                color: COLORS.card,
                cursor: isIssuing || selectedCustomers.size === 0 || !selectedVoucher ? 'not-allowed' : 'pointer',
                opacity: isIssuing || selectedCustomers.size === 0 || !selectedVoucher ? 0.5 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              {isIssuing ? 'Đang gửi...' : `Phát Hành (${selectedCustomers.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
