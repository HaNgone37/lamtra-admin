import React, { useMemo } from 'react'
import { Gift, AlertCircle } from 'lucide-react'

const COLORS = {
  bg: '#F4F7FE',
  card: '#FFFFFF',
  text: '#2B3674',
  textLight: '#A3AED0',
  primary: '#4318FF',
  success: '#00A869',
  successBg: '#EDFCF3',
  error: '#EE5A6F',
  errorBg: '#FFE8EB',
  border: '#E0E5F2',
}

interface WelcomeVoucher {
  voucherid: number
  code: string
  title: string
  discount: number | string
  expirydate: string
  isAssignedToWelcome: boolean
}

interface VouchersWelcomeTabProps {
  vouchers: WelcomeVoucher[]
  isLoading: boolean
  isSaving: boolean
  onToggle: (voucherid: number) => void
  onSave: () => void
}

export const VouchersWelcomeTab: React.FC<VouchersWelcomeTabProps> = ({
  vouchers,
  isLoading,
  isSaving,
  onToggle,
  onSave,
}) => {
  // Sort vouchers: active first, then by expiry date
  const sortedVouchers = useMemo(() => {
    return [...vouchers].sort((a, b) => {
      // Active programs first
      if (a.isAssignedToWelcome !== b.isAssignedToWelcome) {
        return a.isAssignedToWelcome ? -1 : 1
      }

      // Then sort by expiry date (soonest first)
      return new Date(a.expirydate).getTime() - new Date(b.expirydate).getTime()
    })
  }, [vouchers])

  const handleToggle = (voucherid: number) => {
    const voucher = vouchers.find(v => v.voucherid === voucherid)
    const now = new Date()
    const isExpired = new Date(voucher?.expirydate || '').getTime() < now.getTime()

    // Prevent toggling expired vouchers
    if (isExpired) return

    onToggle(voucherid)
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        backgroundColor: COLORS.card,
        borderRadius: '20px',
        border: `1px solid ${COLORS.border}`,
        padding: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: COLORS.text, margin: 0, marginBottom: '4px' }}>
            Chiến Dịch Chào Mừng Thành Viên Mới
          </h3>
          <p style={{ fontSize: '12px', color: COLORS.textLight, margin: 0 }}>
            Chọn voucher để tặng khách hàng mới
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: isSaving ? COLORS.textLight : COLORS.primary,
            color: COLORS.card,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.5 : 1,
            transition: 'all 0.3s ease',
          }}
        >
          {isSaving ? 'Đang lưu...' : 'Lưu Cài Đặt'}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          padding: '60px 20px',
          textAlign: 'center',
          color: COLORS.textLight,
        }}>
          Đang tải dữ liệu...
        </div>
      ) : vouchers.length === 0 ? (
        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          padding: '60px 20px',
          textAlign: 'center',
        }}>
          <p style={{ color: COLORS.textLight, fontSize: '14px', margin: 0 }}>
            Chưa có voucher nào để cấu hình
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {sortedVouchers.map(voucher => {
            const now = new Date()
            const isExpired = new Date(voucher.expirydate).getTime() < now.getTime()
            const expiryDate = new Date(voucher.expirydate)
            const formattedDate = expiryDate.toLocaleDateString('vi-VN')

            return (
              <div
                key={voucher.voucherid}
                onClick={() => handleToggle(voucher.voucherid)}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: '16px',
                  border: `2px solid ${voucher.isAssignedToWelcome ? COLORS.primary : isExpired ? COLORS.error : COLORS.border}`,
                  padding: '16px',
                  cursor: isExpired ? 'not-allowed' : 'pointer',
                  opacity: isExpired ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: voucher.isAssignedToWelcome ? `0 0 12px ${COLORS.primary}33` : 'none',
                }}
              >
                {/* Card Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: COLORS.text,
                      margin: 0,
                      marginBottom: '4px',
                    }}>
                      {voucher.code}
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: COLORS.textLight,
                      margin: 0,
                      lineHeight: '1.4',
                    }}>
                      {voucher.title}
                    </p>
                  </div>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isExpired
                      ? COLORS.errorBg
                      : voucher.isAssignedToWelcome
                        ? COLORS.primary
                        : COLORS.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}>
                    {isExpired ? (
                      <AlertCircle size={16} color={COLORS.error} />
                    ) : (
                      <Gift
                        size={16}
                        style={{
                          color: voucher.isAssignedToWelcome ? COLORS.card : COLORS.textLight,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Card Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  {/* Discount */}
                  <div style={{
                    backgroundColor: COLORS.bg,
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                  }}>
                    <p style={{
                      fontSize: '11px',
                      color: COLORS.textLight,
                      margin: 0,
                      marginBottom: '2px',
                      fontWeight: '500',
                    }}>
                      Giảm giá
                    </p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: COLORS.primary,
                      margin: 0,
                    }}>
                      {typeof voucher.discount === 'number'
                        ? voucher.discount > 100
                          ? `${voucher.discount.toLocaleString()}đ`
                          : `${voucher.discount}%`
                        : voucher.discount}
                    </p>
                  </div>

                  {/* Kết thúc Chương Trình */}
                  <div style={{
                    backgroundColor: isExpired ? COLORS.errorBg : COLORS.bg,
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                  }}>
                    <p style={{
                      fontSize: '11px',
                      color: isExpired ? COLORS.error : COLORS.textLight,
                      margin: 0,
                      marginBottom: '2px',
                      fontWeight: '500',
                    }}>
                      {isExpired ? 'Đã kết thúc' : 'Kết thúc CT'}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: isExpired ? COLORS.error : COLORS.text,
                      margin: 0,
                    }}>
                      {formattedDate}
                    </p>
                  </div>
                </div>

                {/* Expired Badge */}
                {isExpired && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: COLORS.errorBg,
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: COLORS.error,
                    fontWeight: '600',
                  }}>
                    <AlertCircle size={14} />
                    Chương trình đã hết hạn
                  </div>
                )}

                {/* Toggle Switch */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: isExpired
                    ? COLORS.bg
                    : voucher.isAssignedToWelcome
                      ? `${COLORS.primary}15`
                      : COLORS.bg,
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                }}>
                  {/* Custom Toggle */}
                  <div style={{
                    width: '40px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor:
                      isExpired
                        ? COLORS.textLight
                        : voucher.isAssignedToWelcome
                          ? COLORS.success
                          : COLORS.border,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    cursor: isExpired ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      backgroundColor: COLORS.card,
                      transform: voucher.isAssignedToWelcome ? 'translateX(16px)' : 'translateX(0)',
                      transition: 'transform 0.3s ease',
                    }} />
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: isExpired
                      ? COLORS.textLight
                      : voucher.isAssignedToWelcome
                        ? COLORS.success
                        : COLORS.textLight,
                    transition: 'color 0.3s ease',
                  }}>
                    {isExpired ? 'Hết hạn' : voucher.isAssignedToWelcome ? 'Bật' : 'Tắt'}
                  </span>
                </div>


              </div>
            )
          })}
        </div>
      )}

      {/* Footer Info */}
      {vouchers.length > 0 && (
        <div style={{
          marginTop: '20px',
          backgroundColor: COLORS.successBg,
          borderRadius: '12px',
          border: `1px solid ${COLORS.success}`,
          padding: '12px 16px',
          fontSize: '12px',
          color: COLORS.success,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <Gift size={16} />
          <span>
            Các voucher được bật sẽ được tặng cho khách hàng mới. Voucher hết hạn sẽ tự động được tắt
          </span>
        </div>
      )}
    </div>
  )
}
