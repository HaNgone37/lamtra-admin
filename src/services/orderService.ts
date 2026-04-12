import { supabase } from '@/utils/supabaseClient'
import { Order, OrderDetail } from '@/types'

// ═════════════════════════════════════════════════════════════════
// ORDER SERVICE LAYER - Full CRUD + Real-time + POS/KDS Operations
// ═════════════════════════════════════════════════════════════════

interface CreateOrderPayload {
  branchid: number
  customerid?: number | null
  totalamount: number
  discountamount: number
  shippingfee: number
  finalamount: number
  paymentmethod: 'Tiền mặt' | 'Chuyển khoản'
  ordertype: 'Tại chỗ' | 'Giao hàng'
  note?: string
  address_detail?: string | null
  customer_latitude?: number | null
  customer_longitude?: number | null
  city?: string | null
  ward?: string | null
}

interface OrderDetailPayload {
  orderid: string
  productid: number
  sizeid: number
  quantity: number
  sugarlevel: string
  icelevel: string
  priceatorder: number
  subtotal: number
  toppings?: Array<{ toppingid: number; quantity: number }>
}

export const orderService = {
  // ─────────────────────────────────────────────────────────────
  // READ OPERATIONS
  // ─────────────────────────────────────────────────────────────

  async getOrders(branchId?: string): Promise<Order[]> {
    try {
      let query = supabase
        .from('orders')
        .select('*, customers:customerid(fullname, phone), branches:branchid(name)')
      
      if (branchId) {
        const safeBranchId = String(branchId).trim()
        console.log('[OrderService] Fetching orders for branchId:', safeBranchId)
        query = query.eq('branchid', safeBranchId)
      }
      
      const { data, error } = await query.order('orderdate', { ascending: false })
      
      if (error) {
        console.error('[OrderService] Error fetching orders:', error)
        throw error
      }
      
      console.log('[OrderService] Total orders fetched:', data?.length, 'guest orders:', data?.filter(o => !o.customerid).length)
      return data || []
    } catch (error) {
      console.error('❌ Error fetching orders:', error)
      throw error
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers:customerid(fullname, phone, totalpoints, membership), branches:branchid(name)')
        .eq('orderid', orderId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('❌ Error fetching order:', error)
      throw error
    }
  },

  async getOrderDetails(orderId: string): Promise<OrderDetail[]> {
    try {
      const { data, error } = await supabase
        .from('orderdetails')
        .select('*, products:productid(name), sizes:sizeid(name)')
        .eq('orderid', orderId)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching order details:', error)
      throw error
    }
  },

  async getOrderToppings(orderDetailId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ordertoppings')
        .select('*, toppings:toppingid(name, price)')
        .eq('orderdetailid', orderDetailId)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching order toppings:', error)
      throw error
    }
  },

  async getOrdersByStatusAndBranch(branchId: number, status: string): Promise<Order[]> {
    try {
      // Ensure branchId is a number and status is a proper string
      const safeBranchId = Number(branchId)
      const safeStatus = String(status).trim()
      
      console.log('[OrderService] Fetching orders - branchId:', safeBranchId, 'status:', safeStatus)
      
      // Fetch orders with full nested details
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customerid(fullname, phone),
          branches:branchid(name),
          orderdetails(
            *,
            products(name, subtitle),
            sizes(name),
            ordertoppings(toppingid, quantity, toppings(name, price))
          )
        `)
        .eq('branchid', safeBranchId)
        .eq('status', safeStatus)
        .order('orderdate', { ascending: false })
      
      if (error) {
        console.error('[OrderService] Query error:', error)
        throw error
      }
      
      console.log('[OrderService] Fetched orders count:', data?.length, 'with', data?.filter(o => !o.customerid).length, 'guest orders')
      if (data && data.length > 0) {
        console.log('[OrderService] Sample order details:', { 
          orderid: data[0].orderid, 
          numDetails: data[0].orderdetails?.length,
          firstDetail: data[0].orderdetails?.[0]
        })
      }
      return data || []
    } catch (error) {
      console.error('❌ Error fetching orders by status:', error)
      throw error
    }
  },

  // ─────────────────────────────────────────────────────────────
  // CREATE OPERATIONS
  // ─────────────────────────────────────────────────────────────

  async createOrder(payload: CreateOrderPayload): Promise<string> {
    try {
      // BẮT BUỘC: customerid phải là null thật chứ không phải string "null"
      let finalCustomerId: number | null = null
      if (payload.customerid !== undefined && payload.customerid !== null) {
        finalCustomerId = Number(payload.customerid)
      }
      
      console.log('[OrderService] Creating order - customerid:', finalCustomerId, '(type:', typeof finalCustomerId, ') | guest:', finalCustomerId === null, ')')
      
      // Generate Order ID: LT-{timestamp}
      const orderId = 'LT-' + Date.now()

      const orderData = {
        orderid: orderId,
        branchid: Number(payload.branchid),
        customerid: finalCustomerId,
        totalamount: payload.totalamount,
        discountamount: payload.discountamount,
        shippingfee: payload.shippingfee,
        finalamount: payload.finalamount,
        paymentmethod: payload.paymentmethod,
        ordertype: payload.ordertype,
        status: 'Đang làm',
        note: payload.note || null,
        address_detail: payload.address_detail || null,
        customer_latitude: payload.customer_latitude || null,
        customer_longitude: payload.customer_longitude || null,
        city: payload.city || null,
        ward: payload.ward || null,
        orderdate: new Date().toISOString()
      }
      
      console.log('[OrderService] Insert payload:', { orderid: orderId, branchid: payload.branchid, customerid: finalCustomerId, ordertype: payload.ordertype, shippingfee: payload.shippingfee, status: 'Đang làm', orderdate: orderData.orderdate })

      // Đơn giản: cứ insert và trả về orderId, đừng select lại
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (error) {
        console.error('[OrderService] ❌ Insert failed:', { error: error.message, code: error.code, details: error.details })
        throw new Error('Failed to create order: ' + (error.message || 'Unknown error'))
      }
      
      console.log('[OrderService] ✅ Order created:', { orderId, customerid: finalCustomerId, status: data?.status })
      return orderId
    } catch (error) {
      console.error('[OrderService] ❌ Error creating order:', error instanceof Error ? error.message : String(error))
      throw error
    }
  },

  async addOrderDetail(detail: OrderDetailPayload): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('orderdetails')
        .insert([{
          orderid: detail.orderid,
          productid: detail.productid,
          sizeid: detail.sizeid,
          quantity: detail.quantity,
          sugarlevel: detail.sugarlevel,
          icelevel: detail.icelevel,
          priceatorder: detail.priceatorder,
          subtotal: detail.subtotal
        }])
        .select()
        .single()

      if (error) throw error

      // Add toppings if any
      if (detail.toppings && detail.toppings.length > 0) {
        for (const topping of detail.toppings) {
          await supabase.from('ordertoppings').insert([{
            orderdetailid: data.orderdetailid,
            toppingid: topping.toppingid,
            quantity: topping.quantity
          }])
        }
      }

      return data.orderdetailid
    } catch (error) {
      console.error('❌ Error adding order detail:', error)
      throw error
    }
  },

  // ─────────────────────────────────────────────────────────────
  // UPDATE OPERATIONS
  // ─────────────────────────────────────────────────────────────

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('orderid', orderId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      throw error
    }
  },

  async updateOrder(orderId: string, updates: Partial<CreateOrderPayload>): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('orderid', orderId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error updating order:', error)
      throw error
    }
  },

  // ─────────────────────────────────────────────────────────────
  // DELETE OPERATIONS
  // ─────────────────────────────────────────────────────────────

  async deleteOrder(orderId: string): Promise<void> {
    try {
      // Delete order toppings
      const orderDetails = await this.getOrderDetails(orderId)
      for (const detail of orderDetails) {
        await supabase.from('ordertoppings').delete().eq('orderdetailid', detail.orderdetailid)
      }

      // Delete order details
      await supabase.from('orderdetails').delete().eq('orderid', orderId)

      // Delete order
      const { error } = await supabase.from('orders').delete().eq('orderid', orderId)
      if (error) throw error
    } catch (error) {
      console.error('❌ Error deleting order:', error)
      throw error
    }
  },

  // ─────────────────────────────────────────────────────────────
  // REAL-TIME SUBSCRIPTIONS (KDS)
  // ─────────────────────────────────────────────────────────────

  subscribeToOrders(branchId: number, callback?: (payload: any) => void) {
    return supabase
      .channel(`orders-${branchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `branchid=eq.${branchId}`
      }, (payload) => {
        if (callback) callback(payload)
      })
      .subscribe()
  },

  unsubscribeFromOrders(subscription: any) {
    return supabase.removeChannel(subscription)
  }
}
