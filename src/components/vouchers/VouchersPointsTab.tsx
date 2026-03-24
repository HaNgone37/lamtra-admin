import React, { useState } from 'react'
import { Save } from 'lucide-react'

const COLORS = {
  bg: '#F4F7FE',
  card: '#FFFFFF',
  text: '#2B3674',
  textLight: '#A3AED0',
  primary: '#4318FF',
  success: '#00A869',
  successBg: '#EDFCF3',
  warning: '#FF9900',
  warningBg: '#FFF7E6',
  error: '#EE5A6F',
  border: '#E0E5F2',
}

interface VoucherPointsMapping {
  voucherid: number
  code: string
  title: string
  pointsRequired: number
  pointsValue: number
}

interface VouchersPointsTabProps {
  mappings: VoucherPointsMapping[]
  isLoading: boolean
  isSaving: boolean
  onMappingChange: (voucherid: number, field: string, value: number) => void
  onSave: () => void
}

export const VouchersPointsTab: React.FC<VouchersPointsTabProps> = ({
  mappings,
  isLoading,
  isSaving,
  onMappingChange,
  onSave,
}) => {
  const [editedMappings, setEditedMappings] = useState<Set<number>>(new Set())

  const handleChange = (voucherid: number, value: string) => {
    const numValue = parseInt(value) || 0
    onMappingChange(voucherid, 'pointsRequired', numValue)
    setEditedMappings(prev => new Set([...prev, voucherid]))
  }

  const handleSave = () => {
    if (editedMappings.size > 0) {
      onSave()
      setEditedMappings(new Set())
    }
  }

  return (
    <div style={{
      backgroundColor: COLORS.card,
      borderRadius: '20px',
      border: `1px solid ${COLORS.border}`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: COLORS.text, margin: 0, marginBottom: '4px' }}>
            Đổi Điểm Thưởng
          </h3>
          <p style={{ fontSize: '12px', color: COLORS.textLight, margin: 0 }}>
            Cấu hình voucher nào có thể đổi bằng điểm. Voucher với điểm {'>'} 0 và được Bật sẽ hiển thị trong ứng dụng khách
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || editedMappings.size === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: isSaving || editedMappings.size === 0 ? COLORS.textLight : COLORS.primary,
            color: COLORS.card,
            cursor: isSaving || editedMappings.size === 0 ? 'not-allowed' : 'pointer',
            opacity: isSaving || editedMappings.size === 0 ? 0.5 : 1,
            transition: 'all 0.3s ease',
          }}
        >
          <Save size={16} />
          {isSaving ? 'Đang lưu...' : `Lưu Thay Đổi (${editedMappings.size})`}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: COLORS.textLight }}>
          Đang tải cấu hình...
        </div>
      ) : mappings.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ color: COLORS.textLight, fontSize: '14px', margin: 0 }}>
            Chưa có voucher nào để cấu hình
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>
                  Voucher
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text, width: '180px' }}>
                  Điểm Cần Đổi
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text, width: '100px' }}>
                  Trạng Thái
                </th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => {
                const isEnabled = mapping.pointsRequired > 0
                const isEdited = editedMappings.has(mapping.voucherid)

                return (
                  <tr
                    key={mapping.voucherid}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                      backgroundColor: isEdited ? COLORS.bg : COLORS.card,
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {/* Voucher Name + Code */}
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <p style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: COLORS.text,
                          margin: 0,
                          marginBottom: '2px',
                        }}>
                          {mapping.code}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: COLORS.textLight,
                          margin: 0,
                        }}>
                          {mapping.title}
                        </p>
                      </div>
                    </td>

                    {/* Points Input */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="number"
                        value={mapping.pointsRequired}
                        onChange={(e) => handleChange(mapping.voucherid, e.target.value)}
                        min="0"
                        placeholder="0"
                        style={{
                          width: '100px',
                          padding: '8px 12px',
                          border: `1px solid ${isEdited ? COLORS.primary : COLORS.border}`,
                          borderRadius: '8px',
                          fontSize: '13px',
                          textAlign: 'center',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                      />
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        borderRadius: '12px',
                        backgroundColor: isEnabled ? COLORS.successBg : COLORS.warningBg,
                        fontSize: '12px',
                        fontWeight: '600',
                        color: isEnabled ? COLORS.success : COLORS.warning,
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: isEnabled ? COLORS.success : COLORS.warning,
                        }} />
                        {isEnabled ? 'Bật' : 'Tắt'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info */}
      {mappings.length > 0 && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: COLORS.bg,
          borderTop: `1px solid ${COLORS.border}`,
          fontSize: '12px',
          color: COLORS.textLight,
        }}>
          💡 Bật tự động khi điểm &gt; 0. Khách hàng sẽ thấy voucher này trong mục đổi điểm của ứng dụng
        </div>
      )}
    </div>
  )
}
