import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/Card'
import { voucherService, Voucher, Customer, CustomerVoucher } from '@/services/voucherService'
import { Ticket, Gift, UserPlus, Coins, Plus, Edit2, Save, X, Search, ToggleRight, ToggleLeft, BarChart3 } from 'lucide-react'
import { supabase } from '@/utils/supabaseClient'

interface TabState {
  statistics: boolean
  distribution: boolean
  pointsConfig: boolean
  welcomeGift: boolean
}

interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
}

interface VoucherStats {
  voucherid: number
  code: string
  description: string
  discount: number
  discounttype: string
  totalIssued: number
  totalUsed: number
  usageRate: string
  pointsrequired: number
  iswelcome: boolean
  isactive: boolean
}

export const Settings: React.FC = () => {
  // ===== STATE =====
  const [activeTab, setActiveTab] = useState<keyof TabState>('statistics')
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [voucherStats, setVoucherStats] = useState<VoucherStats[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<Toast>({ message: '', type: 'success', visible: false })

  // Smart Distribution State
  const [filterBirthday, setFilterBirthday] = useState(false)
  const [filterMembership, setFilterMembership] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVoucher, setSelectedVoucher] = useState<number | null>(null)
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
  const [reason, setReason] = useState('marketing')

  // Points Config State
  const [pointsConfig, setPointsConfig] = useState<Record<number, number>>({})

  // Welcome Gift State
  const [welcomeVouchers, setWelcomeVouchers] = useState<number[]>([])

  // ===== EFFECTS =====
  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    loadVouchersStats()
  }, [vouchers])

  // ===== LOAD DATA =====
  const loadAllData = async () => {
    try {
      setLoading(true)
      const [vouchersData, customersData] = await Promise.all([
        voucherService.getAllVouchers(),
        loadCustomers()
      ])
      setVouchers(vouchersData)
      setCustomers(customersData)

      // Initialize points config
      const config: Record<number, number> = {}
      vouchersData.forEach(v => {
        config[v.voucherid] = v.pointsrequired || 0
      })
      setPointsConfig(config)

      // Load welcome vouchers
      const welcome = vouchersData.filter(v => v.iswelcome).map(v => v.voucherid)
      setWelcomeVouchers(welcome)
    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async (): Promise<Customer[]> => {
    try {
      const { data, error } = await supabase.from('customers').select('*')
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading customers:', error)
      return []
    }
  }

  const loadVouchersStats = async () => {
    try {
      const stats: VoucherStats[] = await Promise.all(
        vouchers.map(async (v) => {
          const statsData = await voucherService.getVoucherStatistics(v.voucherid)
          return {
            voucherid: v.voucherid,
            code: v.code,
            description: v.description,
            discount: v.discount,
            discounttype: v.discounttype,
            totalIssued: statsData.totalIssued,
            totalUsed: statsData.totalUsed,
            usageRate: statsData.usageRate,
            pointsrequired: v.pointsrequired,
            iswelcome: v.iswelcome,
            isactive: v.isactive
          }
        })
      )
      setVoucherStats(stats)
    } catch (error) {
      console.error('Error loading voucher stats:', error)
    }
  }

  // ===== TOAST HELPER =====
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
  }

  // ===== FILTER CUSTOMERS =====
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (filterMembership.length > 0 && !filterMembership.includes(customer.membership)) {
        return false
      }
      if (searchTerm && !customer.fullname.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !customer.phone.includes(searchTerm) && !customer.email.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      return true
    })
  }, [customers, filterMembership, searchTerm])

  // ===== HANDLERS =====
  const handleIssueVouchers = async () => {
    if (!selectedVoucher || selectedCustomers.length === 0) {
      showToast('Vui lòng chọn voucher và khách hàng', 'error')
      return
    }

    try {
      const result = await voucherService.issueVouchersToCustomers(
        selectedCustomers,
        selectedVoucher,
        reason
      )
      showToast(`Đã gửi voucher tới ${result.success} khách hàng`, 'success')
      setSelectedCustomers([])
      setSelectedVoucher(null)
      loadVouchersStats()
    } catch (error) {
      showToast('Lỗi khi gửi voucher', 'error')
    }
  }

  const handleSavePointsConfig = async () => {
    try {
      await Promise.all(
        Object.entries(pointsConfig).map(([voucherid, points]) =>
          voucherService.updateVoucher(Number(voucherid), { pointsrequired: points })
        )
      )
      showToast('Cập nhật cấu hình điểm thành công', 'success')
      loadAllData()
    } catch (error) {
      showToast('Lỗi khi cập nhật cấu hình', 'error')
    }
  }

  const handleToggleWelcome = async (voucherid: number, isWelcome: boolean) => {
    try {
      await voucherService.toggleWelcomeVoucher(voucherid, !isWelcome)
      setWelcomeVouchers(prev =>
        isWelcome ? prev.filter(v => v !== voucherid) : [...prev, voucherid]
      )
      showToast(`${!isWelcome ? 'Thêm' : 'Bỏ'} voucher làm quà tặng thành công`, 'success')
    } catch (error) {
      showToast('Lỗi khi cập nhật', 'error')
    }
  }

  // ===== RENDER COMPONENTS =====
  const renderStatisticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl" style={{ backgroundColor: '#F4F7FE', border: '1px solid #E0E5F2' }}>
          <p className="text-xs text-gray-500 mb-2">Tổng Mã Voucher</p>
          <p className="text-2xl font-bold" style={{ color: '#4318FF' }}>{voucherStats.length}</p>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: '#EDFCF3', border: '1px solid #C8F7DC' }}>
          <p className="text-xs text-gray-500 mb-2">Tổng Phát Hành</p>
          <p className="text-2xl font-bold" style={{ color: '#00A869' }}>
            {voucherStats.reduce((sum, s) => sum + s.totalIssued, 0)}
          </p>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: '#FFF7E6', border: '1px solid #FFDBA3' }}>
          <p className="text-xs text-gray-500 mb-2">Tổng Sử Dụng</p>
          <p className="text-2xl font-bold" style={{ color: '#FF9900' }}>
            {voucherStats.reduce((sum, s) => sum + s.totalUsed, 0)}
          </p>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: '#EBF3FF', border: '1px solid #D1E0FF' }}>
          <p className="text-xs text-gray-500 mb-2">Tỷ Lệ Sử Dụng TB</p>
          <p className="text-2xl font-bold" style={{ color: '#4318FF' }}>
            {voucherStats.length > 0
              ? ((voucherStats.reduce((sum, s) => sum + s.totalUsed, 0) /
                   voucherStats.reduce((sum, s) => sum + s.totalIssued, 0)) *
                  100 || 0).toFixed(1)
              : '0'}
            %
          </p>
        </div>
      </div>

      <Card title="Danh Sách Mã Voucher">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F4F7FE', borderBottom: '1px solid #E0E5F2' }}>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Mã</th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Mô tả</th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Giảm Giá</th>
                <th className="text-center py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Phát</th>
                <th className="text-center py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Dùng</th>
                <th className="text-center py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Tỷ Lệ</th>
                <th className="text-center py-3 px-4 font-semibold" style={{ color: '#2B3674' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {voucherStats.map(stat => (
                <tr key={stat.voucherid} style={{ borderBottom: '1px solid #E0E5F2' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F7FE'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="py-3 px-4 font-medium" style={{ color: '#2B3674' }}>{stat.code}</td>
                  <td className="py-3 px-4" style={{ color: '#8F9CB8' }}>{stat.description}</td>
                  <td className="py-3 px-4" style={{ color: '#2B3674' }}>
                    {stat.discount} {stat.discounttype === 'percentage' ? '%' : 'đ'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold" style={{ color: '#4318FF' }}>{stat.totalIssued}</td>
                  <td className="py-3 px-4 text-center font-semibold" style={{ color: '#00A869' }}>{stat.totalUsed}</td>
                  <td className="py-3 px-4 text-center" style={{ color: '#FF9900' }}>{stat.usageRate}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                      backgroundColor: stat.isactive ? '#EDFCF3' : '#F0F0F0',
                      color: stat.isactive ? '#00A869' : '#999'
                    }}>
                      {stat.isactive ? 'Hoạt động' : 'Tạm ngừng'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderDistributionTab = () => (
    <div className="space-y-6">
      <Card title="Lọc Khách Hàng">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium" style={{ color: '#2B3674' }}>Tìm kiếm</label>
            <div className="mt-2 relative">
              <Search size={16} className="absolute left-3 top-3" style={{ color: '#8F9CB8' }} />
              <input
                type="text"
                placeholder="Tên, SĐT, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg"
                style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: '#2B3674' }}>Hạng VIP</label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {['Đồng', 'Bạc', 'Vàng'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setFilterMembership(prev =>
                    prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
                  )}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: filterMembership.includes(tier) ? '#4318FF' : '#F4F7FE',
                    color: filterMembership.includes(tier) ? '#FFFFFF' : '#2B3674',
                    border: `1px solid ${filterMembership.includes(tier) ? '#4318FF' : '#E0E5F2'}`
                  }}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: '#2B3674' }}>Chọn Voucher</label>
            <select
              value={selectedVoucher || ''}
              onChange={(e) => setSelectedVoucher(Number(e.target.value) || null)}
              className="w-full mt-2 px-3 py-2 border rounded-lg"
              style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
            >
              <option value="">-- Chọn voucher --</option>
              {vouchers.map(v => (
                <option key={v.voucherid} value={v.voucherid}>
                  {v.code} - {v.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card title="Lý Do Phát Hành">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'marketing', label: 'Marketing' },
            { value: 'birthday', label: 'Sinh nhật' },
            { value: 'vip', label: 'Hạng VIP' },
            { value: 'compensation', label: 'Đền bù' },
            { value: 'delaylate', label: 'Giao muộn' },
            { value: 'other', label: 'Khác' }
          ].map(r => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: reason === r.value ? '#4318FF' : '#F4F7FE',
                color: reason === r.value ? '#FFFFFF' : '#2B3674',
                border: `1px solid ${reason === r.value ? '#4318FF' : '#E0E5F2'}`
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title={`Danh Sách Khách (${selectedCustomers.length}/${filteredCustomers.length} được chọn)`}>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCustomers.map(customer => (
            <div
              key={customer.customerid}
              onClick={() => setSelectedCustomers(prev =>
                prev.includes(customer.customerid)
                  ? prev.filter(c => c !== customer.customerid)
                  : [...prev, customer.customerid]
              )}
              className="p-3 rounded-lg border cursor-pointer transition-all"
              style={{
                backgroundColor: selectedCustomers.includes(customer.customerid) ? '#EBF3FF' : '#FFFFFF',
                borderColor: selectedCustomers.includes(customer.customerid) ? '#4318FF' : '#E0E5F2'
              }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedCustomers.includes(customer.customerid)}
                  readOnly
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#4318FF' }}
                />
                <div className="flex-1">
                  <p className="font-medium" style={{ color: '#2B3674' }}>{customer.fullname}</p>
                  <p className="text-xs" style={{ color: '#8F9CB8' }}>{customer.phone} • {customer.email}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                  backgroundColor: customer.membership === 'Vàng' ? '#FFF7E6' : customer.membership === 'Bạc' ? '#F5F5F5' : '#F0F0F0',
                  color: customer.membership === 'Vàng' ? '#FF9900' : '#666'
                }}>
                  {customer.membership}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <button
          onClick={handleIssueVouchers}
          className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all"
          style={{ backgroundColor: '#4318FF', boxShadow: 'rgba(67, 24, 255, 0.3) 0px 8px 16px' }}
        >
          <Ticket size={18} className="inline mr-2" />
          Phát Hành Voucher
        </button>
        <button
          onClick={() => setSelectedCustomers([])}
          className="px-6 py-3 rounded-lg font-medium transition-all"
          style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
        >
          Đặt Lại
        </button>
      </div>
    </div>
  )

  const renderPointsConfigTab = () => (
    <Card title="Cấu Hình Điểm Đổi Voucher">
      <div className="space-y-3">
        {vouchers.map(voucher => (
          <div key={voucher.voucherid} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#F4F7FE', border: '1px solid #E0E5F2' }}>
            <div className="flex-1">
              <p className="font-medium" style={{ color: '#2B3674' }}>{voucher.code}</p>
              <p className="text-sm" style={{ color: '#8F9CB8' }}>{voucher.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Coins size={18} style={{ color: '#4318FF' }} />
              <input
                type="number"
                min="0"
                value={pointsConfig[voucher.voucherid] || 0}
                onChange={(e) => setPointsConfig(prev => ({
                  ...prev,
                  [voucher.voucherid]: Number(e.target.value)
                }))}
                className="w-24 px-3 py-2 border rounded-lg text-center"
                style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
              />
              <span style={{ color: '#8F9CB8' }}>điểm</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSavePointsConfig}
          className="px-6 py-3 rounded-lg font-medium text-white transition-all"
          style={{ backgroundColor: '#4318FF', boxShadow: 'rgba(67, 24, 255, 0.3) 0px 8px 16px' }}
        >
          <Save size={18} className="inline mr-2" />
          Lưu Cấu Hình
        </button>
      </div>
    </Card>
  )

  const renderWelcomeGiftTab = () => (
    <Card title="Quà Tặng Thành Viên Mới">
      <p className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#EDFCF3', color: '#00A869', borderLeft: '4px solid #00A869' }}>
        💝 Các mã này sẽ được tự động gửi vào ví của khách ngay khi họ đăng ký tài khoản thành công
      </p>

      <div className="space-y-3">
        {vouchers.map(voucher => (
          <div
            key={voucher.voucherid}
            className="flex items-center justify-between p-4 rounded-lg transition-all"
            style={{
              backgroundColor: welcomeVouchers.includes(voucher.voucherid) ? '#EBF3FF' : '#FFFFFF',
              border: `1px solid ${welcomeVouchers.includes(voucher.voucherid) ? '#4318FF' : '#E0E5F2'}`
            }}
          >
            <div className="flex-1">
              <p className="font-medium" style={{ color: '#2B3674' }}>{voucher.code}</p>
              <p className="text-sm" style={{ color: '#8F9CB8' }}>{voucher.description}</p>
              <p className="text-xs mt-1" style={{ color: '#FF9900' }}>
                Giảm {voucher.discount} {voucher.discounttype === 'percentage' ? '%' : 'đ'}
              </p>
            </div>

            <button
              onClick={() => handleToggleWelcome(voucher.voucherid, welcomeVouchers.includes(voucher.voucherid))}
              className="group relative"
            >
              {welcomeVouchers.includes(voucher.voucherid) ? (
                <ToggleRight size={32} style={{ color: '#4318FF' }} />
              ) : (
                <ToggleLeft size={32} style={{ color: '#E0E5F2' }} />
              )}
            </button>
          </div>
        ))}
      </div>

      {welcomeVouchers.length > 0 && (
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F4F7FE', border: '1px solid #E0E5F2' }}>
          <p className="text-sm font-medium" style={{ color: '#2B3674' }}>
            Tổng {welcomeVouchers.length} voucher được chọn làm quà tặng
          </p>
        </div>
      )}
    </Card>
  )

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-10 rounded-lg" style={{ backgroundColor: '#F4F7FE' }} />
        <div className="h-96 rounded-lg" style={{ backgroundColor: '#F4F7FE' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6" style={{ backgroundColor: '#F4F7FE', minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B3674' }}>Voucher & CRM</h1>
        <p style={{ color: '#8F9CB8' }}>Quản lý chiến dịch marketing và phát hành mã khuyến mại</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'statistics', label: 'Thống Kê Mã', icon: <BarChart3 size={18} /> },
          { id: 'distribution', label: 'Phát Hành Thông Minh', icon: <UserPlus size={18} /> },
          { id: 'pointsConfig', label: 'Cấu Hình Điểm', icon: <Coins size={18} /> },
          { id: 'welcomeGift', label: 'Quà Tặng Mới', icon: <Gift size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as keyof TabState)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? '#4318FF' : '#FFFFFF',
              color: activeTab === tab.id ? '#FFFFFF' : '#2B3674',
              border: `1px solid ${activeTab === tab.id ? '#4318FF' : '#E0E5F2'}`
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'statistics' && renderStatisticsTab()}
        {activeTab === 'distribution' && renderDistributionTab()}
        {activeTab === 'pointsConfig' && renderPointsConfigTab()}
        {activeTab === 'welcomeGift' && renderWelcomeGiftTab()}
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div
          className="fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 animate-pulse"
          style={{
            backgroundColor: toast.type === 'success' ? '#00A869' : toast.type === 'error' ? '#FF4444' : '#4318FF'
          }}
        >
          {toast.type === 'success' && <span>✅</span>}
          {toast.type === 'error' && <span>❌</span>}
          {toast.type === 'info' && <span>ℹ️</span>}
          {toast.message}
        </div>
      )}
    </div>
  )
}
