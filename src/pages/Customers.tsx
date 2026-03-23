import { useState, useEffect } from 'react'
import { Search, Mail, Phone } from 'lucide-react'
import Toast from '@/components/Toast'

interface Customer {
  customerid: string
  fullname: string
  phone: string
  email: string
  totalpoints: number
  membership: string
  birthday: string | null
  ordercount: number
  totalspent: number
  lastorderdate: string
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
  warning: '#FEC90F',
  background: '#F3F4F6',
  lightBg: '#F4F7FE',
}

export default function CustomersPage() {
  // ===== Auth - Read from localStorage =====
  const userRole = (localStorage.getItem('userRole') || 'staff').toLowerCase()
  const userBranchId = localStorage.getItem('userBranchId') || ''
  const isSuperAdmin = userRole.toLowerCase().includes('super')

  // ===== State =====
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])

  // ===== Lifecycle =====
  useEffect(() => {
    loadCustomers()
  }, [])

  // Auto-filter when search text changes
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredCustomers(customers)
    } else {
      const search = searchText.toLowerCase()
      setFilteredCustomers(
        customers.filter(
          c =>
            c.fullname.toLowerCase().includes(search) ||
            c.phone.toLowerCase().includes(search) ||
            c.email.toLowerCase().includes(search)
        )
      )
    }
  }, [searchText, customers])

  // ===== Load Customers =====
  const loadCustomers = async () => {
    try {
      setLoading(true)
      const { supabase } = await import('@/utils/supabaseClient')

      // ===== SUPER ADMIN: Fetch ALL customers =====
      if (isSuperAdmin) {
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('customerid, fullname, phone, email, totalpoints, membership, birthday')

        if (customersError) throw customersError

        // Get all orders to calculate stats
        const { data: allOrdersData, error: allOrdersError } = await supabase
          .from('orders')
          .select('customerid, totalamount, orderdate')

        if (allOrdersError) throw allOrdersError

        // Aggregate order data per customer
        const customerStats: { [key: string]: any } = {}
        customersData?.forEach((customer: any) => {
          customerStats[customer.customerid] = {
            customerid: customer.customerid,
            fullname: customer.fullname,
            phone: customer.phone || '',
            email: customer.email || '',
            totalpoints: customer.totalpoints || 0,
            membership: customer.membership || 'Thường',
            birthday: customer.birthday,
            ordercount: 0,
            totalspent: 0,
            lastorderdate: '',
          }
        })

        allOrdersData?.forEach((order: any) => {
          if (customerStats[order.customerid]) {
            customerStats[order.customerid].ordercount++
            customerStats[order.customerid].totalspent += order.totalamount
            const orderDate = new Date(order.orderdate).getTime()
            const lastDate = new Date(customerStats[order.customerid].lastorderdate || 0).getTime()
            if (orderDate > lastDate) {
              customerStats[order.customerid].lastorderdate = order.orderdate
            }
          }
        })

        const customerList = Object.values(customerStats).sort((a, b) => {
          if (b.ordercount !== a.ordercount) return b.ordercount - a.ordercount
          return new Date(b.lastorderdate).getTime() - new Date(a.lastorderdate).getTime()
        })

        setCustomers(customerList)
        setFilteredCustomers(customerList)
        addToast(`Tải ${customerList.length} khách hàng thành công`, 'success')
      } else {
        // ===== MANAGER: Fetch customers from branch orders =====
        if (!userBranchId) {
          setCustomers([])
          setFilteredCustomers([])
          addToast('Không tìm thấy chi nhánh', 'error')
          return
        }

        // Get orders for this branch
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('customerid, totalamount, orderdate')
          .eq('branchid', userBranchId)

        if (ordersError) throw ordersError

        // Get unique customer IDs
        const customerIds = [...new Set(ordersData?.map((o: any) => o.customerid) || [])]

        if (customerIds.length === 0) {
          setCustomers([])
          setFilteredCustomers([])
          return
        }

        // Get customer details
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('customerid, fullname, phone, email, totalpoints, membership, birthday')
          .in('customerid', customerIds)

        if (customersError) throw customersError

        // Aggregate order data per customer
        const customerStats: { [key: string]: any } = {}
        customersData?.forEach((customer: any) => {
          customerStats[customer.customerid] = {
            customerid: customer.customerid,
            fullname: customer.fullname,
            phone: customer.phone || '',
            email: customer.email || '',
            totalpoints: customer.totalpoints || 0,
            membership: customer.membership || 'Thường',
            birthday: customer.birthday,
            ordercount: 0,
            totalspent: 0,
            lastorderdate: '',
          }
        })

        ordersData?.forEach((order: any) => {
          if (customerStats[order.customerid]) {
            customerStats[order.customerid].ordercount++
            customerStats[order.customerid].totalspent += order.totalamount
            const orderDate = new Date(order.orderdate).getTime()
            const lastDate = new Date(customerStats[order.customerid].lastorderdate || 0).getTime()
            if (orderDate > lastDate) {
              customerStats[order.customerid].lastorderdate = order.orderdate
            }
          }
        })

        const customerList = Object.values(customerStats).sort((a, b) => {
          if (b.ordercount !== a.ordercount) return b.ordercount - a.ordercount
          return new Date(b.lastorderdate).getTime() - new Date(a.lastorderdate).getTime()
        })

        setCustomers(customerList)
        setFilteredCustomers(customerList)
        addToast(`Tải ${customerList.length} khách hàng thành công`, 'success')
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      addToast('Lỗi tải danh sách khách hàng', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== Toast =====
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString()
    setToastMessages(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToastMessages(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  // ===== Render =====
  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: colors.text, fontSize: '32px', fontWeight: '700', margin: 0 }}>
          Danh sách khách hàng
        </h1>
        <p style={{ color: colors.textLight, fontSize: '14px', margin: '8px 0 0 0' }}>
          Quản lý và theo dõi thông tin khách hàng đã mua hàng
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          position: 'relative',
          maxWidth: '400px',
        }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textLight,
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, số điện thoại, email..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: colors.text,
            }}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
        padding: '24px',
        overflowX: 'auto',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
            ⏳ Đang tải...
          </div>
        ) : filteredCustomers.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600', fontSize: '14px' }}>STT</th>
                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600', fontSize: '14px' }}>Tên khách hàng</th>
                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600', fontSize: '14px' }}>Điện thoại</th>
                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600', fontSize: '14px' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'center', color: colors.text, fontWeight: '600', fontSize: '14px' }}>Số đơn</th>
                <th style={{ padding: '12px', textAlign: 'right', color: colors.text, fontWeight: '600', fontSize: '14px' }}>Chi tiêu (đ)</th>
                <th style={{ padding: '12px', textAlign: 'center', color: colors.text, fontWeight: '600', fontSize: '14px' }}>Điểm</th>
                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600', fontSize: '14px' }}>Membershp</th>
                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600', fontSize: '14px' }}>Đơn cuối</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, idx) => (
                <tr key={customer.customerid} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px', color: colors.text, fontSize: '14px' }}>{idx + 1}</td>
                  <td style={{ padding: '12px', color: colors.text, fontSize: '14px', fontWeight: '600' }}>
                    {customer.fullname}
                  </td>
                  <td style={{ padding: '12px', color: colors.text, fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} style={{ color: colors.primary }} />
                      {customer.phone}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: colors.textLight, fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} style={{ color: colors.primary }} />
                      {customer.email}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: colors.primary, fontWeight: '600', fontSize: '14px' }}>
                    {customer.ordercount}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: colors.primary, fontWeight: '600', fontSize: '14px' }}>
                    {customer.totalspent.toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: colors.warning, fontWeight: '600', fontSize: '14px' }}>
                    {customer.totalpoints}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        backgroundColor:
                          customer.membership === 'VIP' ? `${colors.primary}20`
                            : customer.membership === 'Silver' ? `${colors.textLight}20`
                              : `${colors.success}20`,
                        color:
                          customer.membership === 'VIP' ? colors.primary
                            : customer.membership === 'Silver' ? colors.textLight
                              : colors.success,
                        borderRadius: '4px',
                        fontWeight: '600',
                      }}
                    >
                      {customer.membership}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: colors.textLight, fontSize: '13px' }}>
                    {customer.lastorderdate ? new Date(customer.lastorderdate).toLocaleDateString('vi-VN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
            {customers.length === 0 ? 'Không có khách hàng nào' : 'Không tìm thấy khách hàng'}
          </div>
        )}
      </div>

      {/* Summary */}
      {customers.length > 0 && (
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
          }}>
            <p style={{ color: colors.textLight, fontSize: '12px', margin: '0 0 8px 0' }}>Tổng khách hàng</p>
            <h3 style={{ color: colors.primary, fontSize: '24px', fontWeight: '700', margin: 0 }}>
              {customers.length}
            </h3>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
          }}>
            <p style={{ color: colors.textLight, fontSize: '12px', margin: '0 0 8px 0' }}>Tổng chi tiêu</p>
            <h3 style={{ color: colors.primary, fontSize: '20px', fontWeight: '700', margin: 0 }}>
              {customers.reduce((sum, c) => sum + c.totalspent, 0).toLocaleString('vi-VN')} đ
            </h3>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
          }}>
            <p style={{ color: colors.textLight, fontSize: '12px', margin: '0 0 8px 0' }}>Trung bình chi tiêu</p>
            <h3 style={{ color: colors.primary, fontSize: '20px', fontWeight: '700', margin: 0 }}>
              {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.totalspent, 0) / customers.length).toLocaleString('vi-VN') : 0} đ
            </h3>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessages.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToastMessages(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
    </div>
  )
}
