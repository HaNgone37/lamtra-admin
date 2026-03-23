import { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { supabase } from '@/utils/supabaseClient'
import { Product } from '@/types'
import { ToggleRight, ToggleLeft, Search } from 'lucide-react'
import Toast from '@/components/Toast'

interface BranchProductStatusRow {
  branchid: string
  productid: string
  available: boolean
  product?: Product
}

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

const colors = {
  primary: '#4318FF',
  text: '#2B3674',
  textLight: '#8F9CB8',
  border: '#E0E5F2',
  success: '#05B75D',
  error: '#F3685A',
  background: '#F3F4F6',
}

interface BranchProductStatusProps {
  branchId: string
  branchName: string
}

export default function BranchProductStatus({ branchId, branchName }: BranchProductStatusProps) {
  const [statuses, setStatuses] = useState<BranchProductStatusRow[]>([])
  const [loading, setLoading] = useState(false)
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load branch product statuses
  useEffect(() => {
    if (branchId) {
      loadStatuses()
    }
  }, [branchId])

  const loadStatuses = async () => {
    if (!branchId) return
    setLoading(true)
    try {
      // First, get all products
      const { data: products } = await supabase
        .from('products')
        .select('*')

      // Then, get branch product status
      const { data: statuses } = await supabase
        .from('branchproductstatus')
        .select('*')
        .eq('branchid', branchId)

      // Map statuses
      if (products && statuses) {
        const statusMap = new Map(statuses.map(s => [s.productid, s]))
        const enriched = products.map(p => ({
          branchid: branchId,
          productid: p.productid,
          available: statusMap.get(p.productid)?.available ?? true,
          product: p
        }))
        setStatuses(enriched)
      }
    } catch (error) {
      console.error('Error loading statuses:', error)
      showToast('Lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleProduct = async (productId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('branchproductstatus')
        .select('*')
        .eq('branchid', branchId)
        .eq('productid', productId)
        .single()

      if (existing) {
        // Update existing
        await supabase
          .from('branchproductstatus')
          .update({ available: newStatus })
          .eq('branchid', branchId)
          .eq('productid', productId)
      } else {
        // Insert new
        await supabase
          .from('branchproductstatus')
          .insert([{
            branchid: branchId,
            productid: productId,
            available: newStatus
          }])
      }

      // Update local state
      setStatuses(prev => prev.map(s => 
        s.productid === productId 
          ? { ...s, available: newStatus }
          : s
      ))

      showToast(
        newStatus 
          ? 'Đã kích hoạt sản phẩm' 
          : 'Đã vô hiệu hóa sản phẩm',
        'success'
      )
    } catch (error) {
      console.error('Error toggling product:', error)
      showToast('Lỗi khi cập nhật trạng thái', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString()
    setToastMessages(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToastMessages(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const filteredStatuses = statuses.filter(s =>
    s.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ padding: '20px' }}>
      {/* Toast Notifications */}
      {toastMessages.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToastMessages(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: colors.text, fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Thực đơn chi nhánh
        </h1>
        <p style={{ color: colors.textLight }}>
          Quản lý trạng thái sản phẩm tại: <strong>{branchName}</strong>
        </p>
      </div>

      {/* Search */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Search size={18} style={{ color: colors.textLight }} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: colors.text,
              backgroundColor: '#FFFFFF'
            }}
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
            Đang tải...
          </div>
        ) : filteredStatuses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
            Không có sản phẩm
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {filteredStatuses.map(status => (
              <div
                key={status.productid}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h3 style={{ color: colors.text, fontWeight: '600', marginBottom: '4px' }}>
                    {status.product?.name || 'N/A'}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: status.available ? colors.success : colors.error,
                    fontSize: '12px'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: status.available ? colors.success : colors.error
                    }} />
                    {status.available ? 'Còn phục vụ' : 'Hết món'}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleProduct(status.productid, status.available)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={status.available ? 'Tắt phục vụ' : 'Bật phục vụ'}
                >
                  {status.available ? (
                    <ToggleRight size={28} color={colors.success} />
                  ) : (
                    <ToggleLeft size={28} color={colors.error} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
