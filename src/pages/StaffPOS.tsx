import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { orderService } from '@/services/orderService'
import { voucherService } from '@/services/voucherService'
import { Toast } from '@/components/Toast'
import { DeliveryAddressInput } from '@/components/DeliveryAddressInput'
import { VoucherSelector } from '@/components/staff/VoucherSelector'
import { Trash2, X } from 'lucide-react'

// ═════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════

interface Product {
  productid: number
  name: string
  description?: string
  imageurl: string
  baseprice: number
  saleprice: number
  status: string
}

interface Size {
  sizeid: number
  name: string
  additionalprice: number
}

interface Topping {
  toppingid: number
  name: string
  price: number
  isavailable: boolean
}

interface CartTopping {
  toppingid: number
  name: string
  price: number
  quantity: number
}

interface CartItem {
  id: string
  productid: number
  productname: string
  quantity: number
  sizeid: number
  sizename: string
  priceatorder: number
  subtotal: number
  sugarlevel: string
  icelevel: string
  toppings: CartTopping[]
}

interface Customer {
  customerid: number
  phone: string
  fullname: string
  totalpoints: number
  accumulated_points: number
}

interface ModalState {
  open: boolean
  product: Product | null
  selectedSize: Size | null
  selectedSugar: string
  selectedIce: string
  selectedToppings: CartTopping[]
}

interface BranchCoordinates {
  latitude: number
  longitude: number
}

interface DeliveryAddress {
  address_detail: string
  customer_latitude: number
  customer_longitude: number
  city?: string
  ward?: string
}

// ═════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════

const PINK_PRIMARY = '#f06192'
const PINK_LIGHT = '#f5d5e0'
const BORDER_LIGHT = '#F5F5F5'
const GRAY_TEXT = '#666666'

const SUGAR_OPTIONS = ['0%', '30%', '50%', '70%', '100%']
const ICE_OPTIONS = ['0%', '50%', '100%']

// Shipping fee tiers: distance -> price
const SHIPPING_TIERS = [
  { maxKm: 1, fee: 0 },
  { maxKm: 3, fee: 10000 },
  { maxKm: 6, fee: 15000 },
  { maxKm: 10, fee: 18000 },
  { maxKm: 15, fee: 22000 }
]

const MAX_DELIVERY_DISTANCE_KM = 15

// ═════════════════════════════════════════════════════════════════
// STAFF POS PAGE
// ═════════════════════════════════════════════════════════════════

export const StaffPOS: React.FC = () => {
  // ─────────────────────────────────────────────────────────────
  // Core State
  // ─────────────────────────────────────────────────────────────
  const [branchId, setBranchId] = useState<number>(0)
  const [branchCoordinates, setBranchCoordinates] = useState<BranchCoordinates | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [toppings, setToppings] = useState<Topping[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerPhone, setCustomerPhone] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountAmount: number } | null>(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [publicVouchers, setPublicVouchers] = useState<any[]>([])
  const [customerVouchers, setCustomerVouchers] = useState<any[]>([])
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [orderNote, setOrderNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'Tiền mặt' | 'Chuyển khoản'>('Tiền mặt')
  const [orderType, setOrderType] = useState<'Tại chỗ' | 'Giao hàng'>('Tại chỗ')
  const [shippingFee, setShippingFee] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)

  // ─────────────────────────────────────────────────────────────
  // Delivery State
  // ─────────────────────────────────────────────────────────────
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null)
  const [deliveryAddressInput, setDeliveryAddressInput] = useState('')
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [isOutOfServiceArea, setIsOutOfServiceArea] = useState(false)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    product: null,
    selectedSize: null,
    selectedSugar: '100%',
    selectedIce: '100%',
    selectedToppings: []
  })

  // ─────────────────────────────────────────────────────────────
  // GET BRANCH ID & COORDINATES
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem('userBranchId')
    if (stored) {
      const bid = parseInt(stored, 10)
      setBranchId(bid)
    }
  }, [])

  // Load branch coordinates when branchId changes
  useEffect(() => {
    if (branchId === 0) return

    const loadBranchCoordinates = async () => {
      try {
        const { data } = await supabase
          .from('branches')
          .select('latitude, longitude')
          .eq('branchid', branchId)
          .single()

        if (data) {
          setBranchCoordinates({
            latitude: data.latitude,
            longitude: data.longitude
          })
          console.log('[POS] Branch coordinates loaded:', {
            branchid: branchId,
            lat: data.latitude,
            lng: data.longitude
          })
        }
      } catch (error) {
        console.error('[ERROR] Failed to load branch coordinates:', error)
      }
    }

    loadBranchCoordinates()
  }, [branchId])

  // ─────────────────────────────────────────────────────────────
  // LOAD MENU & SIZES & TOPPINGS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (branchId === 0) return

    const loadData = async () => {
      try {
        console.log('[POS] Loading menu for branch:', branchId)
        const [productsRes, sizesRes, toppingsRes] = await Promise.all([
          supabase.from('products').select('*').limit(50),
          supabase.from('sizes').select('*'),
          supabase.from('toppings').select('*').eq('isavailable', true)
        ])

        if (productsRes.error) {
          console.error('[POS] Products query error:', productsRes.error)
          setToast({ type: 'error', message: 'Lỗi tải menu' })
        } else {
          console.log('[POS] Products loaded:', productsRes.data?.length || 0)
          if (productsRes.data) setProducts(productsRes.data)
        }

        if (sizesRes.data) setSizes(sizesRes.data)
        if (toppingsRes.data) setToppings(toppingsRes.data)
      } catch (error) {
        console.error('[ERROR] Load menu failed:', error)
        setToast({ type: 'error', message: 'Lỗi tải menu' })
      } finally {
        setIsLoadingMenu(false)
      }
    }

    loadData()
  }, [branchId])

  // ─────────────────────────────────────────────────────────────
  // LOAD PUBLIC VOUCHERS (Voucher Công khai)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadPublicVouchers = async () => {
      try {
        const vouchers = await voucherService.getPublicVouchers()
        setPublicVouchers(vouchers)
        console.log('[POS] Public vouchers loaded:', vouchers.length)
      } catch (error) {
        console.error('[ERROR] Failed to load public vouchers:', error)
      }
    }

    loadPublicVouchers()
  }, [])

  // ─────────────────────────────────────────────────────────────
  // LOAD PERSONAL VOUCHERS WHEN CUSTOMER SELECTED (Voucher Cá nhân)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerVouchers([])
      return
    }

    const loadCustomerVouchers = async () => {
      try {
        const vouchers = await voucherService.getCustomerPersonalVouchers(selectedCustomer.customerid as number)
        setCustomerVouchers(vouchers)
        console.log('[POS] Customer personal vouchers loaded:', vouchers.length)
      } catch (error) {
        console.error('[ERROR] Failed to load customer vouchers:', error)
      }
    }

    loadCustomerVouchers()
  }, [selectedCustomer])

  // ─────────────────────────────────────────────────────────────
  // GOOGLE PLACES AUTOCOMPLETE
  // ─────────────────────────────────────────────────────────────

  const handleAddressSelect = (
    latitude: number,
    longitude: number,
    formattedAddress: string,
    distanceKm: number
  ) => {
    console.log('[StaffPOS] Address selected from Nominatim:', {
      latitude,
      longitude,
      formattedAddress,
      distanceKm
    })

    // Set delivery address
    const newDeliveryAddress: DeliveryAddress = {
      address_detail: formattedAddress,
      customer_latitude: latitude,
      customer_longitude: longitude,
      city: undefined,
      ward: undefined
    }

    setDeliveryAddress(newDeliveryAddress)
    setDeliveryAddressInput(formattedAddress)
    setDistanceKm(distanceKm)

    // Calculate shipping fee based on distance
    const fee = calculateShippingFeeByDistance(distanceKm)
    setShippingFee(fee)

    // Check if out of service area
    if (distanceKm > 15) {
      setIsOutOfServiceArea(true)
      setToast({
        type: 'error',
        message: `Ngoài vùng phục vụ (${distanceKm.toFixed(1)} km)`
      })
    } else {
      setIsOutOfServiceArea(false)
      setToast({ type: 'success', message: `Đã chọn địa chỉ (${distanceKm.toFixed(1)} km)` })
    }

    console.log('═════════════════════════════════════════════════════════')
    console.log('✓ ĐỊA CHỈ GIAO HÀNG ĐÃ CHỌN (Nominatim + Haversine)')
    console.log('═════════════════════════════════════════════════════════')
    console.log(`📍 Địa chỉ: ${formattedAddress}`)
    console.log(`📍 Tọa độ: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
    console.log(`📏 Khoảng cách: ${distanceKm.toFixed(2)} km`)
    console.log(`💰 Phí giao hàng: ${fee.toLocaleString('vi-VN')} VNĐ`)
    console.log('═════════════════════════════════════════════════════════')
  }

  // ─────────────────────────────────────────────────────────────
  // CALCULATE SHIPPING FEE BY DISTANCE
  // ─────────────────────────────────────────────────────────────

  const calculateShippingFeeByDistance = (distanceKm: number): number => {
    // Shipping tiers
    if (distanceKm <= 1) return 0
    if (distanceKm <= 3) return 10000
    if (distanceKm <= 6) return 15000
    if (distanceKm <= 10) return 18000
    if (distanceKm <= 15) return 22000
    return 0 // Out of service area
  }

  // ─────────────────────────────────────────────────────────────
  // CUSTOMER SEARCH
  // ─────────────────────────────────────────────────────────────

  const handleSearchCustomer = async () => {
    if (!customerPhone.trim()) {
      setSelectedCustomer(null)
      return
    }

    try {
      const searchPhone = String(customerPhone).trim()
      console.log('[POS] Searching customer with phone:', searchPhone)
      
      const { data } = await supabase
        .from('customers')
        .select('customerid, phone, fullname, totalpoints, accumulated_points')
        .eq('phone', searchPhone)
        .single()

      if (data) {
        setSelectedCustomer(data)
        setToast({ type: 'success', message: `Tìm thấy: ${data.fullname}` })
        console.log('[POS] Customer found:', data.customerid, data.fullname)
      } else {
        setSelectedCustomer(null)
        console.log('[POS] No customer found, will checkout as guest')
        setToast({ type: 'error', message: 'Không tìm thấy khách hàng' })
      }
    } catch (error) {
      setSelectedCustomer(null)
      console.error('[ERROR] Customer search failed:', error)
      console.error('[POS] Will checkout as guest (customerid=null)')
    }
  }

  // ─────────────────────────────────────────────────────────────
  // MODAL HANDLERS
  // ─────────────────────────────────────────────────────────────

  const openProductModal = (product: Product) => {
    setModalState({
      open: true,
      product,
      selectedSize: sizes[0] || null,
      selectedSugar: '100%',
      selectedIce: '100%',
      selectedToppings: []
    })
  }

  const closeProductModal = () => {
    setModalState({
      open: false,
      product: null,
      selectedSize: null,
      selectedSugar: '100%',
      selectedIce: '100%',
      selectedToppings: []
    })
  }

  const toggleTopping = (topping: Topping) => {
    const exists = modalState.selectedToppings.find((t) => t.toppingid === topping.toppingid)
    if (exists) {
      setModalState({
        ...modalState,
        selectedToppings: modalState.selectedToppings.filter((t) => t.toppingid !== topping.toppingid)
      })
    } else {
      setModalState({
        ...modalState,
        selectedToppings: [...modalState.selectedToppings, { toppingid: topping.toppingid, name: topping.name, price: topping.price, quantity: 1 }]
      })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ADD TO CART FROM MODAL
  // ─────────────────────────────────────────────────────────────

  const handleAddToCartFromModal = () => {
    if (!modalState.product || !modalState.selectedSize) return

    const product = modalState.product
    const size = modalState.selectedSize
    const pricePerItem =
      (product.saleprice || product.baseprice) +
      size.additionalprice +
      modalState.selectedToppings.reduce((sum, t) => sum + t.price, 0)

    const cartItemId = `${product.productid}-${size.sizeid}-${Date.now()}`
    const newItem: CartItem = {
      id: cartItemId,
      productid: product.productid,
      productname: product.name,
      quantity: 1,
      sizeid: size.sizeid,
      sizename: size.name,
      priceatorder: pricePerItem,
      subtotal: pricePerItem,
      sugarlevel: modalState.selectedSugar,
      icelevel: modalState.selectedIce,
      toppings: modalState.selectedToppings
    }

    setCartItems([...cartItems, newItem])
    setToast({ type: 'success', message: `Thêm 1x ${product.name}` })
    closeProductModal()
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE CART
  // ─────────────────────────────────────────────────────────────

  const handleUpdateQuantity = (id: string, delta: number) => {
    const item = cartItems.find((i) => i.id === id)
    if (!item) return

    const newQty = item.quantity + delta
    if (newQty <= 0) {
      setCartItems(cartItems.filter((i) => i.id !== id))
      return
    }

    setCartItems(
      cartItems.map((i) =>
        i.id === id
          ? {
              ...i,
              quantity: newQty,
              subtotal: (i.priceatorder / i.quantity) * newQty
            }
          : i
      )
    )
  }

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter((i) => i.id !== id))
  }

  // ─────────────────────────────────────────────────────────────
  // VOUCHER HANDLING - WITH SCOPE SUPPORT
  // ─────────────────────────────────────────────────────────────

  const handleApplyVoucher = async (voucherCodeToApply: string) => {
    if (!voucherCodeToApply.trim()) {
      setAppliedVoucher(null)
      setVoucherError(null)
      return
    }

    setIsValidatingVoucher(true)
    setVoucherError(null)

    try {
      // Sử dụng method mới với scope support
      const result = await voucherService.validateVoucherCodeWithScope(
        voucherCodeToApply,
        selectedCustomer?.customerid as number | null | undefined
      )

      if (result.valid && result.discountAmount && result.voucher) {
        // 🔒 RULE: Chỉ chọn 1 voucher duy nhất
        setAppliedVoucher({ code: voucherCodeToApply.toUpperCase(), discountAmount: result.discountAmount })
        setVoucherCode(voucherCodeToApply.toUpperCase())
        setVoucherError(null)
        setToast({ type: 'success', message: `Áp dụng mã: ${voucherCodeToApply.toUpperCase()}` })
        console.log('[POS] Voucher applied:', { code: voucherCodeToApply.toUpperCase(), scope: result.voucher.scope })
      } else {
        setAppliedVoucher(null)
        const errorMsg = result.error || 'Mã không hợp lệ hoặc đã hết hạn'
        setVoucherError(errorMsg)
        setToast({ type: 'error', message: errorMsg })
        console.error('[POS] Voucher validation failed:', result.error)
      }
    } catch (error) {
      setAppliedVoucher(null)
      const errorMsg = 'Lỗi kiểm tra voucher'
      setVoucherError(errorMsg)
      setToast({ type: 'error', message: errorMsg })
      console.error('[ERROR] Voucher validation failed:', error)
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  const handleClearVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCode('')
    setVoucherError(null)
  }

  // ─────────────────────────────────────────────────────────────
  // SUBMIT ORDER
  // ─────────────────────────────────────────────────────────────

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = appliedVoucher?.discountAmount || 0
  const shippingAmount = orderType === 'Giao hàng' ? shippingFee : 0
  const finalAmount = Math.max(0, totalAmount - discountAmount + shippingAmount)
  const isDeliveryMissingInfo = orderType === 'Giao hàng' && (!customerPhone.trim() || !deliveryAddress)

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      setToast({ type: 'error', message: 'Giỏ hàng trống' })
      return
    }

    if (orderType === 'Giao hàng') {
      if (!customerPhone.trim() || !deliveryAddress) {
        setToast({ type: 'error', message: 'Vui lòng nhập SĐT và địa chỉ để giao hàng' })
        return
      }
      if (isOutOfServiceArea) {
        setToast({ type: 'error', message: 'Địa chỉ giao hàng ngoài vùng phục vụ' })
        return
      }
    }

    setIsSubmitting(true)

    try {
      let finalCustomerId: number | null = null
      if (selectedCustomer?.customerid) {
        finalCustomerId = Number(selectedCustomer.customerid)
      }

      console.log('[POS] Checkout - customerid:', finalCustomerId, 'ordertype:', orderType, 'shippingfee:', shippingAmount)

      const orderId = await orderService.createOrder({
        branchid: branchId,
        customerid: finalCustomerId,
        totalamount: totalAmount,
        discountamount: discountAmount,
        shippingfee: orderType === 'Giao hàng' ? shippingFee : 0,
        finalamount: finalAmount,
        paymentmethod: paymentMethod,
        ordertype: orderType,
        note: orderNote || undefined,
        address_detail: orderType === 'Giao hàng'
          ? `[SĐT: ${customerPhone.trim()}] ${deliveryAddress?.address_detail || ''}`.trim()
          : null,
        customer_latitude: orderType === 'Giao hàng' ? deliveryAddress?.customer_latitude : null,
        customer_longitude: orderType === 'Giao hàng' ? deliveryAddress?.customer_longitude : null,
        city: orderType === 'Giao hàng' ? deliveryAddress?.city : null,
        ward: orderType === 'Giao hàng' ? deliveryAddress?.ward : null
      })

      for (const item of cartItems) {
        await orderService.addOrderDetail({
          orderid: orderId,
          productid: item.productid,
          sizeid: item.sizeid,
          quantity: item.quantity,
          sugarlevel: item.sugarlevel,
          icelevel: item.icelevel,
          priceatorder: item.priceatorder,
          subtotal: item.subtotal,
          toppings: item.toppings
        })
      }

      // Reset form
      setCartItems([])
      setSelectedCustomer(null)
      setCustomerPhone('')
      setAppliedVoucher(null)
      setVoucherCode('')
      setOrderNote('')
      setPaymentMethod('Tiền mặt')
      setOrderType('Tại chỗ')
      setShippingFee(0)
      setDeliveryAddress(null)
      setDeliveryAddressInput('')
      setDistanceKm(null)
      setIsOutOfServiceArea(false)

      setToast({
        type: 'success',
        message: `Đơn hàng ${orderId} đã được tạo!`
      })

      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('[ERROR] Create order failed:', error)
      setToast({ type: 'error', message: 'Lỗi tạo đơn hàng' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (branchId === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <p style={{ color: GRAY_TEXT }}>Đang khởi tạo...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex' }}>
      {/* ═══════════════════════════════════════════════════════════
          LEFT SIDE: MENU
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ flex: '2', overflowY: 'auto', padding: '24px', borderRight: `1px solid ${BORDER_LIGHT}` }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#2B3674', marginBottom: '20px' }}>
          Chọn sản phẩm
        </h2>

        {isLoadingMenu ? (
          <p style={{ color: GRAY_TEXT, textAlign: 'center' }}>Đang tải menu...</p>
        ) : products.length === 0 ? (
          <p style={{ color: GRAY_TEXT, textAlign: 'center' }}>Không có sản phẩm</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '16px'
            }}
          >
            {products.map((product) => (
              <ProductCard key={product.productid} product={product} onProductClick={openProductModal} />
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT SIDE: CART + PAYMENT
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ flex: '1', overflowY: 'auto', padding: '24px', backgroundColor: '#FAFAFA' }}>
        {/* ─── CUSTOMER SEARCH ─── */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: GRAY_TEXT }}>
              Số điện thoại khách hàng
            </label>
            {orderType === 'Giao hàng' && (
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#f06192', backgroundColor: '#fff0f5', padding: '2px 7px', borderRadius: '6px', border: '1px solid #f06192' }}>
                BẮT BUỘC
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={orderType === 'Giao hàng' ? 'Nhập SĐT để giao hàng...' : 'Nhập SĐT...'}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchCustomer()}
              className={orderType === 'Giao hàng' && !customerPhone.trim() ? 'delivery-required-field' : ''}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: orderType === 'Giao hàng' && !customerPhone.trim()
                  ? `2px solid #f06192`
                  : `1px solid #E8E8E8`,
                borderRadius: '12px',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                transition: 'border-color 0.2s'
              }}
            />
            <button
              onClick={handleSearchCustomer}
              style={{
                padding: '10px 16px',
                backgroundColor: PINK_PRIMARY,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Tìm
            </button>
          </div>

          {/* Customer Status Display */}
          {selectedCustomer && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px',
                backgroundColor: PINK_LIGHT,
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '500',
                color: PINK_PRIMARY
              }}
            >
              Thành viên: {selectedCustomer.fullname} - Điểm: {selectedCustomer.totalpoints}
            </div>
          )}

          {customerPhone && !selectedCustomer && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px',
                backgroundColor: '#F0F0F0',
                borderRadius: '10px',
                fontSize: '12px',
                color: GRAY_TEXT
              }}
            >
              Khách lẻ
            </div>
          )}
        </div>

        {/* ─── CART ITEMS ─── */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#2B3674', margin: 0 }}>
              Danh sách ({cartItems.length})
            </h3>
            <span style={{ fontSize: '12px', fontWeight: '600', color: GRAY_TEXT, fontStyle: 'italic', backgroundColor: '#F0F0F0', padding: '4px 8px', borderRadius: '6px' }}>
              {selectedCustomer ? selectedCustomer.fullname : 'Khách lẻ'}
            </span>
          </div>

          {cartItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                color: GRAY_TEXT,
                fontSize: '13px'
              }}
            >
              Giỏ hàng trống
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '12px',
                    border: `1px solid ${BORDER_LIGHT}`,
                    fontSize: '12px'
                  }}
                >
                  {/* Product Name & Subtotal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: '700', color: '#2B3674', flex: 1 }}>{item.productname}</span>
                    <span style={{ fontWeight: '700', color: PINK_PRIMARY, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {(item.subtotal).toLocaleString()}đ
                    </span>
                  </div>

                  {/* Size, Sugar, Ice */}
                  <div style={{ marginBottom: '8px', color: GRAY_TEXT, fontSize: '11px', lineHeight: 1.4 }}>
                    <div>{item.sizename} • {item.priceatorder.toLocaleString()}đ</div>
                    <div>Đường {item.sugarlevel} • Đá {item.icelevel}</div>
                  </div>

                  {/* Toppings */}
                  {item.toppings.length > 0 && (
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#9E9E9E' }}>
                      Topping: {item.toppings.map((t) => t.name).join(', ')}
                    </div>
                  )}

                  {/* Quantity & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#F0F0F0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#2B3674'
                        }}
                      >
                        −
                      </button>
                      <span style={{ width: '24px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#F0F0F0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#2B3674'
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#FFE5E5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={14} color="#E85D5D" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── VOUCHER SECTION (Smart Dropdown) ─── */}
        <VoucherSelector
          publicVouchers={publicVouchers}
          personalVouchers={customerVouchers}
          appliedVoucher={appliedVoucher}
          onApplyVoucher={handleApplyVoucher}
          onClearVoucher={handleClearVoucher}
          isValidating={isValidatingVoucher}
          errorMessage={voucherError ?? undefined}
        />

        {/* ─── ORDER NOTE ─── */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: GRAY_TEXT, marginBottom: '8px' }}>
            Ghi chú đơn
          </label>
          <textarea
            placeholder="(Không bắt buộc)"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid #E8E8E8`,
              borderRadius: '12px',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              minHeight: '60px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* ─── ORDER TYPE ─── */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: GRAY_TEXT, marginBottom: '8px' }}>
            Hình thức nhận hàng
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setOrderType('Tại chỗ')
                setShippingFee(0)
                setDeliveryAddress(null)
                setDeliveryAddressInput('')
                setDistanceKm(null)
                setIsOutOfServiceArea(false)
              }}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: orderType === 'Tại chỗ' ? `2px solid ${PINK_PRIMARY}` : '1px solid #E8E8E8',
                borderRadius: '8px',
                backgroundColor: orderType === 'Tại chỗ' ? PINK_LIGHT : '#FFFFFF',
                color: orderType === 'Tại chỗ' ? PINK_PRIMARY : '#2B3674',
                fontWeight: orderType === 'Tại chỗ' ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Tại chỗ
            </button>
            <button
              onClick={() => setOrderType('Giao hàng')}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: orderType === 'Giao hàng' ? `2px solid ${PINK_PRIMARY}` : '1px solid #E8E8E8',
                borderRadius: '8px',
                backgroundColor: orderType === 'Giao hàng' ? PINK_LIGHT : '#FFFFFF',
                color: orderType === 'Giao hàng' ? PINK_PRIMARY : '#2B3674',
                fontWeight: orderType === 'Giao hàng' ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Giao hàng
            </button>
          </div>
        </div>

        {/* DELIVERY ADDRESS INPUT - CONDITIONAL RENDERING */}
        {orderType === 'Giao hàng' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: GRAY_TEXT }}>
                Địa chỉ giao hàng
              </label>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#f06192', backgroundColor: '#fff0f5', padding: '2px 7px', borderRadius: '6px', border: '1px solid #f06192' }}>
                BẮT BUỘC
              </span>
            </div>

            <DeliveryAddressInput
              branchLatitude={branchCoordinates?.latitude || 0}
              branchLongitude={branchCoordinates?.longitude || 0}
              onAddressSelect={handleAddressSelect}
            />

            {/* Out of Service Warning - only show if applicable */}
            {isOutOfServiceArea && distanceKm !== null && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#FFE8E8',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#D32F2F',
                  fontWeight: '500'
                }}
              >
                Ngoài vùng phục vụ ({distanceKm.toFixed(1)} km)
              </div>
            )}
          </div>
        )}

        {/* SHIPPING FEE - READ ONLY */}
        {orderType === 'Giao hàng' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: GRAY_TEXT, marginBottom: '8px' }}>
              Phí vận chuyển
            </label>
            <div
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${BORDER_LIGHT}`,
                borderRadius: '12px',
                fontSize: '13px',
                backgroundColor: '#FAFAFA',
                fontFamily: 'Be Vietnam Pro, sans-serif',
                color: '#f06192',
                fontWeight: '700'
              }}
            >
              {shippingFee.toLocaleString('vi-VN')}đ
            </div>
          </div>
        )}

        {/* ─── PAYMENT METHOD ─── */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: GRAY_TEXT, marginBottom: '8px' }}>
            Thanh toán
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={paymentMethod === 'Tiền mặt'}
                onChange={() => setPaymentMethod('Tiền mặt')}
              />
              <span style={{ fontSize: '13px', color: '#2B3674' }}>Tiền mặt</span>
            </label>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={paymentMethod === 'Chuyển khoản'}
                onChange={() => setPaymentMethod('Chuyển khoản')}
              />
              <span style={{ fontSize: '13px', color: '#2B3674' }}>Chuyển khoản</span>
            </label>
          </div>
        </div>

        {/* ─── TOTAL & CHECKOUT ─── */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${BORDER_LIGHT}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px'
          }}
        >
          <div style={{ marginBottom: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: GRAY_TEXT }}>
              <span>Tạm tính:</span>
              <span style={{ fontWeight: '600' }}>{totalAmount.toLocaleString()}đ</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#D32F2F' }}>
                <span>Giảm giá:</span>
                <span style={{ fontWeight: '600' }}>-{discountAmount.toLocaleString()}đ</span>
              </div>
            )}
            {shippingAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#0066CC' }}>
                <span>Phí vận chuyển:</span>
                <span style={{ fontWeight: '600' }}>+{shippingAmount.toLocaleString()}đ</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '700',
              fontSize: '16px',
              color: PINK_PRIMARY,
              borderTop: `1px solid ${BORDER_LIGHT}`,
              paddingTop: '12px'
            }}
          >
            <span>Tổng:</span>
            <span>{finalAmount.toLocaleString()}đ</span>
          </div>
        </div>

        {/* CHECKOUT BUTTON - DISABLED IF OUT OF SERVICE AREA */}
        <button
          onClick={handleSubmitOrder}
          disabled={cartItems.length === 0 || isSubmitting || isOutOfServiceArea || isDeliveryMissingInfo}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor:
              cartItems.length === 0 || isSubmitting || isOutOfServiceArea || isDeliveryMissingInfo
                ? '#DDD'
                : PINK_PRIMARY,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: cartItems.length === 0 || isSubmitting || isOutOfServiceArea || isDeliveryMissingInfo ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (cartItems.length > 0 && !isSubmitting && !isOutOfServiceArea && !isDeliveryMissingInfo) {
              e.currentTarget.style.backgroundColor = '#E64B7F'
            }
          }}
          onMouseLeave={(e) => {
            if (!isDeliveryMissingInfo && !isOutOfServiceArea) {
              e.currentTarget.style.backgroundColor = PINK_PRIMARY
            }
          }}
        >
          {isSubmitting ? 'Đang xử lý...' : isOutOfServiceArea ? 'Ngoài vùng phục vụ' : isDeliveryMissingInfo ? 'Nhập SĐT & địa chỉ giao hàng' : 'CHỐT ĐƠN & THU TIỀN'}
        </button>
      </div>

      {/* PRODUCT OPTIONS MODAL */}
      {modalState.open && modalState.product && (
        <ProductOptionsModal
          product={modalState.product}
          sizes={sizes}
          toppings={toppings}
          modalState={modalState}
          onSizeChange={(size) => setModalState({ ...modalState, selectedSize: size })}
          onSugarChange={(sugar) => setModalState({ ...modalState, selectedSugar: sugar })}
          onIceChange={(ice) => setModalState({ ...modalState, selectedIce: ice })}
          onToppingToggle={toggleTopping}
          onClose={closeProductModal}
          onAddToCart={handleAddToCartFromModal}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={2000}
        />
      )}
    </div>
  )
}

export default StaffPOS

// ═════════════════════════════════════════════════════════════════
// PRODUCT CARD COMPONENT (Simplified - Click to Open Modal)
// ═════════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: Product
  onProductClick: (product: Product) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  return (
    <div
      onClick={() => onProductClick(product)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        overflow: 'hidden',
        border: `2px solid ${PINK_LIGHT}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        height: '240px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 97, 146, 0.15)'
        e.currentTarget.style.borderColor = PINK_PRIMARY
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
        e.currentTarget.style.borderColor = PINK_LIGHT
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Product Image */}
      <div style={{ height: '140px', overflow: 'hidden', backgroundColor: '#F5F5F5', flexShrink: 0 }}>
        <img
          src={product.imageurl}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.currentTarget as any).style.display = 'none' }}
        />
      </div>

      {/* Product Info */}
      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: '#2B3674', lineHeight: 1.3 }}>
          {product.name}
        </h4>
        <p style={{ margin: '0', fontSize: '14px', color: PINK_PRIMARY, fontWeight: '700' }}>
          {((product.saleprice || product.baseprice) / 1000).toFixed(1)}K
        </p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// PRODUCT OPTIONS MODAL
// ═════════════════════════════════════════════════════════════════

interface ProductOptionsModalProps {
  product: Product
  sizes: Size[]
  toppings: Topping[]
  modalState: ModalState
  onSizeChange: (size: Size) => void
  onSugarChange: (sugar: string) => void
  onIceChange: (ice: string) => void
  onToppingToggle: (topping: Topping) => void
  onClose: () => void
  onAddToCart: () => void
}

const ProductOptionsModal: React.FC<ProductOptionsModalProps> = ({
  product,
  sizes,
  toppings,
  modalState,
  onSizeChange,
  onSugarChange,
  onIceChange,
  onToppingToggle,
  onClose,
  onAddToCart
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            borderBottom: `1px solid ${BORDER_LIGHT}`,
            position: 'sticky',
            top: 0,
            backgroundColor: '#FFFFFF'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#2B3674' }}>
            {product.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Product Image & Price */}
          <div style={{ textAlign: 'center' }}>
            <img
              src={product.imageurl}
              alt={product.name}
              style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
            />
            <p style={{ margin: 0, fontSize: '16px', color: PINK_PRIMARY, fontWeight: '700' }}>
              {((product.saleprice || product.baseprice) / 1000).toFixed(1)}K
            </p>
          </div>

          {/* Size Selection */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#2B3674', marginBottom: '10px', display: 'block' }}>
              CHỌN SIZE
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {sizes.map((size) => (
                <button
                  key={size.sizeid}
                  onClick={() => onSizeChange(size)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: modalState.selectedSize?.sizeid === size.sizeid ? 'none' : `2px solid ${BORDER_LIGHT}`,
                    backgroundColor: modalState.selectedSize?.sizeid === size.sizeid ? PINK_PRIMARY : '#FFFFFF',
                    color: modalState.selectedSize?.sizeid === size.sizeid ? '#FFFFFF' : '#2B3674',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sugar Selection */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#2B3674', marginBottom: '10px', display: 'block' }}>
              CHỌN ĐƯỜNG
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SUGAR_OPTIONS.map((sugar) => (
                <button
                  key={sugar}
                  onClick={() => onSugarChange(sugar)}
                  style={{
                    flex: '1 1 calc(20% - 7px)',
                    padding: '10px',
                    borderRadius: '10px',
                    border: modalState.selectedSugar === sugar ? 'none' : `2px solid ${BORDER_LIGHT}`,
                    backgroundColor: modalState.selectedSugar === sugar ? PINK_PRIMARY : '#FFFFFF',
                    color: modalState.selectedSugar === sugar ? '#FFFFFF' : '#2B3674',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '45px'
                  }}
                >
                  {sugar}
                </button>
              ))}
            </div>
          </div>

          {/* Ice Selection */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#2B3674', marginBottom: '10px', display: 'block' }}>
              CHỌN ĐÁ
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {ICE_OPTIONS.map((ice) => (
                <button
                  key={ice}
                  onClick={() => onIceChange(ice)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: modalState.selectedIce === ice ? 'none' : `2px solid ${BORDER_LIGHT}`,
                    backgroundColor: modalState.selectedIce === ice ? PINK_PRIMARY : '#FFFFFF',
                    color: modalState.selectedIce === ice ? '#FFFFFF' : '#2B3674',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {ice}
                </button>
              ))}
            </div>
          </div>

          {/* Topping Selection */}
          {toppings.length > 0 && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#2B3674', marginBottom: '10px', display: 'block' }}>
                CHỌN TOPPING
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                {toppings.map((topping) => {
                  const isSelected = modalState.selectedToppings.some((t) => t.toppingid === topping.toppingid)
                  return (
                    <button
                      key={topping.toppingid}
                      onClick={() => onToppingToggle(topping)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: isSelected ? 'none' : `2px solid ${BORDER_LIGHT}`,
                        backgroundColor: isSelected ? PINK_PRIMARY : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#2B3674',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      {topping.name}
                      <br />
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>+{(topping.price / 1000).toFixed(0)}K</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={onAddToCart}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: PINK_PRIMARY,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginTop: '10px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E64B7F'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = PINK_PRIMARY
            }}
          >
            THÊM VÀO GIỎ HÀNG
          </button>
        </div>
      </div>
    </div>
  )
}
