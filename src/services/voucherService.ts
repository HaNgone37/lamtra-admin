import { supabase } from '@/utils/supabaseClient'
import type { Voucher, CustomerVoucher, VoucherStatistic, Customer } from '@/types'

// Re-export types for backward compatibility
export type { Voucher, CustomerVoucher, VoucherStatistic, Customer }

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
            scope: voucher.scope || 'Toàn chuỗi',
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
          scope: voucherData.scope || 'Toàn chuỗi',
          expirydate: voucherData.expirydate,
          iswelcome: voucherData.iswelcome || false,
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
  },

  // ═════════════════════════════════════════════════════════════════
  // POS VOUCHER VALIDATION - STAFF POS (Kiểm tra mã với phân loại scope)
  // ═════════════════════════════════════════════════════════════════

  /**
   * Lấy tất cả voucher công khai (scope === 'Toàn chuỗi')
   * Dùng cho dropdown 'Chọn nhanh ưu đãi'
   */
  async getPublicVouchers(): Promise<Voucher[]> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('scope', 'Toàn chuỗi')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Lọc voucher còn hạn
      return (data || []).filter(v => this.isVoucherValid(v.expirydate))
    } catch (error) {
      console.error('❌ Error fetching public vouchers:', error)
      return []
    }
  },

  /**
   * Lấy voucher cá nhân của khách (scope === 'Cá nhân')
   * Fetch từ bảng customervouchers
   */
  async getCustomerPersonalVouchers(customerId: number): Promise<Voucher[]> {
    try {
      const { data, error } = await supabase
        .from('customervouchers')
        .select('vouchers(*)')
        .eq('customerid', customerId)
        .eq('status', 'Chưa dùng')

      if (error) throw error

      // Lọc voucher còn hạn
      const vouchers = (data || [])
        .map((cv: any) => cv.vouchers)
        .filter(v => v && v.scope === 'Cá nhân' && this.isVoucherValid(v.expirydate))

      return vouchers
    } catch (error) {
      console.error('❌ Error fetching customer personal vouchers:', error)
      return []
    }
  },

  /**
   * Kiểm tra voucher theo mã với hỗ trợ scope
   * - Nếu voucher là 'Toàn chuỗi' => Áp dụng luôn
   * - Nếu voucher là 'Cá nhân' => PHẢI check xem khách có sở hữu không
   * 🔒 BẢOMẬT: Msg lỗi rõ ràng nếu không sở hữu
   */
  async validateVoucherCodeWithScope(
    voucherCode: string,
    customerId?: number | null
  ): Promise<{
    valid: boolean
    voucher?: Voucher
    error?: string
    discountAmount?: number
  }> {
    try {
      // Tìm voucher theo mã
      const { data: voucherData, error: vErr } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .single()

      if (vErr || !voucherData) {
        return { valid: false, error: 'Mã voucher không tồn tại' }
      }

      // Kiểm tra hạn
      if (!this.isVoucherValid(voucherData.expirydate)) {
        return { valid: false, error: 'Mã voucher đã hết hạn' }
      }

      // Nếu voucher là công khai (Toàn chuỗi) => Áp dụng luôn (không cần khách)
      if (voucherData.scope === 'Toàn chuỗi') {
        return {
          valid: true,
          voucher: voucherData,
          discountAmount: voucherData.discountvalue
        }
      }

      // Nếu voucher là cá nhân (Cá nhân) => PHẢI check xem khách có sở hữu không
      if (voucherData.scope === 'Cá nhân') {
        if (!customerId) {
          return {
            valid: false,
            error: 'BẢOMẬT: Voucher này không thuộc quyền sở hữu của khách hàng!'
          }
        }

        // Check xem khách có sở hữu voucher này không
        const { data: customerVoucherData, error: cvErr } = await supabase
          .from('customervouchers')
          .select('*')
          .eq('customerid', customerId)
          .eq('voucherid', voucherData.voucherid)
          .eq('status', 'Chưa dùng')
          .single()

        if (cvErr || !customerVoucherData) {
          return {
            valid: false,
            error: 'BẢOMẬT: Voucher này không thuộc quyền sở hữu của khách hàng!'
          }
        }

        return {
          valid: true,
          voucher: voucherData,
          discountAmount: voucherData.discountvalue
        }
      }

      // Scope không hợp lệ
      return { valid: false, error: 'Voucher không hợp lệ' }
    } catch (error) {
      console.error('❌ Error validating voucher code with scope:', error)
      return { valid: false, error: 'Lỗi kiểm tra voucher' }
    }
  },

  /**
   * Phương thức legacy - giữ để backward compatible
   */
  async validateVoucherCode(voucherCode: string): Promise<{
    valid: boolean
    voucher?: Voucher
    error?: string
    discountAmount?: number
  }> {
    // Gọi method mới mà không có customerId
    return this.validateVoucherCodeWithScope(voucherCode, null)
  },

  async getManyVouchers(voucherIds: number[]): Promise<Voucher[]> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .in('voucherid', voucherIds)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching multiple vouchers:', error)
      return []
    }
  }
}
