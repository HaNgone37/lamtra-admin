import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText } from 'lucide-react'
import { newsService } from '@/services/newsService'
import { News } from '@/types'
import Toast from '@/components/Toast'

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
  background: '#F3F4F6',
  lightBg: '#F4F7FE',
}

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [filteredNews, setFilteredNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([])
  const [activeFilter, setActiveFilter] = useState<'Tất cả' | 'Khuyến mãi' | 'Tuyển dụng' | 'Tin tức'>('Tất cả')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'Tin tức' as 'Khuyến mãi' | 'Tuyển dụng' | 'Tin tức',
    thumbnail: '',
    status: 'Hiện' as 'Hiện' | 'Ẩn',
  })

  // ===== Initialize =====
  useEffect(() => {
    loadNews()
  }, [])

  // ===== Filter =====
  useEffect(() => {
    if (activeFilter === 'Tất cả') {
      setFilteredNews(news)
    } else {
      setFilteredNews(news.filter(n => n.type === activeFilter))
    }
  }, [news, activeFilter])

  // ===== Load News =====
  const loadNews = async () => {
    try {
      setLoading(true)
      const data = await newsService.getAllNews()
      setNews(data)
    } catch (error) {
      console.error('Error loading news:', error)
      addToast('Lỗi tải bài viết', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== Save News =====
  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      addToast('Vui lòng điền tiêu đề và nội dung', 'error')
      return
    }

    try {
      setLoading(true)

      if (editingNews) {
        // Update
        const updated = await newsService.updateNews(editingNews.newsid, {
          title: form.title,
          content: form.content,
          type: form.type,
          thumbnail: form.thumbnail,
          status: form.status,
          publisheddate: editingNews.publisheddate,
        })
        setNews(news.map(n => (n.newsid === updated.newsid ? updated : n)))
        addToast('Cập nhật bài viết thành công', 'success')
      } else {
        // Create
        const created = await newsService.createNews({
          title: form.title,
          content: form.content,
          type: form.type,
          thumbnail: form.thumbnail,
          status: form.status,
          publisheddate: new Date().toISOString(),
        })
        setNews([...news, created])
        addToast('Tạo bài viết thành công', 'success')
      }

      setShowForm(false)
      setEditingNews(null)
      setForm({
        title: '',
        content: '',
        type: 'Tin tức',
        thumbnail: '',
        status: 'Hiện',
      })
    } catch (error) {
      console.error('Error saving news:', error)
      addToast('Lỗi lưu bài viết', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== Delete News =====
  const handleDelete = async (newsId: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa?')) return

    try {
      setLoading(true)
      await newsService.deleteNews(newsId)
      setNews(news.filter(n => n.newsid !== newsId))
      addToast('Xóa bài viết thành công', 'success')
    } catch (error) {
      console.error('Error deleting news:', error)
      addToast('Lỗi xóa bài viết', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== Toggle Status =====
  const handleToggleStatus = async (newsId: string, currentStatus: 'Hiện' | 'Ẩn') => {
    try {
      setLoading(true)
      const newStatus = currentStatus === 'Hiện' ? 'Ẩn' : 'Hiện'
      const updated = await newsService.toggleNewsStatus(newsId, newStatus)
      setNews(news.map(n => (n.newsid === updated.newsid ? updated : n)))
      addToast(`Đã ${newStatus === 'Hiện' ? 'hiển thị' : 'ẩn'} bài viết`, 'success')
    } catch (error) {
      console.error('Error toggling status:', error)
      addToast('Lỗi cập nhật trạng thái', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== Edit News =====
  const handleEdit = (item: News) => {
    setEditingNews(item)
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      thumbnail: item.thumbnail,
      status: item.status,
    })
    setShowForm(true)
  }

  // ===== Toast =====
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString()
    setToastMessages(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToastMessages(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: colors.text, fontSize: '32px', fontWeight: '700', margin: 0 }}>
          📰 Quản lý Bài viết
        </h1>
        <p style={{ color: colors.textLight, fontSize: '14px', margin: '8px 0 0 0' }}>
          Tạo, chỉnh sửa, và quản lý nội dung trên trang website
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['Tất cả', 'Khuyến mãi', 'Tuyển dụng', 'Tin tức'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as any)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              background:
                activeFilter === filter ? colors.primary : colors.background,
              color: activeFilter === filter ? 'white' : colors.text,
              cursor: 'pointer',
              fontWeight: activeFilter === filter ? '600' : '500',
              fontSize: '14px',
              transition: 'all 0.3s ease',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => {
            setEditingNews(null)
            setForm({
              title: '',
              content: '',
              type: 'Tin tức',
              thumbnail: '',
              status: 'Hiện',
            })
            setShowForm(true)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          <Plus size={18} />
          Tạo bài viết
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          border: `1px solid ${colors.border}`,
          boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h2 style={{ color: colors.text, marginTop: 0 }}>
            {editingNews ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
              Tiêu đề:
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tiêu đề bài viết"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
              Nội dung:
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Nhập nội dung bài viết"
              rows={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
                Loại:
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="Khuyến mãi">Khuyến mãi</option>
                <option value="Tuyển dụng">Tuyển dụng</option>
                <option value="Tin tức">Tin tức</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
                Trạng thái:
              </label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="Hiện">Hiện</option>
                <option value="Ẩn">Ẩn</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
              Ảnh đại diện (URL):
            </label>
            <input
              type="text"
              value={form.thumbnail}
              onChange={e => setForm({ ...form, thumbnail: e.target.value })}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {editingNews ? 'Cập nhật' : 'Tạo'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                background: colors.background,
                color: colors.text,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* News Grid */}
      {loading && !showForm ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
          ⏳ Đang tải...
        </div>
      ) : filteredNews.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: colors.textLight,
        }}>
          <FileText size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>Không có bài viết nào</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {filteredNews.map(item => (
            <div
              key={item.newsid}
              style={{
                background: 'white',
                borderRadius: '20px',
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
                boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Thumbnail */}
              {item.thumbnail && (
                <div style={{
                  width: '100%',
                  height: '180px',
                  background: `url(${item.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}>
                </div>
              )}

              {/* Content */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background:
                      item.type === 'Khuyến mãi' ? '#FFE8E8'
                        : item.type === 'Tuyển dụng' ? '#E8F4FF'
                          : '#E8FFE8',
                    color:
                      item.type === 'Khuyến mãi' ? '#D11F1F'
                        : item.type === 'Tuyển dụng' ? '#1F7BD1'
                          : '#1FD11F',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {item.type}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: item.status === 'Hiện' ? '#E8FFE8' : '#FFE8E8',
                    color: item.status === 'Hiện' ? '#1FD11F' : '#D11F1F',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {item.status}
                  </span>
                </div>

                <h3 style={{
                  color: colors.text,
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '8px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </h3>

                <p style={{
                  color: colors.textLight,
                  fontSize: '13px',
                  margin: '8px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  height: '32px',
                }}>
                  {item.content}
                </p>

                <div style={{
                  fontSize: '12px',
                  color: colors.textLight,
                  marginBottom: '12px',
                }}>
                  {new Date(item.publisheddate).toLocaleDateString('vi-VN')}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: `${colors.primary}20`,
                      color: colors.primary,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit2 size={14} />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleToggleStatus(item.newsid, item.status)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#FFA50020',
                      color: '#FFA500',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    {item.status === 'Hiện' ? <EyeOff size={14} /> : <Eye size={14} />}
                    {item.status === 'Hiện' ? 'Ẩn' : 'Hiện'}
                  </button>
                  <button
                    onClick={() => handleDelete(item.newsid)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: `${colors.error}20`,
                      color: colors.error,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        {toastMessages.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToastMessages(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  )
}
