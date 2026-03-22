import { supabase } from '@/utils/supabaseClient'

// ===== INTERFACES SCHEMA CHÍNH XÁC =====
export interface Voucher {
  voucherid: number
  code: string
  title: string
  discountvalue: number
  maxdiscount: number
  minordervalue: number
  discounttype: '%' | 'Tiền mặt'
  expirydate: string
  iswelcome: boolean
  pointsrequired: number
  created_at: string
}

export interface CustomerVoucher {
  custvoucherid: number
  customerid: number
  voucherid: number
  status: 'Chưa dùng' | 'Đã dùng' | 'Hết hạn'
  reason: string
  receiveddate: string
  useddate?: string | null
}

export interface VoucherStatistic {
  voucherid: number
  code: string
  title: string
  discountvalue: number
  discounttype: string
  expirydate: string
  issuedCount: number
  usedCount: number
  usageRate: string
  pointsrequired: number
  iswelcome: boolean
}

export interface Customer {
  customerid: number
  fullname: string
  phone: string
  email: string
  totalpoints: number
  membership: 'Đồng' | 'Bạc' | 'Vàng'
}

export const voucherService = {
  // ===== TAB 1: VOUCHERS MANAGEMENT =====
  async getAllVouchersWithStats(): Promise<VoucherStatistic[]> {
    try {
      // Fetch all vouchers
      const { data: vouchersData, error: vErr } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false })

      if (vErr) throw vErr

      // Fetch stats for each voucher using Promise.all for optimization
      const stats = await Promise.all(
        (vouchersData || []).map(async (voucher: Voucher) => {
          const { count: issuedCount, error: issErr } = await supabase
            .from('customervouchers')
            .select('*', { count: 'exact', head: true })
            .eq('voucherid', voucher.voucherid)

          const { count: usedCount, error: useErr } = await supabase
            .from('customervouchers')
            .select('*', { count: 'exact', head: true })
            .eq('voucherid', voucher.voucherid)
            .eq('status', 'Đã dùng')

          if (issErr || useErr) throw issErr || useErr

          const issued = issuedCount || 0
          const used = usedCount || 0
          const rate = issued > 0 ? ((used / issued) * 100).toFixed(2) : '0'

          return {
            voucherid: voucher.voucherid,
            code: voucher.code,
            title: voucher.title,
            discountvalue: voucher.discountvalue,
            discounttype: voucher.discounttype,
            expirydate: voucher.expirydate,
            issuedCount: issued,
            usedCount: used,
            usageRate: `${rate}%`,
            pointsrequired: voucher.pointsrequired,
            iswelcome: voucher.iswelcome
          } as VoucherStatistic
        })
      )

      return stats
    } catch (error) {
      console.error('❌ Error fetching vouchers with stats:', error)
      throw error
    }
  },

  async getAllVouchers(): Promise<Voucher[]> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching all vouchers:', error)
      throw error
    }
  },

  async getVoucherById(voucherid: number): Promise<Voucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('voucherid', voucherid)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('❌ Error fetching voucher:', error)
      return null
    }
  },

  async createVoucher(voucherData: Omit<Voucher, 'voucherid' | 'created_at'>): Promise<Voucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .insert([{
          code: voucherData.code,
          title: voucherData.title,
          discountvalue: voucherData.discountvalue,
          maxdiscount: voucherData.maxdiscount,
          minordervalue: voucherData.minordervalue,
          discounttype: voucherData.discounttype,
          expirydate: voucherData.expirydate,
          iswelcome: voucherData.iswelcome,
          pointsrequired: voucherData.pointsrequired
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error creating voucher:', error)
      throw error
    }
  },

  // ===== TAB 2: SMART DISTRIBUTION (CRM) =====
  async getCustomersByFilters(filters: {
    membership?: string[]
    searchTerm?: string
  }): Promise<Customer[]> {
    try {
      let query = supabase
        .from('customers')
        .select('customerid, fullname, phone, email, totalpoints, membership')

      // Filter by membership tiers
      if (filters.membership && filters.membership.length > 0) {
        query = query.in('membership', filters.membership)
      }

      // Search by name/phone/email
      if (filters.searchTerm) {
        query = query.or(
          `fullname.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Customer[]
    } catch (error) {
      console.error('❌ Error filtering customers:', error)
      throw error
    }
  },

  async issueVouchersToCustomers(
    customerIds: number[],
    voucherid: number,
    reason: string
  ): Promise<{ success: number; failed: number }> {
    try {
      const now = new Date().toISOString()
      const records = customerIds.map(customerid => ({
        customerid,
        voucherid,
        status: 'Chưa dùng',
        reason,
        receiveddate: now,
        useddate: null
      }))

      const { error } = await supabase
        .from('customervouchers')
        .insert(records)

      if (error) throw error

      return { success: customerIds.length, failed: 0 }
    } catch (error) {
      console.error('❌ Error issuing vouchers:', error)
      throw error
    }
  },

  // ===== TAB 3: POINTS CONFIGURATION =====
  async updatePointsRequired(voucherid: number, pointsrequired: number): Promise<Voucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .update({ pointsrequired })
        .eq('voucherid', voucherid)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error updating points:', error)
      throw error
    }
  },

  async updateMultiplePointsConfig(updates: Array<{ voucherid: number; pointsrequired: number }>): Promise<boolean> {
    try {
      await Promise.all(
        updates.map(({ voucherid, pointsrequired }) =>
          supabase
            .from('vouchers')
            .update({ pointsrequired })
            .eq('voucherid', voucherid)
        )
      )
      return true
    } catch (error) {
      console.error('❌ Error updating multiple points:', error)
      throw error
    }
  },

  // ===== TAB 4: WELCOME GIFT =====
  async getWelcomeVouchers(): Promise<Voucher[]> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('iswelcome', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching welcome vouchers:', error)
      throw error
    }
  },

  async toggleWelcomeVoucher(voucherid: number, iswelcome: boolean): Promise<Voucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .update({ iswelcome })
        .eq('voucherid', voucherid)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error toggling welcome status:', error)
      throw error
    }
  },

  // ===== UTILITIES =====
  isVoucherValid(expirydate: string): boolean {
    try {
      return new Date(expirydate) > new Date()
    } catch {
      return false
    }
  },

  formatVoucherExpiry(expirydate: string): string {
    try {
      return new Date(expirydate).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }
}
