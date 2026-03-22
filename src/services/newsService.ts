import { supabase } from '@/utils/supabaseClient'
import { News } from '@/types'

/**
 * ============================================
 * 📰 NEWS SERVICE - QUẢN LÝ BÀI VIẾT
 * ============================================
 */

export const newsService = {
  /**
   * Lấy tất cả bài viết
   */
  async getAllNews(): Promise<News[]> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('publisheddate', { ascending: false })

      if (error) throw error
      return (data || []) as News[]
    } catch (error) {
      console.error('❌ Error fetching news:', error)
      throw error
    }
  },

  /**
   * Lấy bài viết theo loại (type)
   */
  async getNewsByType(type: 'Khuyến mãi' | 'Tuyển dụng' | 'Tin tức'): Promise<News[]> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('type', type)
        .eq('status', 'Hiện')
        .order('publisheddate', { ascending: false })

      if (error) throw error
      return (data || []) as News[]
    } catch (error) {
      console.error('❌ Error fetching news by type:', error)
      throw error
    }
  },

  /**
   * Lấy bài viết hiển thị công khai
   */
  async getPublicNews(): Promise<News[]> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'Hiện')
        .order('publisheddate', { ascending: false })

      if (error) throw error
      return (data || []) as News[]
    } catch (error) {
      console.error('❌ Error fetching public news:', error)
      throw error
    }
  },

  /**
   * Tạo bài viết mới (chỉ Super Admin)
   */
  async createNews(news: Omit<News, 'newsid'>): Promise<News> {
    try {
      const { data, error } = await supabase
        .from('news')
        .insert([{
          title: news.title,
          content: news.content,
          type: news.type,
          status: news.status,
          publisheddate: news.publisheddate,
          thumbnail: news.thumbnail,
        }])
        .select()
        .single()

      if (error) throw error
      return data as News
    } catch (error) {
      console.error('❌ Error creating news:', error)
      throw error
    }
  },

  /**
   * Cập nhật bài viết (chỉ Super Admin)
   */
  async updateNews(newsId: string, updates: Partial<News>): Promise<News> {
    try {
      const { data, error } = await supabase
        .from('news')
        .update({
          title: updates.title,
          content: updates.content,
          type: updates.type,
          status: updates.status,
          publisheddate: updates.publisheddate,
          thumbnail: updates.thumbnail,
        })
        .eq('newsid', newsId)
        .select()
        .single()

      if (error) throw error
      return data as News
    } catch (error) {
      console.error('❌ Error updating news:', error)
      throw error
    }
  },

  /**
   * Xóa bài viết (chỉ Super Admin)
   */
  async deleteNews(newsId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('newsid', newsId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Error deleting news:', error)
      throw error
    }
  },

  /**
   * Thay đổi trạng thái hiển thị
   */
  async toggleNewsStatus(newsId: string, status: 'Hiện' | 'Ẩn'): Promise<News> {
    try {
      const { data, error } = await supabase
        .from('news')
        .update({ status })
        .eq('newsid', newsId)
        .select()
        .single()

      if (error) throw error
      return data as News
    } catch (error) {
      console.error('❌ Error toggling news status:', error)
      throw error
    }
  },
}
