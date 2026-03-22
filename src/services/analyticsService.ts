import { supabase } from '@/utils/supabaseClient'
import { Review } from '@/types'

/**
 * ============================================
 * 📊 ANALYTICS SERVICE - PHÂN TÍCH & AI
 * ============================================
 */

export interface RevenueData {
  date: string
  revenue: number
}

export interface SentimentStats {
  positive: number
  negative: number
  neutral: number
}

export const analyticsService = {
  /**
   * Lấy dữ liệu doanh thu 7 ngày gần nhất
   */
  async getRevenueLastDays(days: number = 7): Promise<RevenueData[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('orders')
        .select('orderdate, finalamount')
        .gte('orderdate', startDate.toISOString())
        .eq('status', 'Xong')
        .order('orderdate', { ascending: true })

      if (error) throw error

      // Group by date and sum revenue
      const grouped: { [key: string]: number } = {}
      ;(data || []).forEach((order: any) => {
        const date = new Date(order.orderdate).toLocaleDateString('vi-VN')
        grouped[date] = (grouped[date] || 0) + (order.finalamount || 0)
      })

      // Convert to array
      return Object.entries(grouped).map(([date, revenue]) => ({
        date,
        revenue,
      }))
    } catch (error) {
      console.error('❌ Error fetching revenue data:', error)
      throw error
    }
  },

  /**
   * Lấy danh sách đánh giá với sentiment
   */
  async getReviewsWithSentiment(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          reviewid,
          rating,
          comment,
          createdat,
          customerid,
          orderid,
          productid,
          sentiment,
          products(name)
        `)
        .order('createdat', { ascending: false })
        .limit(50)

      if (error) throw error

      return (data || []).map((item: any) => ({
        reviewid: item.reviewid,
        rating: item.rating,
        comment: item.comment,
        createdat: item.createdat,
        customerid: item.customerid,
        orderid: item.orderid,
        productid: item.productid,
        sentiment: item.sentiment || 'Trung lập',
        product: item.products,
      })) as Review[]
    } catch (error) {
      console.error('❌ Error fetching reviews:', error)
      throw error
    }
  },

  /**
   * Lấy thống kê sentiment
   */
  async getSentimentStats(): Promise<SentimentStats> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('sentiment')

      if (error) throw error

      const stats: SentimentStats = {
        positive: 0,
        negative: 0,
        neutral: 0,
      }

      ;(data || []).forEach((review: any) => {
        const sentiment = review.sentiment
        if (sentiment === 'Tích cực') stats.positive++
        else if (sentiment === 'Tiêu cực') stats.negative++
        else stats.neutral++
      })

      return stats
    } catch (error) {
      console.error('❌ Error fetching sentiment stats:', error)
      throw error
    }
  },

  /**
   * Lấy AI Insight (mock logic)
   */
  async getAIInsight(): Promise<string> {
    try {
      const stats = await analyticsService.getSentimentStats()
      const totalReviews = stats.positive + stats.negative + stats.neutral

      if (totalReviews === 0) {
        return 'Chưa có đánh giá từ khách hàng'
      }

      const positivePercent = Math.round((stats.positive / totalReviews) * 100)
      const negativePercent = Math.round((stats.negative / totalReviews) * 100)

      if (positivePercent > 80) {
        return `🌟 Tuyệt vời! ${positivePercent}% khách hàng rất hài lòng với sản phẩm và dịch vụ của bạn. Tiếp tục duy trì chất lượng cao!`
      } else if (positivePercent > 60) {
        return `😊 Khá tốt. ${positivePercent}% khách hàng hài lòng. Hãy chú ý đến ${negativePercent}% phản hồi tiêu cực để cải thiện.`
      } else if (positivePercent > 40) {
        return `⚠️ Cần cải thiện. Chỉ ${positivePercent}% khách hàng hài lòng. Hãy phân tích nguyên nhân ${negativePercent}% phản hồi tiêu cực.`
      } else {
        return `🔴 Cảnh báo! Nhiều khách hàng không hài lòng (${negativePercent}%). Cần hành động ngay để cải thiện chất lượng.`
      }
    } catch (error) {
      console.error('❌ Error generating AI insight:', error)
      return 'Không thể tạo phân tích'
    }
  },
}
