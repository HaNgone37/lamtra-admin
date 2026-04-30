import React from 'react'
import { Ticket, Users, Gift, Coins, Trash2 } from 'lucide-react'
import type { VoucherStatistic } from '@/services/voucherService'
import { voucherService } from '@/services/voucherService'

const COLORS = {
  bg: '#F4F7FE',
  card: '#FFFFFF',
  text: '#2B3674',
  textLight: '#A3AED0',
  primary: '#4318FF',
  primaryBg: '#EEF4FF',
  success: '#00A869',
  successBg: '#EDFCF3',
  warning: '#FF9900',
  warningBg: '#FFF7E6',
  border: '#E0E5F2',
}

interface VouchersStatsTabProps {
  stats: VoucherStatistic[]
  isLoading: boolean
  onDelete?: (voucherId: number, voucherCode: string) => void
}

export const VouchersStatsTab: React.FC<VouchersStatsTabProps> = ({ stats, isLoading, onDelete }) => {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textLight }}>
        Đang tải dữ liệu...
      </div>
    )
  }

  const kpiCards = [
    { label: 'Tổng Voucher', value: stats.length, icon: Ticket, color: '#4318FF' },
    { label: 'Tổng Phát', value: stats.reduce((sum, s) => sum + (s.issuedCount ?? 0), 0), icon: Users, color: '#00A869' },
    { label: 'Tổng Dùng', value: stats.reduce((sum, s) => sum + (s.usedCount ?? 0), 0), icon: Gift, color: '#FF9900' },
    {
      label: 'Tỷ Lệ Dùng Avg',
      value: stats.length > 0 ? ((stats.reduce((sum, s) => {
        const rate = parseFloat(s.usageRate.replace('%', ''))
        return sum + rate
      }, 0) / stats.length).toFixed(1) + '%') : '0%',
      icon: Coins,
      color: '#4318FF',
    },
  ]

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div
              key={idx}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: '20px',
                padding: '20px',
                border: `1px solid ${COLORS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: '12px', color: COLORS.textLight, marginBottom: '8px' }}>
                  {kpi.label}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.text }}>
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                </p>
              </div>
              <Icon size={40} color={kpi.color} strokeWidth={1.5} />
            </div>
          )
        })}
      </div>

      {/* Vouchers Table */}
      <div style={{
        backgroundColor: COLORS.card,
        borderRadius: '20px',
        border: `1px solid ${COLORS.border}`,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: COLORS.text }}>
            Danh Sách Voucher
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ padding: '16px 18px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>Mã</th>
                <th style={{ padding: '16px 18px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>Tên Voucher</th>
                <th style={{ padding: '16px 18px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Giảm Giá</th>
                <th style={{ padding: '16px 18px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Phạm Vi</th>
                <th style={{ padding: '16px 18px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Đã Phát</th>
                <th style={{ padding: '16px 18px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Đã Dùng</th>
                <th style={{ padding: '16px 18px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Tỷ Lệ</th>
                <th style={{ padding: '16px 18px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Loại Chương Trình</th>
                <th style={{ padding: '16px 18px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Tình Trạng Hạn</th>
                <th style={{ padding: '16px 18px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(stat => {
                const isValid = voucherService.isVoucherValid(stat.expirydate)
                
                // Determine program type
                let programType = 'Phát hành thủ công'
                let programColor = COLORS.textLight
                let programBg = COLORS.bg
                
                if (stat.iswelcome) {
                  programType = 'Quà thành viên mới'
                  programColor = COLORS.success
                  programBg = COLORS.successBg
                } else if (stat.pointsrequired > 0) {
                  programType = 'Đổi điểm thưởng'
                  programColor = COLORS.primary
                  programBg = COLORS.primaryBg
                }

                return (
                  <tr key={stat.voucherid} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '16px 18px', color: COLORS.text, fontWeight: '600' }}>
                      {stat.code}
                    </td>
                    <td style={{ padding: '16px 18px', color: COLORS.text }}>
                      {stat.title}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'center', color: COLORS.text }}>
                      {stat.discountvalue} {stat.discounttype}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        backgroundColor: stat.scope === 'Toàn chuỗi' ? '#E3F2FD' : '#F3E5F5',
                        color: stat.scope === 'Toàn chuỗi' ? '#1976D2' : '#7B1FA2',
                        fontSize: '13px',
                        fontWeight: '600',
                        fontFamily: '"Be Vietnam Pro", sans-serif'
                      }}>
                        {stat.scope === 'Toàn chuỗi' ? 'Công khai' : 'Cá nhân'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'center', color: COLORS.text, fontWeight: '600' }}>
                      {stat.issuedCount}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'center', color: COLORS.text, fontWeight: '600' }}>
                      {stat.usedCount}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'center', color: COLORS.success, fontWeight: '600' }}>
                      {stat.usageRate}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: programBg,
                        color: programColor,
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {programType}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: isValid ? COLORS.successBg : COLORS.warningBg,
                        color: isValid ? COLORS.success : COLORS.warning,
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {isValid ? 'Còn hiệu lực' : 'Đã hết hạn'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(stat.voucherid, stat.code)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#EF4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEE2E2'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          title="Xóa voucher"
                        >
                          <Trash2 size={16} />
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
