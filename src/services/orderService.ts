import { supabase } from '@/utils/supabaseClient'
import { Order, OrderDetail } from '@/types'

export const orderService = {
  async getOrders(branchId?: string): Promise<Order[]> {
    try {
      let query = supabase.from('orders').select('*')
      
      if (branchId) {
        query = query.eq('branchid', branchId)
      }
      
      const { data, error } = await query.order('orderdate', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('orderid', orderId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching order:', error)
      throw error
    }
  },

  async getOrderDetails(orderId: string): Promise<OrderDetail[]> {
    try {
      const { data, error } = await supabase
        .from('orderdetails')
        .select('*')
        .eq('orderid', orderId)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching order details:', error)
      throw error
    }
  },

  async createOrder(order: Omit<Order, 'orderid'>): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  },

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
      console.error('Error updating order status:', error)
      throw error
    }
  },

  subscribeToOrders(_branchId?: string, callback?: (payload: any) => void) {
    let subscription = supabase
      .channel('orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        if (callback) callback(payload)
      })
      .subscribe()
    
    return subscription
  }
}
