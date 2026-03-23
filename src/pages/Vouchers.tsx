import { useState, useEffect } from 'react'
import { Ticket, Gift, Users, Coins, Search, ToggleRight, ToggleLeft, Plus } from 'lucide-react'
import { voucherService } from '@/services/voucherService'
import type { VoucherStatistic, Voucher, Customer } from '@/services/voucherService'
import { supabase } from '@/utils/supabaseClient'
import Toast from '@/components/Toast'
import CreateVoucherModal from '@/components/CreateVoucherModal'

// Horizon UI Theme Colors
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
  border: '#E0E5F2'
}

const REASONS = [
  { label: 'Sinh nhật', value: 'Sinh nhật' },
  { label: 'Đền bù', value: 'Đền bù' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Thử nghiệm', value: 'Thử nghiệm' }
]

export default function Vouchers() {
  const [activeTab, setActiveTab] = useState<'stats' | 'distribution' | 'points' | 'welcome'>('stats')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Tab 1: Statistics
  const [stats, setStats] = useState<VoucherStatistic[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  // Tab 2: Distribution
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set())
  const [selectedVoucher, setSelectedVoucher] = useState<number | null>(null)
  const [selectedReason, setSelectedReason] = useState<string>('Marketing')
  const [searchTerm, setSearchTerm] = useState('')
  const [membershipFilter, setMembershipFilter] = useState<string[]>(['Đồng', 'Bạc', 'Vàng'])
  const [distLoading, setDistLoading] = useState(false)
  const [issuing, setIssuing] = useState(false)

  // Tab 3: Points Configuration
  const [pointsVouchers, setPointsVouchers] = useState<Voucher[]>([])
  const [pointsConfig, setPointsConfig] = useState<Record<number, number>>({})
  const [pointsSaving, setPointsSaving] = useState(false)

  // Tab 4: Welcome Gift  
  const [welcomeVouchers, setWelcomeVouchers] = useState<Voucher[]>([])
  const [welcomeLoading, setWelcomeLoading] = useState(false)

  // ===== TAB 1: STATISTICS =====
  const loadStatistics = async () => {
    setStatsLoading(true)
    try {
      const data = await voucherService.getAllVouchersWithStats()
      setStats(data)
    } catch (error) {
      console.error('❌ Error loading stats:', error)
      setToast({ message: 'Lỗi tải thống kê', type: 'error' })
    } finally {
      setStatsLoading(false)
    }
  }

  // ===== TAB 2: DISTRIBUTION =====
  const loadCustomers = async () => {
    setDistLoading(true)
    try {
      const data = await voucherService.getCustomersByFilters({
        membership: membershipFilter,
        searchTerm: searchTerm || undefined
      })
      setCustomers(data)
    } catch (error) {
      console.error('❌ Error loading customers:', error)
      setToast({ message: 'Lỗi tải khách hàng', type: 'error' })
    } finally {
      setDistLoading(false)
    }
  }

  const toggleCustomer = (customerId: number) => {
    const newSelected = new Set(selectedCustomers)
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId)
    } else {
      newSelected.add(customerId)
    }
    setSelectedCustomers(newSelected)
  }

  const toggleAllCustomers = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set())
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.customerid)))
    }
  }

  const handleIssueVouchers = async () => {
    if (!selectedVoucher || selectedCustomers.size === 0) {
      setToast({ message: 'Vui lòng chọn voucher và khách hàng', type: 'error' })
      return
    }

    setIssuing(true)
    try {
      const customerIds = Array.from(selectedCustomers)
      await voucherService.issueVouchersToCustomers(
        customerIds,
        selectedVoucher,
        selectedReason
      )
      setToast({
        message: `✅ Đã gửi voucher tới ${customerIds.length} khách hàng`,
        type: 'success'
      })
      setSelectedCustomers(new Set())
      loadStatistics()
    } catch (error) {
      console.error('❌ Error issuing vouchers:', error)
      setToast({ message: 'Lỗi phát hành voucher: ' + (error as any).message, type: 'error' })
    } finally {
      setIssuing(false)
    }
  }

  // ===== TAB 3: POINTS CONFIGURATION =====
  const loadPointsVouchers = async () => {
    try {
      const data = await voucherService.getAllVouchers()
      setPointsVouchers(data)
      const config: Record<number, number> = {}
      data.forEach((v: Voucher) => {
        config[v.voucherid] = v.pointsrequired || 0
      })
      setPointsConfig(config)
    } catch (error) {
      console.error('❌ Error loading vouchers:', error)
      setToast({ message: 'Lỗi tải danh sách voucher', type: 'error' })
    }
  }

  const handleSavePointsConfig = async () => {
    setPointsSaving(true)
    try {
      const updates = Object.entries(pointsConfig)
        .map(([vid, points]) => ({
          voucherid: parseInt(vid),
          pointsrequired: points
        }))
        .filter(u => pointsVouchers.find(v => v.voucherid === u.voucherid && v.pointsrequired !== u.pointsrequired))

      if (updates.length === 0) {
        setToast({ message: 'Không có thay đổi', type: 'success' })
        setPointsSaving(false)
        return
      }

      await voucherService.updateMultiplePointsConfig(updates)
      setToast({ message: '✅ Lưu cấu hình thành công', type: 'success' })
      loadPointsVouchers()
    } catch (error) {
      console.error('❌ Error saving points:', error)
      setToast({ message: 'Lỗi lưu cấu hình: ' + (error as any).message, type: 'error' })
    } finally {
      setPointsSaving(false)
    }
  }

  // ===== TAB 4: WELCOME GIFT =====
  const loadWelcomeVouchers = async () => {
    setWelcomeLoading(true)
    try {
      // Load TẤT CẢ vouchers (không filter) để admin có thể toggle bật/tắt bất kỳ voucher
      const data = await voucherService.getAllVouchers()
      setWelcomeVouchers(data)
    } catch (error) {
      console.error('❌ Error loading vouchers:', error)
      setToast({ message: 'Lỗi tải quà tặng', type: 'error' })
    } finally {
      setWelcomeLoading(false)
    }
  }

  const handleToggleWelcome = async (voucherid: number, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ iswelcome: !currentValue })
        .eq('voucherid', voucherid)

      if (error) throw error

      setToast({
        message: `✅ Cập nhật trạng thái quà tặng thành công`,
        type: 'success'
      })
      loadWelcomeVouchers()
    } catch (error) {
      console.error('❌ Error toggling welcome:', error)
      setToast({ message: 'Lỗi cập nhật trạng thái: ' + (error as any).message, type: 'error' })
    }
  }

  // Handle create new voucher
  const handleCreateVoucherSuccess = (newVoucher: Voucher) => {
    setToast({ 
      message: `✅ Tạo voucher ${newVoucher.code} thành công!`, 
      type: 'success' 
    })
    // Always reload statistics (since it's used in dropdown of all tabs)
    loadStatistics()
    // Also reload other tabs that might need updating
    if (activeTab === 'points') {
      loadPointsVouchers()
    } else if (activeTab === 'welcome') {
      loadWelcomeVouchers()
    }
  }

  const handleCreateVoucherError = (message: string) => {
    setToast({ message, type: 'error' })
  }

  // Initial loads
  useEffect(() => {
    if (activeTab === 'stats') {
      loadStatistics()
    } else if (activeTab === 'distribution') {
      loadCustomers()
    } else if (activeTab === 'points') {
      loadPointsVouchers()
    } else if (activeTab === 'welcome') {
      loadWelcomeVouchers()
    }
  }, [activeTab])

  // Debounced search for Tab 2
  useEffect(() => {
    if (activeTab === 'distribution') {
      const timer = setTimeout(() => {
        loadCustomers()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchTerm, membershipFilter, activeTab])

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', padding: '32px 20px' }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.text, marginBottom: '4px' }}>
              Voucher & CRM
            </h1>
            <p style={{ fontSize: '14px', color: COLORS.textLight }}>
              Quản lý voucher, phát hành thông minh, và chương trình quà tặng
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: COLORS.primary,
              color: COLORS.card,
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <Plus size={20} />
            Thêm Voucher Mới
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: `2px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          padding: '12px',
          borderRadius: '16px'
        }}>
          {([
            { id: 'stats' as const, label: 'Thống Kê' },
            { id: 'distribution' as const, label: 'Phát Hành' },
            { id: 'points' as const, label: 'Đổi Điểm' },
            { id: 'welcome' as const, label: 'Quà Tặng' }
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? COLORS.card : COLORS.textLight,
                backgroundColor: activeTab === tab.id ? COLORS.primary : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: STATISTICS */}
        {activeTab === 'stats' && (
          <div>
            {statsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textLight }}>
                Đang tải dữ liệu...
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Tổng Voucher', value: stats.length, icon: Ticket, color: '#4318FF' },
                    { label: 'Tổng Phát', value: stats.reduce((sum, s) => sum + s.issuedCount, 0), icon: Users, color: '#00A869' },
                    { label: 'Tổng Dùng', value: stats.reduce((sum, s) => sum + s.usedCount, 0), icon: Gift, color: '#FF9900' },
                    { label: 'Tỷ Lệ Dùng Avg', value: stats.length > 0 ? ((stats.reduce((sum, s) => {
                      const rate = parseFloat(s.usageRate.replace('%', ''))
                      return sum + rate
                    }, 0) / stats.length).toFixed(1) + '%') : '0%', icon: Coins, color: '#4318FF' }
                  ].map((kpi, idx) => {
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
                          alignItems: 'center'
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
                  overflow: 'hidden'
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
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>Mã</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>Tên Voucher</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Giảm Giá</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Đã Phát</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Đã Dùng</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Tỷ Lệ</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Tình Trạng Hạn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map(stat => {
                          const isValid = voucherService.isVoucherValid(stat.expirydate)
                          return (
                            <tr key={stat.voucherid} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                              <td style={{ padding: '12px 16px', color: COLORS.text, fontWeight: '600' }}>
                                {stat.code}
                              </td>
                              <td style={{ padding: '12px 16px', color: COLORS.text }}>
                                {stat.title}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', color: COLORS.text }}>
                                {stat.discountvalue} {stat.discounttype}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', color: COLORS.text, fontWeight: '600' }}>
                                {stat.issuedCount}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', color: COLORS.text, fontWeight: '600' }}>
                                {stat.usedCount}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', color: COLORS.success, fontWeight: '600' }}>
                                {stat.usageRate}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: isValid ? COLORS.successBg : COLORS.warningBg,
                                  color: isValid ? COLORS.success : COLORS.warning,
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: isValid ? COLORS.success : COLORS.warning
                                  }} />
                                  {isValid ? 'Còn hiệu lực' : 'Đã hết hạn'}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: SMART DISTRIBUTION */}
        {activeTab === 'distribution' && (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
            {/* Filters Sidebar */}
            <div style={{
              backgroundColor: COLORS.card,
              borderRadius: '20px',
              border: `1px solid ${COLORS.border}`,
              padding: '20px',
              height: 'fit-content'
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
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMembershipFilter([...membershipFilter, tier])
                        } else {
                          setMembershipFilter(membershipFilter.filter(t => t !== tier))
                        }
                      }}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 8px 8px 32px',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '12px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
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
                  onChange={(e) => setSelectedVoucher(e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '12px',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
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
                    borderLeft: `4px solid ${COLORS.success}`
                  }}>
                    <p style={{
                      fontSize: '12px',
                      color: COLORS.success,
                      fontWeight: '600',
                      margin: 0
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
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '12px' }}>
                  Lý Do Phát Hành
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {REASONS.map(reason => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      style={{
                        padding: '8px 16px',
                        border: `1px solid ${selectedReason === reason.value ? COLORS.primary : COLORS.border}`,
                        borderRadius: '12px',
                        backgroundColor: selectedReason === reason.value ? COLORS.primary : COLORS.card,
                        color: selectedReason === reason.value ? COLORS.card : COLORS.text,
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Preview Table */}
              <div style={{
                backgroundColor: COLORS.card,
                borderRadius: '20px',
                border: `1px solid ${COLORS.border}`,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text }}>
                    Danh Sách Khách Hàng ({selectedCustomers.size}/{customers.length})
                  </h3>
                  <button
                    onClick={toggleAllCustomers}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: `1px solid ${COLORS.primary}`,
                      borderRadius: '8px',
                      backgroundColor: COLORS.primary,
                      color: COLORS.card,
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {selectedCustomers.size === customers.length ? 'Bỏ Chọn Tất Cả' : 'Chọn Tất Cả'}
                  </button>
                </div>

                {distLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: COLORS.textLight }}>
                    Đang tải dữ liệu...
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0 }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>
                            <input
                              type="checkbox"
                              checked={selectedCustomers.size === customers.length && customers.length > 0}
                              onChange={toggleAllCustomers}
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
                          <tr key={customer.customerid} style={{ borderBottom: `1px solid ${COLORS.border}`, backgroundColor: selectedCustomers.has(customer.customerid) ? COLORS.successBg : COLORS.card }}>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedCustomers.has(customer.customerid)}
                                onChange={() => toggleCustomer(customer.customerid)}
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
                    onClick={handleIssueVouchers}
                    disabled={issuing || selectedCustomers.size === 0 || !selectedVoucher}
                    style={{
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '12px',
                      backgroundColor: issuing || selectedCustomers.size === 0 || !selectedVoucher ? COLORS.textLight : COLORS.primary,
                      color: COLORS.card,
                      cursor: issuing || selectedCustomers.size === 0 || !selectedVoucher ? 'not-allowed' : 'pointer',
                      opacity: issuing || selectedCustomers.size === 0 || !selectedVoucher ? 0.5 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {issuing ? 'Đang gửi...' : `Phát Hành (${selectedCustomers.size})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POINTS CONFIGURATION */}
        {activeTab === 'points' && (
          <div>
            <div style={{
              backgroundColor: COLORS.card,
              borderRadius: '20px',
              border: `1px solid ${COLORS.border}`,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '20px', borderBottom: `1px solid ${COLORS.border}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: COLORS.text }}>
                  Cấu Hình Điểm Đổi Voucher
                </h3>
              </div>

              {pointsVouchers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: COLORS.textLight }}>
                  Đang tải dữ liệu...
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>Mã Voucher</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: COLORS.text }}>Tên Voucher</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: COLORS.text }}>Điểm Cần Có</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointsVouchers.map(voucher => (
                          <tr key={voucher.voucherid} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: '12px 16px', color: COLORS.text, fontWeight: '600' }}>
                              {voucher.code}
                            </td>
                            <td style={{ padding: '12px 16px', color: COLORS.text }}>
                              {voucher.title}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                value={pointsConfig[voucher.voucherid] || 0}
                                onChange={(e) => {
                                  setPointsConfig({
                                    ...pointsConfig,
                                    [voucher.voucherid]: parseInt(e.target.value) || 0
                                  })
                                }}
                                style={{
                                  width: '100px',
                                  padding: '8px 12px',
                                  border: `1px solid ${COLORS.border}`,
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ padding: '16px 20px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleSavePointsConfig}
                      disabled={pointsSaving}
                      style={{
                        padding: '10px 24px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '12px',
                        backgroundColor: pointsSaving ? COLORS.textLight : COLORS.success,
                        color: COLORS.card,
                        cursor: pointsSaving ? 'not-allowed' : 'pointer',
                        opacity: pointsSaving ? 0.5 : 1,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {pointsSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: WELCOME GIFT */}
        {activeTab === 'welcome' && (
          <div>
            {welcomeLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textLight }}>
                Đang tải dữ liệu...
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                {welcomeVouchers.map(voucher => (
                  <div
                    key={voucher.voucherid}
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: '20px',
                      border: `1px solid ${COLORS.border}`,
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '8px' }}>
                        {voucher.code}
                      </h4>
                      <p style={{ fontSize: '13px', color: COLORS.textLight, marginBottom: '12px' }}>
                        {voucher.title}
                      </p>
                      <div style={{
                        backgroundColor: COLORS.successBg,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <p style={{ fontSize: '12px', color: COLORS.success, fontWeight: '600' }}>
                          {voucher.discountvalue} {voucher.discounttype}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: COLORS.textLight, fontWeight: '500' }}>
                        Tặng thành viên mới
                      </span>
                      <button
                        onClick={() => handleToggleWelcome(voucher.voucherid, voucher.iswelcome)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {voucher.iswelcome ? (
                          <ToggleRight size={28} color={COLORS.success} />
                        ) : (
                          <ToggleLeft size={28} color={COLORS.textLight} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Voucher Modal */}
        <CreateVoucherModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateVoucherSuccess}
          onError={handleCreateVoucherError}
        />
      </div>
    </div>
  )
}
