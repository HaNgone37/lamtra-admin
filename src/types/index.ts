// Database Types
export interface Branch {
  branchid: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  isactive: boolean;
}

export interface Category {
  categoryid: string;
  name: string;
  description: string;
}

export interface Product {
  productid: string;
  name: string;
  subtitle: string;
  description: string;
  baseprice: number;
  imageurl: string;
  status: string;
  categoryid: string;
}

export interface Topping {
  toppingid: string;
  name: string;
  price: number;
  imageurl: string;
  isavailable: boolean;
}

export interface Size {
  sizeid: string;
  name: string;
  additionalprice: number;
}

export interface BranchProductStatus {
  branchid: string;
  productid: string;
  status: 'available' | 'unavailable';
}

export interface Account {
  accountid: string;
  role: 'admin' | 'manager' | 'staff';
  branchid: string;
  employeeid: string;
}

export interface Order {
  orderid: string;
  totalamount: number;
  finalamount: number;
  status: 'chờ' | 'đang làm' | 'xong' | 'hủy' | string;
  branchid: string;
  orderdate: string;
}

export interface OrderDetail {
  orderid: string;
  productid: string;
  quantity: number;
  subtotal: number;
}

export interface Employee {
  employeeid: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  branchid: string;
  status: string;
}

export interface Ingredient {
  ingredientid: string;
  name: string;
  unit: string;
  baseprice: number;
  minstocklevel?: number;
}

export interface Recipe {
  recipeid?: string;
  productid: string;
  ingredientid: string;
  amount: number; // số lượng nguyên liệu trong công thức
  product?: Product;
  ingredient?: Ingredient;
}

export interface BranchInventory {
  branchid: string;
  ingredientid: string;
  currentstock: number;
  ingredient?: Ingredient;
}

export interface News {
  newsid: string;
  title: string;
  content: string;
  type: 'Khuyến mãi' | 'Tuyển dụng' | 'Tin tức';
  status: 'Hiện' | 'Ẩn';
  publisheddate: string;
  thumbnail: string;
}

export interface Media {
  mediaid: string;
  path: string;
  filetype: 'image' | 'video';
  newsid?: string;
  reviewid?: string;
  createddate: string;
}

export interface Review {
  reviewid: string;
  rating: number;
  comment: string;
  createdat: string;
  customerid: string;
  orderid: string;
  productid: string;
  sentiment: 'Tích cực' | 'Tiêu cực' | 'Trung lập';
  product?: Product;
}

export interface Customer {
  customerid: string;
  authid: string;
  fullname: string;
  phone: string;
  email: string;
  totalpoints: number;
  membership: string;
  birthday?: string;
}

export interface Voucher {
  voucherid: string;
  code: string;
  title: string;
  discountvalue: number;
  discounttype: string;
  expirydate: string;
  iswelcome: boolean;
  pointsrequired: number;
  created_at: string;
}

// UI Types
export interface User extends Account {
  email: string;
  name: string;
}
