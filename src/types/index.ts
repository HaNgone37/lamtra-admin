// ============================================================================
// DATABASE SCHEMA TYPES - Complete Database Schema
// ============================================================================

// Phân hệ 1: Danh mục & Sản phẩm (Core Catalog)
export interface Branch {
  branchid: string | number
  name: string
  address: string
  longitude: number
  latitude: number
  isactive: boolean
}

export interface Category {
  categoryid: string | number
  name: string
  description: string
}

export interface Product {
  productid: string | number
  name: string
  subtitle: string
  description: string
  baseprice: number
  saleprice: number | null
  imageurl: string
  status: string
  categoryid: string | number
}

export interface Size {
  sizeid: string | number
  name: string
  additionalprice: number
}

export interface Topping {
  toppingid: string | number
  name: string
  price: number
  imageurl: string
  isavailable: boolean
}

export interface BranchProductStatus {
  branchid: string | number
  productid: string | number
  status: 'Còn món' | 'Hết món' | 'available' | 'unavailable'
}

// Phân hệ 2: Bán hàng & Giao dịch (Sales)
export interface Order {
  orderid: string
  totalamount: number
  discountamount?: number
  shippingfee?: number
  finalamount: number
  paymentmethod?: string
  ordertype?: string
  status: 'Chờ xác nhận' | 'Đang làm' | 'Đang giao' | 'Hoàn thành' | 'Hủy' | string
  orderdate: string
  branchid: string | number
  customerid?: string | number | null
}

export interface OrderDetail {
  orderdetailid?: string | number
  orderid: string
  productid: string | number
  sizeid?: string | number
  quantity: number
  sugarlevel?: string
  icelevel?: string
  priceatorder?: number
  subtotal: number
}

export interface OrderTopping {
  orderdetailid: string | number
  toppingid: string | number
  quantity: number
}

// Phân hệ 3: Quản lý Kho & Công thức (Inventory & Recipes)
export interface Ingredient {
  ingredientid: string | number
  name: string
  unit: string // g, ml, cái
  baseprice: number
  minstocklevel?: number
}

export interface Recipe {
  recipeid?: string | number
  productid: string | number
  sizeid?: string | number
  toppingid?: string | number
  ingredientid: string | number
  amount: number // định lượng tiêu hao
  product?: Product
  ingredient?: Ingredient
}

export interface BranchInventory {
  branchid: string | number
  ingredientid: string | number
  currentstock: number
  ingredient?: Ingredient
}

export interface StockReceipt {
  receiptid: string | number
  importdate: string
  totalcost: number
  branchid: string | number
  employeeid: string | number
}

export interface ReceiptDetail {
  receiptid: string | number
  ingredientid: string | number
  quantity: number
  unitprice: number
  amount: number // thành tiền
}

export interface InventoryAudit {
  auditid: string | number
  branchid: string | number
  employeeid: string | number
  auditdate: string
  note?: string
}

export interface AuditDetail {
  auditid: string | number
  ingredientid: string | number
  systemstock: number // tồn máy
  actualstock: number // tồn thực tế
  difference: number
  reason?: string
}

// Phân hệ 4: Marketing & Loyalty (CRM)
export interface Voucher {
  voucherid: number
  code: string
  title: string
  discountvalue?: number
  discount?: number // alias cho discountvalue
  maxdiscount?: number
  minordervalue?: number
  discounttype: '%' | 'Tiền mặt' | 'percentage' | 'fixed'
  expirydate: string
  iswelcome: boolean
  pointsrequired: number
  created_at: string
  description?: string
  isactive?: boolean
  discountpercent?: number
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
  discountvalue?: number
  discount?: number
  discounttype: string
  expirydate: string
  issuedCount?: number
  totalIssued?: number
  usedCount?: number
  totalUsed?: number
  usageRate: string
  pointsrequired: number
  iswelcome: boolean
  isactive?: boolean
}

export interface PointHistory {
  pointhistoryid: number
  customerid: number
  pointchange: number
  type: string
  orderid?: number | null
  description: string
  createddate: string
}

// Phân hệ 5: Người dùng & Truyền thông (Users & Media)
export interface Account {
  accountid: string | number
  role?: 'admin' | 'manager' | 'staff' | 'super admin' | 'super_admin'
  branchid?: string | number | null
  employeeid?: string | number
  isactive?: boolean
  isBanned?: boolean
}

export interface Employee {
  employeeid: string | number
  fullname: string
  email: string
  phone: string
  position?: string
  branchid: string | number
  status?: string
  created_at?: string
  name?: string // alias cho fullname
}

export interface EmployeeWithBranch extends Employee {
  branches?: Branch | { name: string }
  accounts?: Account[]
}

export interface EmployeeFormData {
  fullname: string
  email: string
  phone: string
  position: string
  branchid: string
  status: string
}

export interface Customer {
  customerid: number | string
  authid?: string
  fullname: string
  phone: string
  email: string
  totalpoints: number
  membership: 'Đồng' | 'Bạc' | 'Vàng' | string
  birthday?: string
}

export interface News {
  newsid: string | number
  title: string
  content: string
  type: 'Khuyến mãi' | 'Tuyển dụng' | 'Tin tức'
  status: 'Hiện' | 'Ẩn'
  publisheddate: string
  thumbnail: string
}

export interface Media {
  mediaid: string | number
  path: string
  filetype: 'image' | 'video'
  newsid?: string | number
  reviewid?: string | number
  createddate?: string
}

export interface Review {
  reviewid: string | number
  rating: number
  comment: string
  createdat: string
  customerid: string | number
  orderid: string
  productid: string | number
  sentiment: 'Tích cực' | 'Tiêu cực' | 'Trung lập'
  product?: Product
}

// ============================================================================
// UI/Component SPECIFIC TYPES
// ============================================================================

export interface User extends Account {
  email: string
  name: string
}

export interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  visible?: boolean
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (email: string, password: string) => Promise<void>
}

// ============================================================================
// EXTENDED/ENRICHED TYPES (Computed/UI)
// ============================================================================

export interface OrderWithDetails extends Order {
  orderdetails?: OrderDetail[]
  customer?: Customer
}

export interface EnrichedOrderDetail extends OrderDetail {
  product?: Product
  size?: Size
  toppings?: OrderTopping[]
  toppingDetails?: Topping[]
}

export interface EditingBranch extends Branch {
  isEditing?: boolean
}

export interface BranchProductStatusRow extends BranchProductStatus {
  product?: Product
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface LayoutProps {
  children: React.ReactNode
  sidebarOpen: boolean
  onMenuClick: () => void
  userName?: string
  userRole?: string
  branchName?: string
}

export interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  color?: string
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
  onClose?: () => void
}

// ============================================================================
// MODAL PROP TYPES
// ============================================================================

export interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  categories: Category[]
}

export interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Product) => Promise<void>
  product: Product
  categories: Category[]
}

export interface CreateVoucherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (voucher: Voucher) => void
  onError?: (message: string) => void
}

export interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Category) => Promise<void>
}

export interface SizeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Size) => Promise<void>
}

export interface ToppingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Topping) => Promise<void>
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string
  message: string
}

export interface EmployeeValidationErrors {
  fullname?: string
  email?: string
  phone?: string
  position?: string
  branchid?: string
  status?: string
}

