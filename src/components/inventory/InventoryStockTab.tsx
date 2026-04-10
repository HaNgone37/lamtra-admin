import React from 'react'
import { ClipboardCheck, Plus } from 'lucide-react'
import { BranchInventory } from '@/types'

// ============ COLOR SCHEME ============
const colors = {
  primary: '#4318FF',
  text: '#2B3674',
  textLight: '#8F9CB8',
  border: '#E0E5F2',
  success: '#05B75D',
  error: '#F3685A',
  warning: '#FEC90F',
  background: '#F3F4F6',
}

// ============ PILL BADGE COMPONENT ============
const PillBadge = ({
  label,
  color,
  bgColor,
}: {
  label: string
  color: string
  bgColor: string
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      paddingLeft: '12px',
      paddingRight: '14px',
      paddingTop: '6px',
      paddingBottom: '6px',
      borderRadius: '100px',
      backgroundColor: bgColor,
      color: color,
      fontSize: '12px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color,
      }}
    />
    {label}
  </span>
)

interface InventoryStockTabProps {
  branches: { branchid: string; name: string }[]
  selectedBranch: string
  onBranchChange: (branchId: string) => void
  branchInventory: BranchInventory[]
  onRestockClick: (ingredientId: string) => void
  onAuditClick: (ingredientId: string, currentStock: number) => void
  canEdit?: boolean
}

export const InventoryStockTab: React.FC<InventoryStockTabProps> = ({
  branches,
  selectedBranch,
  onBranchChange,
  branchInventory,
  onRestockClick,
  onAuditClick,
  canEdit = true,
}) => {
  const tableHeaderStyle = {
    backgroundColor: colors.background,
    color: colors.text,
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: '600',
    fontSize: '13px',
    borderBottom: `2px solid ${colors.border}`,
  }

  const tableCellStyle = {
    padding: '12px',
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: '14px',
  }

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Branch Selector */}
      {branches.length > 1 && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: colors.text }}>
            Chọn chi nhánh:
          </label>
          <select
            value={selectedBranch}
            onChange={e => onBranchChange(e.target.value)}
            style={{
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              width: '100%',
              cursor: 'pointer',
            }}
          >
            {branches.map(branch => (
              <option key={branch.branchid} value={branch.branchid}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Inventory Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>STT</th>
            <th style={tableHeaderStyle}>Nguyên liệu</th>
            <th style={tableHeaderStyle}>Tồn kho</th>
            <th style={tableHeaderStyle}>Đơn vị</th>
            <th style={tableHeaderStyle}>Mức cảnh báo</th>
            <th style={tableHeaderStyle}>Trạng thái</th>
            <th style={tableHeaderStyle}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {branchInventory.map((item, idx) => {
            const minStock = item.ingredient?.minstocklevel || 0
            const isLowStock = item.currentstock < minStock
            const isEmpty = item.currentstock === 0

            return (
              <tr key={`${item.branchid}-${item.ingredientid}`}>
                <td style={tableCellStyle}>{idx + 1}</td>
                <td style={tableCellStyle}>{item.ingredient?.name || 'N/A'}</td>
                <td style={tableCellStyle}>{item.currentstock}</td>
                <td style={tableCellStyle}>{item.ingredient?.unit || 'N/A'}</td>
                <td style={tableCellStyle}>{item.ingredient?.minstocklevel || '-'}</td>
                <td style={tableCellStyle}>
                  {isEmpty ? (
                    <PillBadge label="Hết hàng" color={colors.error} bgColor="#FEE2E2" />
                  ) : isLowStock ? (
                    <PillBadge label="Cảnh báo" color={colors.warning} bgColor="#FEF3C7" />
                  ) : (
                    <PillBadge label="Bình thường" color={colors.success} bgColor="#E8F5E9" />
                  )}
                </td>
                <td style={tableCellStyle}>
                  {canEdit ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onRestockClick(String(item.ingredientid))}
                        title="Nhập kho"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Plus size={14} /> Nhập
                      </button>
                      <button
                        onClick={() => onAuditClick(String(item.ingredientid), item.currentstock)}
                        title="Kiểm kê"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#E0E5F2',
                          color: colors.primary,
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ClipboardCheck size={14} /> Kiểm
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#8F9CB8', fontStyle: 'italic' }}>Chỉ xem</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {branchInventory.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: colors.textLight }}>
          Không có dữ liệu tồn kho
        </div>
      )}
    </div>
  )
}
