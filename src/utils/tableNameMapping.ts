// ============= TABLE NAME TO VIETNAMESE MAPPING =============
// Dùng để dịch tên bảng code sang tiếng Việt tự nhiên
// TUYỆT ĐỐI KHÔNG DÙNG TÊN BẢNG CODE TRONG UI

export const tableNameMapping: Record<string, string> = {
  // Bảng Orders & Details
  'orderdetails': 'Đơn hàng đã đặt',
  'ordertoppings': 'Topping trong đơn hàng',
  'orders': 'Đơn hàng',
  
  // Bảng Catalog
  'branchproductstatus': 'Trạng thái sản phẩm tại chi nhánh',
  'recipes': 'Công thức pha chế',
  'product_favorites': 'Sản phẩm yêu thích của khách',
  'products': 'Sản phẩm',
  'categories': 'Danh mục',
  'sizes': 'Kích thước',
  'toppings': 'Topping',
  
  // Bảng Inventory
  'branchinventory': 'Tồn kho tại chi nhánh',
  'stockreceipts': 'Phiếu nhập kho',
  'receiptdetails': 'Chi tiết nhập kho',
  'inventoryaudits': 'Phiếu kiểm kho',
  'auditdetails': 'Chi tiết kiểm kho',
  'ingredients': 'Nguyên liệu',
  
  // Bảng CRM & Marketing
  'customervouchers': 'Voucher khách đã nhận',
  'pointhistory': 'Lịch sử điểm thưởng',
  'vouchers': 'Chương trình khuyến mãi',
  
  // Bảng Users & Management
  'accounts': 'Tài khoản hệ thống',
  'employees': 'Nhân viên',
  'customers': 'Khách hàng',
  'branches': 'Chi nhánh cửa hàng',
  
  // Bảng Media & Content
  'news': 'Bài viết tin tức',
  'reviews': 'Đánh giá khách hàng',
  'feedbacks': 'Phản hồi từ khách',
  'media': 'Hình ảnh & tài liệu',
}

/**
 * Hàm để dịch tên bảng code sang tiếng Việt
 * @param tableName - Tên bảng code (ví dụ: 'orderdetails')
 * @returns Tên bảng tiếng Việt (ví dụ: 'Đơn hàng đã đặt')
 */
export function getTableDisplayName(tableName: string): string {
  return tableNameMapping[tableName] || tableName
}

/**
 * Hàm để dịch một mảng tên bảng code sang tiếng Việt
 * @param tableNames - Mảng tên bảng code
 * @returns Mảng tên bảng tiếng Việt
 */
export function getTableDisplayNames(tableNames: string[]): string[] {
  return tableNames.map(name => getTableDisplayName(name))
}
