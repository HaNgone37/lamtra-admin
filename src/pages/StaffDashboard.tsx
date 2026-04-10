import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { BookOpen, Package, X, RefreshCw, Timer, Play, Check, Coffee, AlertTriangle, Loader2, CheckCircle2, Circle, Banknote, MessageSquare, CheckCircle, Truck, Store } from 'lucide-react'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface OrderItem {
  orderdetailid: string
  productname: string
  sizename: string
  quantity: number
  sugarlevel: string
  icelevel: string
  toppings: string[]
}

interface KDSOrder {
  orderid: string
  status: 'Chờ xác nhận' | 'Đang làm' | 'Đang giao' | 'Hoàn thành' | 'Hủy'
  orderdate: string
  items: OrderItem[]
  totalamount: number
  paymentmethod?: string
  ordertype?: string
  note?: string
}

interface IngredientStock {
  name: string
  unit: string
  currentstock: number
  minstocklevel: number
}

interface RecipeProduct {
  productid: string
  name: string
  imageurl: string
  ingredients: { name: string; amount: number; unit: string }[]
}

// ─────────────────────────────────────────────
// SOUND NOTIFICATION HELPER
// ─────────────────────────────────────────────

function playUrgentNotificationSound() {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Create oscillator for beep
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    
    // Double beep pattern
    oscillator.frequency.value = 800 // Hz
    oscillator.type = 'sine'
    
    // Beep 1
    gain.gain.setValueAtTime(0.3, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    oscillator.start(audioContext.currentTime)
    
    // Beep 2
    const startTime = audioContext.currentTime + 0.15
    gain.gain.setValueAtTime(0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1)
    oscillator.stop(startTime + 0.1)
  } catch (e) {
    // Fallback: use console if Web Audio API not available
    console.log('🔔 Đơn hàng khẩn cần được xử lý ngay!')
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatElapsed(minutes: number): string {
  if (minutes < 1) return '< 1 phút'
  if (minutes < 60) return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}p` : `${h}h`
}

function formatSugar(raw: string): string {
  if (!raw) return ''
  const value = raw.trim()
  // Nếu đã có % thì chỉ cần thêm " Đường"
  if (value.includes('%')) {
    return value + ' Đường'
  }
  // Nếu chưa có % thì thêm vào
  return value + '% Đường'
}

function formatIce(raw: string): string {
  if (!raw) return ''
  const value = raw.trim()
  // Nếu đã có % thì chỉ cần thêm " Đá"
  if (value.includes('%')) {
    return value + ' Đá'
  }
  // Nếu chưa có % thì thêm vào
  return value + '% Đá'
}



const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');

  .order-card-ripple {
    position: relative;
    overflow: hidden;
  }

  .ripple-effect {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }

  @keyframes ripple-animation {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes progress-fill {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
  }

  @keyframes slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse-urgent {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.6);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(229, 62, 62, 0);
    }
  }

  .order-card-urgent {
    animation: pulse-urgent 2s infinite;
  }

  body {
    font-family: 'Be Vietnam Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
`;

// ─────────────────────────────────────────────
// ORDER CARD COMPONENT (REDESIGNED)
// ─────────────────────────────────────────────

interface OrderCardProps {
  order: KDSOrder
  onUpdateStatus: (orderId: string, newStatus: string) => void
  updating: boolean
  now: number
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus, updating, now }) => {
  const isWaiting = order.status === 'Chờ xác nhận'
  const isInProgress = order.status === 'Đang làm'
  const isShipping = order.status === 'Đang giao'
  const elapsed = Math.floor((now - new Date(order.orderdate).getTime()) / 60000)

  // State for button ripple effect and progress animation
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number }[]>([])
  const [progressWidth, setProgressWidth] = useState(0)

  // Color logic based on elapsed time and status
  let borderColor = isWaiting ? '#4318FF' : isInProgress ? '#FF9900' : isShipping ? '#9333EA' : '#2B3674'
  let headerBg = isWaiting ? 'linear-gradient(135deg, #EC8FDB 0%, #F06192 100%)' : isInProgress ? 'linear-gradient(135deg, #FFB366 0%, #FF9900 100%)' : isShipping ? 'linear-gradient(135deg, #D2A3FF 0%, #B580FF 100%)' : 'linear-gradient(135deg, #7DD3B0 0%, #06A77D 100%)'
  
  let isUrgent = false
  let progressPercent = 0

  if (elapsed >= 15) {
    borderColor = '#E53E3E'
    headerBg = 'linear-gradient(135deg, #FC8181 0%, #FF6B6B 100%)'
    isUrgent = true
    progressPercent = 100
  } else if (elapsed >= 8 && isInProgress) {
    borderColor = '#FF9900'
    headerBg = 'linear-gradient(135deg, #FFB366 0%, #FF9900 100%)'
    progressPercent = (elapsed - 8) / 7 * 100 // 8-15 minutes
  } else if (isInProgress) {
    progressPercent = (elapsed / 15) * 100
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>, newStatus: string) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Create ripple
    const rippleId = `ripple-${Date.now()}`
    setRipples(prev => [...prev, { id: rippleId, x, y }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId))
    }, 600)

    // Trigger button action
    setTimeout(() => {
      onUpdateStatus(order.orderid, newStatus)
    }, 100)
  }

  // Progress bar animation
  useEffect(() => {
    if (isInProgress) {
      setProgressWidth(progressPercent)
    }
  }, [elapsed, isInProgress, progressPercent])

  const totalQuantity = order.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div
      className={isUrgent ? 'order-card-urgent' : ''}
      style={{
        backgroundColor: '#FFFFFF',
        border: `2.5px solid ${borderColor}`,
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isUrgent ? '0 8px 24px rgba(229, 62, 62, 0.2)' : '0 4px 16px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
      }}
      onMouseEnter={e => !updating && ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)')}
    >
      {/* ═══ HEADER (Part 1) ═══ */}
      <div 
        style={{ 
          background: headerBg, 
          padding: '16px 18px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          gap: '12px',
          position: 'relative',
        }}
      >
        {/* Left: Order ID + Total */}
        <div style={{ flex: 1 }}>
          <p 
            style={{ 
              margin: 0, 
              fontWeight: '900', 
              fontSize: '18px', 
              color: '#FFFFFF', 
              letterSpacing: '0.8px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            #{order.orderid.slice(-6).toUpperCase()}
          </p>
          <p 
            style={{ 
              margin: '6px 0 0 0', 
              fontSize: '13px', 
              color: 'rgba(255,255,255,0.85)',
              fontWeight: '600'
            }}
          >
            {totalQuantity} ly · {order.totalamount.toLocaleString('vi-VN')}đ
          </p>
        </div>

        {/* Right: Timer + Status + Urgent Badge */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          {isUrgent && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: '#FFFFFF',
                color: '#E53E3E',
                fontWeight: '800',
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '99px',
                letterSpacing: '0.3px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <AlertTriangle size={11} fill="#E53E3E" /> KHẨN
            </span>
          )}
          <p 
            style={{ 
              margin: 0, 
              fontSize: '13px', 
              fontWeight: '700', 
              color: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px' 
            }}
          >
            <Timer size={14} /> {formatElapsed(elapsed >= 0 ? elapsed : 0)}
          </p>
          <p 
            style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: 'rgba(255,255,255,0.75)',
              fontWeight: '600'
            }}
          >
            {order.status}
          </p>
        </div>
      </div>

      {/* Progress Bar (for in-progress orders) */}
      {isInProgress && (
        <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              backgroundColor: '#FFFFFF',
              width: `${progressWidth}%`,
              transition: 'width 0.5s ease-out',
              animation: progressWidth > 90 ? 'none' : 'none',
            }}
          />
        </div>
      )}

      {/* ═══ BODY (Part 2) ═══ */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '280px' }}>
        {/* Products */}
        {order.items.map((item, idx) => (
          <div
            key={item.orderdetailid || idx}
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: '14px',
              padding: '12px 14px',
              border: '1.5px solid #f5d5e0',
              animation: 'slide-in-left 0.4s ease-out',
            }}
          >
            {/* Product name + qty */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
              <p 
                style={{ 
                  margin: 0, 
                  fontWeight: '800', 
                  fontSize: '17px', 
                  color: '#2B3674', 
                  lineHeight: 1.2, 
                  flex: 1,
                  fontFamily: "'Be Vietnam Pro', sans-serif"
                }}
              >
                {item.productname}
              </p>
              <span
                style={{
                  flexShrink: 0,
                  backgroundColor: '#f06192',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '15px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(240, 97, 146, 0.3)',
                }}
              >
                x{item.quantity}
              </span>
            </div>

            {/* Size */}
            {item.sizename && (
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#8F9CB8', fontWeight: '500' }}>
                Cỡ: <span style={{ color: '#2B3674', fontWeight: '700' }}>{item.sizename}</span>
              </p>
            )}

            {/* Sugar + Ice + Toppings in one line */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {item.sugarlevel && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: '#FEE2EC',
                    color: '#E84D7A',
                    border: '1px solid #FAC5D9',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🍬 {formatSugar(item.sugarlevel)}
                </span>
              )}
              {item.icelevel && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: '#D1F9FF',
                    color: '#0369A1',
                    border: '1px solid #A5F3FC',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🧊 {formatIce(item.icelevel)}
                </span>
              )}
            </div>

            {/* Toppings - separate line */}
            {item.toppings.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {item.toppings.map((t, ti) => (
                  <span
                    key={ti}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: '#E8F5E9',
                      color: '#2E7D32',
                      border: '1px solid #C8E6C9',
                    }}
                  >
                    + {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Customer Note - if exists */}
        {order.note && order.note.trim() && (
          <div
            style={{
              backgroundColor: '#FFFBEB',
              borderRadius: '12px',
              padding: '10px 12px',
              border: '1.5px solid #FCD34D',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <MessageSquare size={14} style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#D97706', fontWeight: '500', lineHeight: 1.4, fontStyle: 'italic' }}>
              {order.note}
            </p>
          </div>
        )}

        {/* Payment Method + Order Type Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Order Type Badge (Giao hàng / Tại chỗ) */}
          {order.ordertype && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: order.ordertype === 'Giao hàng' ? '#FED7AA' : '#BFDBFE',
                color: order.ordertype === 'Giao hàng' ? '#D97706' : '#1E40AF',
                border: order.ordertype === 'Giao hàng' ? '1px solid #FDBA74' : '1px solid #93C5FD',
              }}
            >
              {order.ordertype === 'Giao hàng' ? (
                <>
                  <Truck size={12} /> GIAO
                </>
              ) : order.ordertype === 'Tại chỗ' ? (
                <>
                  <Store size={12} /> TẠI CHỖ
                </>
              ) : (
                order.ordertype
              )}
            </span>
          )}

          {/* Payment Method Badge */}
          {order.paymentmethod && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: order.paymentmethod === 'Chuyển khoản' || order.paymentmethod === 'Ví điện tử' ? '#D1FAE5' : '#FED7AA',
                color: order.paymentmethod === 'Chuyển khoản' || order.paymentmethod === 'Ví điện tử' ? '#047857' : '#EA580C',
                border: order.paymentmethod === 'Chuyển khoản' || order.paymentmethod === 'Ví điện tử' ? '1px solid #A7F3D0' : '1px solid #FDBA74',
              }}
            >
              {order.paymentmethod === 'Chuyển khoản' || order.paymentmethod === 'Ví điện tử' ? (
                <>
                  <CheckCircle size={12} /> THANH TOÁN
                </>
              ) : (
                <>
                  <Banknote size={12} /> COD
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* ═══ FOOTER (Part 3) - Action Button ═══ */}
      <div style={{ padding: '12px 16px', borderTop: '1.5px solid #f5d5e0', backgroundColor: '#FAFAFA' }}>
        {isWaiting && (
          <button
            onClick={(e) => handleButtonClick(e, 'Đang làm')}
            disabled={updating}
            className="order-card-ripple"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: updating ? '#E5E7EB' : 'linear-gradient(135deg, #f06192 0%, #E84D7A 100%)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '14px',
              cursor: updating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(240, 97, 146, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className="ripple-effect"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                }}
              />
            ))}
            {updating ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 
                Đang cập nhật...
              </>
            ) : (
              <>
                <Play size={16} fill="white" /> NHẬN ĐƠN
              </>
            )}
          </button>
        )}
        {isInProgress && (
          <button
            onClick={(e) => handleButtonClick(e, 'Đang giao')}
            disabled={updating}
            className="order-card-ripple"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: updating ? '#E5E7EB' : 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '14px',
              cursor: updating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(147, 51, 234, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className="ripple-effect"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                }}
              />
            ))}
            {updating ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 
                Đang cập nhật...
              </>
            ) : (
              <>
                <Play size={16} fill="white" /> GIAO HÀNG
              </>
            )}
          </button>
        )}
        {isShipping && (
          <button
            onClick={(e) => handleButtonClick(e, 'Hoàn thành')}
            disabled={updating}
            className="order-card-ripple"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: updating ? '#E5E7EB' : 'linear-gradient(135deg, #06A77D 0%, #00A869 100%)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '14px',
              cursor: updating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(6, 167, 125, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className="ripple-effect"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                }}
              />
            ))}
            {updating ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 
                Đang cập nhật...
              </>
            ) : (
              <>
                <Check size={16} fill="white" /> XONG
              </>
            )}
          </button>
        )}
      </div>

      <style>{globalStyles}</style>
    </div>
  )
}


// ─────────────────────────────────────────────
// RECIPE MODAL
// ─────────────────────────────────────────────

const RecipeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [products, setProducts] = useState<RecipeProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data: pData } = await supabase
          .from('products')
          .select('productid, name, imageurl')
          .eq('status', 'Đang bán')
          .order('name')

        if (!pData) { setLoading(false); return }

        const productIds = pData.map(p => p.productid)
        const { data: rData } = await supabase
          .from('recipes')
          .select('productid, amount, ingredientid, ingredients:ingredients(name, unit)')
          .in('productid', productIds)

        const recipeMap: Record<string, { name: string; amount: number; unit: string }[]> = {}
        for (const r of (rData || [])) {
          if (!recipeMap[r.productid]) recipeMap[r.productid] = []
          recipeMap[r.productid].push({
            name: (r.ingredients as any)?.name || 'N/A',
            amount: r.amount,
            unit: (r.ingredients as any)?.unit || '',
          })
        }

        const enriched: RecipeProduct[] = pData.map(p => ({
          productid: String(p.productid),
          name: p.name,
          imageurl: p.imageurl,
          ingredients: recipeMap[p.productid] || [],
        }))

        setProducts(enriched)
        if (enriched.length > 0) setSelected(enriched[0].productid)
      } catch (err) {
        console.error('Recipe load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const active = products.find(p => p.productid === selected)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px',
          width: '100%', maxWidth: '700px', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column', gap: '16px',
          border: '1px solid #f5d5e0',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontWeight: '800', fontSize: '20px', color: '#2B3674', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={22} style={{ color: '#f06192' }} /> Công thức pha chế
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8F9CB8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#8F9CB8', textAlign: 'center', padding: '40px 0' }}>Đang tải công thức...</p>
        ) : (
          <div style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'hidden' }}>
            {/* Product list */}
            <div style={{ width: '200px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {products.map(p => (
                <button
                  key={p.productid}
                  onClick={() => setSelected(p.productid)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '10px', border: 'none',
                    backgroundColor: selected === p.productid ? '#f06192' : '#FAFAFA',
                    color: selected === p.productid ? '#FFFFFF' : '#8F9CB8',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                    fontSize: '13px', fontWeight: selected === p.productid ? '700' : '500',
                  }}
                >
                  {p.imageurl
                    ? <img src={p.imageurl} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                    : <Coffee size={20} style={{ flexShrink: 0, color: '#8F9CB8' }} />
                  }
                  <span style={{ lineHeight: 1.3 }}>{p.name}</span>
                </button>
              ))}
            </div>

            {/* Recipe detail */}
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#FAFAFA', borderRadius: '12px', padding: '16px', border: '1px solid #f5d5e0' }}>
              {active ? (
                <>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#2B3674' }}>
                    {active.name}
                  </h3>
                  {active.ingredients.length === 0 ? (
                    <p style={{ color: '#8F9CB8', fontStyle: 'italic' }}>Chưa có công thức cho món này.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px 0', color: '#8F9CB8', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #f5d5e0' }}>NGUYÊN LIỆU</th>
                          <th style={{ textAlign: 'right', padding: '8px 0', color: '#8F9CB8', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #f5d5e0' }}>ĐỊNH LƯỢNG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.ingredients.map((ing, i) => (
                          <tr key={i}>
                            <td style={{ padding: '10px 0', color: '#2B3674', fontSize: '14px', borderBottom: '1px solid #FAFAFA' }}>
                              {ing.name}
                            </td>
                            <td style={{ padding: '10px 0', textAlign: 'right', color: '#f06192', fontWeight: '700', fontSize: '14px', borderBottom: '1px solid #FAFAFA' }}>
                              {ing.amount} {ing.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                <p style={{ color: '#8F9CB8' }}>Chọn một món để xem công thức.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// INVENTORY MODAL
// ─────────────────────────────────────────────

const InventoryModal: React.FC<{ branchId: string; onClose: () => void }> = ({ branchId, onClose }) => {
  const [items, setItems] = useState<IngredientStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const branchIdNum = Number(branchId)
        const { data, error } = await supabase
          .from('branchinventory')
          .select('currentstock, ingredients:ingredients(name, unit, minstocklevel)')
          .eq('branchid', branchIdNum)
          .order('ingredientid')

        if (error) throw error

        const mapped: IngredientStock[] = (data || []).map((row: any) => ({
          name: row.ingredients?.name || 'N/A',
          unit: row.ingredients?.unit || '',
          currentstock: row.currentstock,
          minstocklevel: row.ingredients?.minstocklevel ?? 0,
        }))

        setItems(mapped)
      } catch (err) {
        console.error('Inventory load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [branchId])

  const low = items.filter(i => i.currentstock <= i.minstocklevel)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px',
          width: '100%', maxWidth: '520px', maxHeight: '80vh',
          display: 'flex', flexDirection: 'column', gap: '16px',
          border: '1px solid #f5d5e0', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontWeight: '800', fontSize: '20px', color: '#2B3674', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={22} style={{ color: '#06A77D' }} /> Tồn kho chi nhánh
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8F9CB8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#8F9CB8', textAlign: 'center', padding: '40px 0' }}>Đang tải tồn kho...</p>
        ) : (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Low stock warning */}
            {low.length > 0 && (
              <div style={{ backgroundColor: '#FEE2EC', borderRadius: '10px', padding: '10px 14px', border: '1px solid #F8BFD4', flexShrink: 0 }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: '800', fontSize: '13px', color: '#E84D7A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> {low.length} nguyên liệu sắp hết / hết
                </p>
                {low.map((i, idx) => (
                  <p key={idx} style={{ margin: '2px 0', fontSize: '13px', color: '#E84D7A' }}>
                    • {i.name}: <strong>{i.currentstock} {i.unit}</strong>
                  </p>
                ))}
              </div>
            )}

            {/* All items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {items.map((item, idx) => {
                const isLow = item.currentstock <= item.minstocklevel
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '10px',
                      backgroundColor: isLow ? '#FFF5FA' : '#FAFAFA',
                      border: `1px solid ${isLow ? '#F8BFD4' : '#f5d5e0'}`,
                    }}
                  >
                    <span style={{ fontSize: '14px', color: isLow ? '#E84D7A' : '#2B3674', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isLow && <AlertTriangle size={13} />}{item.name}
                    </span>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: isLow ? '#E84D7A' : '#06A77D' }}>
                      {item.currentstock} <span style={{ fontWeight: '400', color: '#8F9CB8' }}>{item.unit}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN STAFF DASHBOARD (KDS)
// ─────────────────────────────────────────────

const StaffDashboard: React.FC = () => {
  const branchId = localStorage.getItem('userBranchId') || ''

  const [orders, setOrders] = useState<KDSOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [showRecipe, setShowRecipe] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [now, setNow] = useState(Date.now())

  // Tick every 30s to refresh elapsed times
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // ── Fetch active orders with enriched details ──
  const fetchActiveOrders = useCallback(async () => {
    if (!branchId) return
    setRefreshing(true)
    try {
      const branchIdNum = Number(branchId)

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('orderid, status, orderdate, totalamount, branchid, paymentmethod, ordertype, note')
        .eq('branchid', branchIdNum)
        .in('status', ['Chờ xác nhận', 'Đang làm', 'Đang giao'])
        .order('orderdate', { ascending: true })

      if (ordersError) throw ordersError
      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      const orderIds = ordersData.map(o => o.orderid)

      // Fetch order details with product & size names
      const { data: detailsData } = await supabase
        .from('orderdetails')
        .select('orderdetailid, orderid, productid, sizeid, quantity, sugarlevel, icelevel')
        .in('orderid', orderIds)

      const details = detailsData || []

      // Batch fetch product names
      const productIds = [...new Set(details.map(d => d.productid))]
      const sizeIds = [...new Set(details.map(d => d.sizeid).filter(Boolean))]

      const [{ data: productsData }, { data: sizesData }] = await Promise.all([
        supabase.from('products').select('productid, name').in('productid', productIds.length ? productIds : ['']),
        supabase.from('sizes').select('sizeid, name').in('sizeid', sizeIds.length ? sizeIds : ['']),
      ])

      const productMap = new Map((productsData || []).map(p => [String(p.productid), p.name]))
      const sizeMap = new Map((sizesData || []).map(s => [String(s.sizeid), s.name]))

      // Fetch toppings
      const detailIds = details.map(d => d.orderdetailid)
      const { data: orderToppingsData } = await supabase
        .from('ordertoppings')
        .select('orderdetailid, toppingid')
        .in('orderdetailid', detailIds.length ? detailIds : [''])

      const toppingIds = [...new Set((orderToppingsData || []).map(t => t.toppingid))]
      const { data: toppingsData } = await supabase
        .from('toppings')
        .select('toppingid, name')
        .in('toppingid', toppingIds.length ? toppingIds : [''])

      const toppingNameMap = new Map((toppingsData || []).map(t => [String(t.toppingid), t.name]))

      // Build topping map per detail
      const detailToppingMap: Record<string, string[]> = {}
      for (const ot of (orderToppingsData || [])) {
        const detailId = String(ot.orderdetailid)
        if (!detailToppingMap[detailId]) detailToppingMap[detailId] = []
        const name = toppingNameMap.get(String(ot.toppingid))
        if (name) detailToppingMap[detailId].push(name)
      }

      // Build KDS orders
      const kdsOrders: KDSOrder[] = ordersData.map(order => {
        const orderDetails = details.filter(d => d.orderid === order.orderid)
        const items: OrderItem[] = orderDetails.map(d => ({
          orderdetailid: String(d.orderdetailid),
          productname: productMap.get(String(d.productid)) || 'N/A',
          sizename: d.sizeid ? (sizeMap.get(String(d.sizeid)) || '') : '',
          quantity: d.quantity,
          sugarlevel: d.sugarlevel || '',
          icelevel: d.icelevel || '',
          toppings: detailToppingMap[String(d.orderdetailid)] || [],
        }))
        return {
          orderid: order.orderid,
          status: order.status as 'Chờ xác nhận' | 'Đang làm' | 'Đang giao' | 'Hoàn thành' | 'Hủy',
          orderdate: order.orderdate,
          totalamount: order.totalamount,
          items,
          paymentmethod: order.paymentmethod || 'Chưa xác định',
          ordertype: order.ordertype || '',
          note: order.note || '',
        }
      })

      // Check for new urgent orders and play notification
      const hasUrgentOrder = kdsOrders.some(o => {
        const elapsed = Math.floor((Date.now() - new Date(o.orderdate).getTime()) / 60000)
        return elapsed >= 15
      })
      
      if (hasUrgentOrder) {
        // Delay sound slightly to avoid overwhelming
        setTimeout(() => {
          playUrgentNotificationSound()
        }, 300)
      }

      setOrders(kdsOrders)
    } catch (err) {
      console.error('KDS fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [branchId])

  // Initial load
  useEffect(() => {
    fetchActiveOrders()
  }, [fetchActiveOrders])

  // Realtime subscription
  useEffect(() => {
    if (!branchId) return

    const handleOrderChange = () => {
      fetchActiveOrders()
    }

    const channel = supabase
      .channel(`kds-orders-${branchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          // Refresh when an order in our branch changes
          const rec = payload.new as any
          const old = payload.old as any
          const relevantBranch = Number(branchId)
          if (
            rec?.branchid === relevantBranch ||
            old?.branchid === relevantBranch
          ) {
            handleOrderChange()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orderdetails' },
        () => {
          // When order details change, refresh to recalculate totals
          handleOrderChange()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [branchId, fetchActiveOrders])

  // ── Update order status ──
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId)
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('orderid', orderId)

      if (error) throw error

      // Optimistic update - remove if completed/cancelled
      if (newStatus === 'Hoàn thành' || newStatus === 'Hủy') {
        setOrders(prev => prev.filter(o => o.orderid !== orderId))
      } else {
        setOrders(prev =>
          prev.map(o =>
            o.orderid === orderId ? { ...o, status: newStatus as 'Chờ xác nhận' | 'Đang làm' | 'Đang giao' | 'Hoàn thành' | 'Hủy' } : o
          )
        )
      }
    } catch (err) {
      console.error('Status update error:', err)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const waiting = orders.filter(o => o.status === 'Chờ xác nhận')
  const inProgress = orders.filter(o => o.status === 'Đang làm')
  const shipping = orders.filter(o => o.status === 'Đang giao')

  return (
    <div style={{ padding: '16px', minHeight: '100%' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      {/* ─── Stats bar ─── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '14px 20px', border: '1.5px solid #4318FF', flex: '1', minWidth: '120px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#8F9CB8', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Đang chờ pha</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '32px', fontWeight: '900', color: '#4318FF', lineHeight: 1 }}>{waiting.length}</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '14px 20px', border: '1.5px solid #FF9900', flex: '1', minWidth: '120px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#8F9CB8', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Đang làm</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '32px', fontWeight: '900', color: '#FF9900', lineHeight: 1 }}>{inProgress.length}</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '14px 20px', border: '1.5px solid #f5d5e0', flex: '1', minWidth: '120px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#8F9CB8', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Tổng ly</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '32px', fontWeight: '900', color: '#06A77D', lineHeight: 1 }}>
            {orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
          </p>
        </div>
        <button
          onClick={fetchActiveOrders}
          disabled={refreshing}
          style={{
            backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '12px 20px',
            border: '1px solid #f5d5e0', cursor: refreshing ? 'not-allowed' : 'pointer', color: '#f06192',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
            opacity: refreshing ? 0.6 : 1,
            transition: 'all 0.3s ease',
          }}
          title={refreshing ? "Đang cập nhật..." : "Làm mới"}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Đang cập nhật...' : 'Làm mới'}
        </button>
      </div>

      {/* ─── Main KDS grid ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8F9CB8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#f06192' }} />
          <p style={{ fontSize: '16px', margin: 0 }}>Đang kết nối...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8F9CB8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CheckCircle2 size={56} style={{ color: '#06A77D', marginBottom: '16px' }} />
          <p style={{ fontSize: '20px', fontWeight: '700', color: '#06A77D', margin: 0 }}>Tất cả đơn đã xong!</p>
          <p style={{ fontSize: '14px', color: '#8F9CB8', marginTop: '8px' }}>Đang chờ đơn mới...</p>
        </div>
      ) : (
        <div>
          {/* Chờ section */}
          {waiting.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#f06192', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Circle size={10} fill="#f06192" color="#f06192" /> CHỜ PHA — {waiting.length} đơn
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {waiting.map(order => (
                  <OrderCard
                    key={order.orderid}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    updating={updatingOrderId === order.orderid}
                    now={now}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Đang làm section */}
          {inProgress.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#FF9900', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Circle size={10} fill="#FF9900" color="#FF9900" /> ĐANG LÀM — {inProgress.length} đơn
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {inProgress.map(order => (
                  <OrderCard
                    key={order.orderid}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    updating={updatingOrderId === order.orderid}
                    now={now}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Đang giao section */}
          {shipping.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#9333EA', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Circle size={10} fill="#9333EA" color="#9333EA" /> ĐANG GIAO — {shipping.length} đơn
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {shipping.map(order => (
                  <OrderCard
                    key={order.orderid}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    updating={updatingOrderId === order.orderid}
                    now={now}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Floating Quick-Access Buttons ─── */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setShowInventory(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 18px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #276749 0%, #38A169 100%)',
            color: '#FFFFFF', fontWeight: '700', fontSize: '13px',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(56,161,105,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
        >
          <Package size={18} />
          Xem tồn kho
        </button>
        <button
          onClick={() => setShowRecipe(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 18px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #744210 0%, #B7791F 100%)',
            color: '#FFFFFF', fontWeight: '700', fontSize: '13px',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(183,121,31,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
        >
          <BookOpen size={18} />
          Xem công thức
        </button>
      </div>

      {/* ─── Modals ─── */}
      {showRecipe && <RecipeModal onClose={() => setShowRecipe(false)} />}
      {showInventory && branchId && (
        <InventoryModal branchId={branchId} onClose={() => setShowInventory(false)} />
      )}
    </div>
  )
}

export default StaffDashboard
