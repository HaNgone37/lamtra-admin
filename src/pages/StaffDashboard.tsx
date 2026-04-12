import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { orderService } from '@/services/orderService'
import { Toast } from '@/components/Toast'
import { ChefHat, Box, BookOpen, Coffee, Play, Check } from 'lucide-react'

const PINK = '#f06192'
const PINK_LIGHT = '#f5d5e0'
const GRAY = '#666666'
const NAVY = '#2B3674'

const StaffDashboard = () => {
  const [branchId, setBranchId] = useState(0)
  const [tab, setTab] = useState('kds')
  const [toast, setToast] = useState<any>(null)

  useEffect(() => {
    const bid = localStorage.getItem('userBranchId')
    if (bid) setBranchId(parseInt(bid))
  }, [])

  if (branchId === 0) return <div style={{ padding: '20px', color: GRAY }}>...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <div style={{ borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', gap: '40px', padding: '24px 32px', position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#fff' }}>
        <button onClick={() => setTab('kds')} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '700', color: tab === 'kds' ? PINK : GRAY, cursor: 'pointer', paddingBottom: '8px', borderBottom: tab === 'kds' ? `3px solid ${PINK}` : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ChefHat size={18} />TRẠM PHA CHẾ</button>
        <button onClick={() => setTab('inv')} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '700', color: tab === 'inv' ? PINK : GRAY, cursor: 'pointer', paddingBottom: '8px', borderBottom: tab === 'inv' ? `3px solid ${PINK}` : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><Box size={18} />TỒN KHO</button>
        <button onClick={() => setTab('recipes')} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '700', color: tab === 'recipes' ? PINK : GRAY, cursor: 'pointer', paddingBottom: '8px', borderBottom: tab === 'recipes' ? `3px solid ${PINK}` : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={18} />XEM CÔNG THỨC</button>
      </div>
      <div style={{ padding: '24px 32px' }}>
        {tab === 'kds' && <KDS bid={branchId} setToast={setToast} />}
        {tab === 'inv' && <INV bid={branchId} />}
        {tab === 'recipes' && <Recipes bid={branchId} />}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} duration={2000} />}
    </div>
  )
}

export default StaffDashboard

const KDS = ({ bid, setToast }: { bid: number; setToast: any }) => {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [orderStates, setOrderStates] = useState<{ [key: string]: { state: string; startTime: number } }>({})

  useEffect(() => {
    const load = async () => {
      try {
        const p = await orderService.getOrdersByStatusAndBranch(bid, 'Chờ xác nhận')
        const m = await orderService.getOrdersByStatusAndBranch(bid, 'Đang làm')
        const allOrders = [...p, ...m]
        setOrders(allOrders)
        const states: { [key: string]: { state: string; startTime: number } } = {}
        allOrders.forEach((o: any) => {
          const existingState = orderStates[o.orderid]
          states[o.orderid] = {
            state: o.status === 'Chờ xác nhận' ? 'pending' : 'making',
            startTime: existingState?.startTime || Date.now()
          }
        })
        setOrderStates(states)
      } catch (e) { 
        console.error('[KDS] Error loading orders:', e) 
      } finally { 
        setLoading(false) 
      }
    }
    load()
    const int = setInterval(load, 3000)
    return () => clearInterval(int)
  }, [bid])

  const startMaking = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'Đang làm')
      setOrderStates({ 
        ...orderStates, 
        [orderId]: { 
          state: 'making', 
          startTime: orderStates[orderId]?.startTime || Date.now()
        } 
      })
      setToast({ type: 'success', message: `Bắt đầu đơn #${orderId}` })
    } catch (e) {
      console.error('[KDS] Error starting order:', e)
      setToast({ type: 'error', message: 'Lỗi cập nhật đơn hàng' })
    }
  }

  const complete = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'Hoàn thành')
      // Remove order from display
      setOrders(orders.filter(o => o.orderid !== orderId))
      const newStates = { ...orderStates }
      delete newStates[orderId]
      setOrderStates(newStates)
      setToast({ type: 'success', message: `Hoàn thành đơn #${orderId}` })
      console.log('[KDS] Order completed:', orderId)
    } catch (e) {
      console.error('[KDS] Error completing order:', e)
      setToast({ type: 'error', message: 'Lỗi hoàn thành đơn hàng' })
    }
  }

  const getWaitTime = (orderId: string) => {
    const state = orderStates[orderId]
    if (!state) return 0
    const minutes = Math.floor((Date.now() - state.startTime) / 60000)
    return minutes
  }

  const getElapsedTime = (orderDate: string) => {
    if (!orderDate) return '0s'
    const orderTime = new Date(orderDate).getTime()
    const now = Date.now()
    const elapsedMs = now - orderTime
    
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    const elapsedMinutes = Math.floor(elapsedSeconds / 60)
    const elapsedHours = Math.floor(elapsedMinutes / 60)
    
    const remainingMinutes = elapsedMinutes % 60
    const remainingSeconds = elapsedSeconds % 60
    
    if (elapsedHours > 0) {
      return `${elapsedHours}h${remainingMinutes}m${remainingSeconds}s`
    } else if (elapsedMinutes > 0) {
      return `${elapsedMinutes}m${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: GRAY }}>...</div>
  if (!orders.length) return (
    <div style={{ textAlign: 'center', padding: '120px 60px', backgroundColor: PINK_LIGHT, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <Coffee size={64} color={PINK} style={{ opacity: 0.3 }} />
      <div style={{ color: PINK, fontSize: '16px', fontWeight: '600' }}>Đang chờ những ly trà thơm ngon đầu tiên...</div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
      {orders.map((o: any) => {
        const state = orderStates[o.orderid]?.state || 'pending'
        const isPending = state === 'pending'
        const isMaking = state === 'making'
        const waitTime = getWaitTime(o.orderid)
        const elapsedTime = getElapsedTime(o.orderdate)
        
        console.log('[KDS] Order detail:', { orderid: o.orderid, orderdetails: o.orderdetails, orderdate: o.orderdate, elapsedTime })
        
        return (
          <div key={o.orderid} style={{ backgroundColor: '#fff', borderRadius: '16px', border: `3px solid ${isPending ? '#FFA500' : isMaking ? PINK : '#DDD'}`, boxShadow: '0 2px 8px rgba(240, 97, 146, 0.1)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {/* Elapsed Time Badge */}
            <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#333', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', fontFamily: 'monospace' }}>
              {elapsedTime}
            </div>
            
            {/* Old Status Badge - Hidden if elapsed time visible */}
            {waitTime > 5 && elapsedTime === '0m' && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#FF6B6B', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                {waitTime} phút
              </div>
            )}
            
            {/* Order Header */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: GRAY, marginBottom: '4px' }}>Đơn hàng</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: PINK }}>#{o.orderid}</div>
              <div style={{ fontSize: '11px', fontWeight: '500', color: GRAY, marginTop: '6px', fontStyle: 'italic' }}>
                {o.customers?.fullname || 'Khách lẻ'}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '500', color: GRAY, marginTop: '2px' }}>
                {isPending ? 'Chờ xác nhận' : 'Đang làm'}
              </div>
            </div>

            {/* Products */}
            <div style={{ paddingTop: '12px', borderTop: `1px solid ${PINK_LIGHT}` }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: NAVY, marginBottom: '8px' }}>Sản phẩm</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(o.orderdetails || []).map((detail: any, idx: number) => {
                  const product = detail.products ? (Array.isArray(detail.products) ? detail.products[0] : detail.products) : null
                  const size = detail.sizes ? (Array.isArray(detail.sizes) ? detail.sizes[0] : detail.sizes) : null
                  const productName = product?.name || `Sản phẩm #${detail.productid}`
                  
                  return (
                    <div key={idx} style={{ backgroundColor: '#F9F9F9', padding: '8px', borderRadius: '8px', fontSize: '12px' }}>
                      <div style={{ fontWeight: '700', color: NAVY, marginBottom: '4px' }}>
                        {productName} x{detail.quantity}
                      </div>
                      <div style={{ fontSize: '11px', color: GRAY, lineHeight: 1.4 }}>
                        {size && <div>Size: <strong>{size.name}</strong></div>}
                        {detail.sugarlevel && <div>Đường: <strong>{detail.sugarlevel}</strong></div>}
                        {detail.icelevel && <div>Đá: <strong>{detail.icelevel}</strong></div>}
                        {product?.subtitle && <div style={{ fontStyle: 'italic', marginTop: '2px' }}>{product.subtitle}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Info */}
            {(o.paymentmethod || o.ordertype) && (
              <div style={{ paddingTop: '12px', borderTop: `1px solid ${PINK_LIGHT}`, fontSize: '11px', color: GRAY, lineHeight: 1.6 }}>
                {o.paymentmethod && <div>Thanh toán: <strong>{o.paymentmethod}</strong></div>}
                {o.ordertype && <div>Nhận hàng: <strong>{o.ordertype}</strong></div>}
              </div>
            )}

            {/* Note */}
            {o.note && (
              <div style={{ paddingTop: '12px', borderTop: `1px solid ${PINK_LIGHT}`, fontSize: '12px', color: GRAY }}>
                <div style={{ fontWeight: '600', color: NAVY, marginBottom: '4px' }}>Ghi chú</div>
                <div style={{ fontStyle: 'italic' }}>{o.note}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              {isPending && (
                <button 
                  onClick={() => startMaking(o.orderid)} 
                  style={{ 
                    flex: 1, 
                    padding: '10px', 
                    backgroundColor: '#0284c7', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontSize: '13px', 
                    fontWeight: '700', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                >
                  <Play size={16} />Bắt đầu
                </button>
              )}
              {(isPending || isMaking) && (
                <button 
                  onClick={() => complete(o.orderid)} 
                  style={{ 
                    flex: 1, 
                    padding: '10px', 
                    backgroundColor: PINK, 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontSize: '13px', 
                    fontWeight: '700', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E64B7F'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PINK}
                >
                  <Check size={16} />Hoàn thành
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const INV = ({ bid }: { bid: number }) => {
  const [inv, setInv] = useState<any>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('branchinventory').select('*, ingredients(name, unit)').eq('branchid', bid)
        if (data) setInv(data.sort((a: any, b: any) => (a.currentstock || 0) - (b.currentstock || 0)))
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [bid])

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: GRAY }}>...</div>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${PINK_LIGHT}`, backgroundColor: '#fafafa' }}>
            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: NAVY, fontSize: '13px' }}>Tên nguyên liệu</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: NAVY, fontSize: '13px' }}>Số lượng</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: NAVY, fontSize: '13px' }}>Đơn vị</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: NAVY, fontSize: '13px' }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {inv.map((item: any, idx: any) => {
            const qty = item.currentstock || 0
            let status = 'Còn'
            let statusColor = '#10b981'
            let statusBg = 'rgba(16, 185, 129, 0.1)'
            if (qty === 0) { status = 'Hết'; statusColor = '#ef4444'; statusBg = 'rgba(239, 68, 68, 0.1)' } else if (qty < (item.minstocklevel || 5)) { status = 'Sắp hết'; statusColor = '#f59e0b'; statusBg = 'rgba(245, 158, 11, 0.1)' }
            return (
              <tr key={idx} style={{ borderBottom: `1px solid ${PINK_LIGHT}`, backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '16px', textAlign: 'left', color: NAVY, fontSize: '13px', fontWeight: '500' }}>{item.ingredients?.name || 'N/A'}</td>
                <td style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: PINK, fontSize: '13px' }}>{qty}</td>
                <td style={{ padding: '16px', textAlign: 'center', color: GRAY, fontSize: '13px' }}>{item.ingredients?.unit || 'N/A'}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: statusBg, color: statusColor, borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                    {status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const Recipes = ({ bid }: { bid: number }) => {
  const [products, setProducts] = useState<any>([])
  const [sizes, setSizes] = useState<any>([])
  const [selected, setSelected] = useState<any>(null)
  const [selectedSize, setSelectedSize] = useState<any>(null)
  const [ingredientsBySize, setIngredientsBySize] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        console.log('[RECIPES] Loading products and sizes...')
        const [productsRes, sizesRes] = await Promise.all([
          supabase.from('products').select('*').limit(50),
          supabase.from('sizes').select('*')
        ])
        
        const prodErr = (productsRes as any).error
        
        if (prodErr) {
          console.error('[RECIPES] Products query error:', prodErr)
          setError('Lỗi tải dữ liệu')
        }
        if (prodErr) return

        const prodData = (productsRes as any).data || []
        const sizeData = (sizesRes as any).data || []
        
        if (prodData.length > 0) {
          setProducts(prodData)
          setSizes(sizeData)
          setSelectedSize(sizeData[0] || null)
          loadRecipe(prodData[0], sizeData[0] || null)
        } else {
          console.warn('[RECIPES] No products found')
          setProducts([])
        }
      } catch (e) {
        console.error('[RECIPES] Load error:', e)
        setError('Lỗi kết nối')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bid])

  const loadRecipe = async (product: any, size: any = null) => {
    setSelected(product)
    if (size) setSelectedSize(size)
    
    try {
      console.log('[RECIPES] Loading recipes for product:', product.productid, 'size:', size?.sizeid)
      
      // Query recipes with sizeid
      let query = supabase
        .from('recipes')
        .select('*, ingredients(name, unit), sizes(name)')
        .eq('productid', product.productid)
      
      const { data: recipes, error: err } = await query
      
      if (err) {
        console.error('[RECIPES] Recipe query error:', err)
        setIngredientsBySize({})
        return
      }

      // Group recipes by sizeid
      const grouped: any = {}
      if (recipes && recipes.length > 0) {
        recipes.forEach((recipe: any) => {
          const sizeId = recipe.sizeid || 'all'
          if (!grouped[sizeId]) {
            grouped[sizeId] = {
              sizeid: recipe.sizeid,
              sizename: recipe.sizes?.name || 'Tất cả',
              ingredients: []
            }
          }
          grouped[sizeId].ingredients.push(recipe)
        })
      }
      
      console.log('[RECIPES] Recipes grouped by size:', grouped)
      setIngredientsBySize(grouped)
    } catch (e) {
      console.error('[RECIPES] Recipe load error:', e)
      setIngredientsBySize({})
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: GRAY }}>...</div>
  if (error) return <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>{error}</div>

  return (
    <div style={{ display: 'flex', gap: '24px', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ flex: '0 0 28%', backgroundColor: PINK_LIGHT, borderRadius: '16px', padding: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: NAVY, marginBottom: '16px' }}>Danh sách công thức</h3>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: GRAY, fontSize: '13px' }}>Không có sản phẩm</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.map((p: any) => (
              <button
                key={p.productid}
                onClick={() => loadRecipe(p, selectedSize)}
                style={{
                  padding: '12px',
                  backgroundColor: selected?.productid === p.productid ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: selected?.productid === p.productid ? '0 2px 8px rgba(240, 97, 146, 0.15)' : 'none',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}
              >
                {p.imageurl && <img src={p.imageurl} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as any).style.display = 'none' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: NAVY }}>{p.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '16px', padding: '32px', border: `2px solid ${PINK_LIGHT}`, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        {selected ? (
          <div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', alignItems: 'flex-start' }}>
              {selected.imageurl && <img src={selected.imageurl} alt={selected.name} style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as any).style.display = 'none' }} />}
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: NAVY, margin: '0 0 8px 0' }}>{selected.name}</h1>
                <p style={{ fontSize: '14px', color: GRAY, margin: 0 }}>Giá: <span style={{ fontWeight: '700', color: PINK }}>{((selected.saleprice || selected.baseprice) / 1000).toFixed(1)}K</span></p>
              </div>
            </div>

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${PINK_LIGHT}` }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: NAVY, marginBottom: '10px' }}>CHỌN SIZE</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {sizes.map((size: any) => (
                    <button
                      key={size.sizeid}
                      onClick={() => {
                        setSelectedSize(size)
                        loadRecipe(selected, size)
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: selectedSize?.sizeid === size.sizeid ? 'none' : `2px solid ${PINK_LIGHT}`,
                        backgroundColor: selectedSize?.sizeid === size.sizeid ? PINK : '#fff',
                        color: selectedSize?.sizeid === size.sizeid ? '#fff' : NAVY,
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients for Selected Size */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: NAVY, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color={PINK} />Nguyên liệu ({selectedSize?.name || 'Tất cả'})
              </h3>
              
              {Object.keys(ingredientsBySize).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {ingredientsBySize[selectedSize?.sizeid || 'all']?.ingredients?.map((ing: any, idx: any) => (
                    <div key={idx} style={{ backgroundColor: PINK_LIGHT, borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: NAVY }}>{ing.ingredients?.name || 'N/A'}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: PINK }}>{ing.amount}{ing.ingredients?.unit || ''}</span>
                    </div>
                  )) || []}
                </div>
              ) : (
                <p style={{ color: GRAY, fontSize: '13px' }}>Chưa có dữ liệu công thức cho size này</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: GRAY, padding: '60px 20px' }}>Chọn một sản phẩm để xem công thức</div>
        )}
      </div>
    </div>
  )
}
