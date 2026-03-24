import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { voucherService } from '@/services/voucherService'
import type { VoucherStatistic, Voucher, Customer } from '@/services/voucherService'
import { supabase } from '@/utils/supabaseClient'
import Toast from '@/components/Toast'
import CreateVoucherModal from '@/components/CreateVoucherModal'
import { VouchersStatsTab } from '@/components/vouchers/VouchersStatsTab'
import { VouchersDistributionTab } from '@/components/vouchers/VouchersDistributionTab'
import { VouchersPointsTab } from '@/components/vouchers/VouchersPointsTab'
import { VouchersWelcomeTab } from '@/components/vouchers/VouchersWelcomeTab'

// Horizon UI Theme Colors
const COLORS = {
  bg: '#F4F7FE',
  card: '#FFFFFF',
  text: '#2B3674',
  textLight: '#A3AED0',
  primary: '#4318FF',
  success: '#00A869',
  successBg: '#EDFCF3',
  border: '#E0E5F2'
}

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
  const [pointsVouchers, setPointsVouchers] = useState<any[]>([])
  const [pointsConfig, setPointsConfig] = useState<Record<number, { pointsRequired: number; pointsValue: number }>>({})
  const [pointsSaving, setPointsSaving] = useState(false)
  const [editedPointsMappings, setEditedPointsMappings] = useState<Set<number>>(new Set())

  // Tab 4: Welcome Gift  
  const [welcomeVouchers, setWelcomeVouchers] = useState<any[]>([])
  const [welcomeLoading, setWelcomeLoading] = useState(false)
  const [welcomeSaving, setWelcomeSaving] = useState(false)

  // ===== TAB 1: STATISTICS =====
  const loadStatistics = async () => {
    setStatsLoading(true)
    try {
      const data = await voucherService.getAllVouchersWithStats()
      setStats(data)
    } catch (error) {
      console.error('[ERROR] Error loading stats:', error)
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
      console.error('[ERROR] Error loading customers:', error)
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
      setSelectedCustomers(new Set(customers.map(c => Number(c.customerid))))
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
        message: `[SUCCESS] Đã gửi voucher tới ${customerIds.length} khách hàng`,
        type: 'success'
      })
      setSelectedCustomers(new Set())
      loadStatistics()
    } catch (error) {
      console.error('[ERROR] Error issuing vouchers:', error)
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
      const config: Record<number, { pointsRequired: number; pointsValue: number }> = {}
      data.forEach((v: any) => {
        config[v.voucherid] = {
          pointsRequired: v.pointsrequired || 0,
          pointsValue: v.pointsvalue || 0
        }
      })
      setPointsConfig(config)
      setEditedPointsMappings(new Set())
    } catch (error) {
      console.error('[ERROR] Error loading vouchers:', error)
      setToast({ message: 'Lỗi tải danh sách voucher', type: 'error' })
    }
  }

  const handlePointsChange = (voucherid: number, field: string, value: number) => {
    setPointsConfig(prev => ({
      ...prev,
      [voucherid]: {
        ...prev[voucherid],
        [field]: value
      }
    }))
    setEditedPointsMappings(prev => new Set([...prev, voucherid]))
  }

  const handleSavePointsConfig = async () => {
    if (editedPointsMappings.size === 0) return

    setPointsSaving(true)
    try {
      const updates = Array.from(editedPointsMappings).map(vid => ({
        voucherid: vid,
        pointsrequired: pointsConfig[vid].pointsRequired || 0,
        pointsvalue: pointsConfig[vid].pointsValue || 0
      }))

      await voucherService.updateMultiplePointsConfig(updates)
      setToast({ message: '[SUCCESS] Lưu cấu hình thành công', type: 'success' })
      setEditedPointsMappings(new Set())
    } catch (error) {
      console.error('[ERROR] Error saving points:', error)
      setToast({ message: 'Lỗi lưu cấu hình: ' + (error as any).message, type: 'error' })
    } finally {
      setPointsSaving(false)
    }
  }

  // ===== TAB 4: WELCOME GIFT =====
  const loadWelcomeVouchers = async () => {
    setWelcomeLoading(true)
    try {
      const data = await voucherService.getAllVouchers()
      setWelcomeVouchers(data)
      
      // Auto-disable expired vouchers
      const now = new Date()
      const expiredActiveVouchers = data.filter(v => 
        v.iswelcome && new Date(v.expirydate) < now
      )
      
      if (expiredActiveVouchers.length > 0) {
        try {
          const updates = expiredActiveVouchers.map(v => ({
            voucherid: v.voucherid,
            iswelcome: false
          }))
          await Promise.all(updates.map(update =>
            supabase.from('vouchers').update({ iswelcome: false }).eq('voucherid', update.voucherid)
          ))
          
          // Update local state
          setWelcomeVouchers(prevVouchers =>
            prevVouchers.map(v =>
              expiredActiveVouchers.some(ev => ev.voucherid === v.voucherid)
                ? { ...v, iswelcome: false }
                : v
            )
          )
        } catch (error) {
          console.error('[ERROR] Error auto-disabling expired vouchers:', error)
        }
      }
    } catch (error) {
      console.error('[ERROR] Error loading vouchers:', error)
      setToast({ message: 'Lỗi tải quà tặng', type: 'error' })
    } finally {
      setWelcomeLoading(false)
    }
  }

  const handleToggleWelcome = async (voucherid: number) => {
    setWelcomeSaving(true)
    try {
      const currentVoucher = welcomeVouchers.find(v => v.voucherid === voucherid)
      const { error } = await supabase
        .from('vouchers')
        .update({ iswelcome: !currentVoucher?.iswelcome })
        .eq('voucherid', voucherid)

      if (error) throw error

      setToast({
        message: '[SUCCESS] Cập nhật trạng thái quà tặng thành công',
        type: 'success'
      })
      loadWelcomeVouchers()
    } catch (error) {
      console.error('[ERROR] Error toggling welcome:', error)
      setToast({ message: 'Lỗi cập nhật trạng thái: ' + (error as any).message, type: 'error' })
    } finally {
      setWelcomeSaving(false)
    }
  }

  // Handle create new voucher
  const handleCreateVoucherSuccess = (newVoucher: Voucher) => {
    setToast({ 
      message: `[SUCCESS] Tạo voucher ${newVoucher.code} thành công!`, 
      type: 'success' 
    })
    loadStatistics()
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
          <VouchersStatsTab
            stats={stats}
            isLoading={statsLoading}
          />
        )}

        {/* TAB 2: DISTRIBUTION */}
        {activeTab === 'distribution' && (
          <VouchersDistributionTab
            customers={customers}
            selectedCustomers={selectedCustomers}
            selectedVoucher={selectedVoucher}
            selectedReason={selectedReason}
            searchTerm={searchTerm}
            membershipFilter={membershipFilter}
            isLoading={distLoading}
            isIssuing={issuing}
            stats={stats}
            onCustomerToggle={toggleCustomer}
            onToggleAll={toggleAllCustomers}
            onVoucherChange={setSelectedVoucher}
            onReasonChange={setSelectedReason}
            onSearchChange={setSearchTerm}
            onFilterChange={setMembershipFilter}
            onIssue={handleIssueVouchers}
          />
        )}

        {/* TAB 3: POINTS */}
        {activeTab === 'points' && (
          <VouchersPointsTab
            mappings={pointsVouchers.map(v => ({
              voucherid: v.voucherid,
              code: v.code,
              title: v.title,
              pointsRequired: pointsConfig[v.voucherid]?.pointsRequired || 0,
              pointsValue: pointsConfig[v.voucherid]?.pointsValue || 0
            }))}
            isLoading={false}
            isSaving={pointsSaving}
            onMappingChange={handlePointsChange}
            onSave={handleSavePointsConfig}
          />
        )}

        {/* TAB 4: WELCOME */}
        {activeTab === 'welcome' && (
          <VouchersWelcomeTab
            vouchers={welcomeVouchers.map(v => ({
              voucherid: v.voucherid,
              code: v.code,
              title: v.title,
              discount: v.discount || v.discountpercent || 0,
              expirydate: v.expirydate || '',
              isAssignedToWelcome: v.iswelcome || false
            }))}
            isLoading={welcomeLoading}
            isSaving={welcomeSaving}
            onToggle={handleToggleWelcome}
            onSave={() => {}}
          />
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
