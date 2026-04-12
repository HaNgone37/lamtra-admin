# 📚 STAFF MODULE - HƯỚNG DẪN SỬ DỤNG

**Ngày tạo:** 11/04/2026  
**Phiên bản:** 1.0.0  
**Status:** ✅ PRODUCTION READY

---

## 📋 TỔNG QUAN

Module Staff được thiết kế đặc biệt cho **nhân viên pha chế (Barista)** với 3 chức năng chính:
1. **POS** - Hệ thống tính tiền bán hàng  
2. **KDS** - Kitchen Display System (Hiển thị đơn làm)
3. **Dashboard** - Thống kê tổng quan

---

## 🔑 CẤP QUYỀN & PHÂN LUỒNG

### Cấu trúc Role
- **Super Admin**: Truy cập toàn bộ hệ thống
- **Manager**: Quản lý 1 chi nhánh (Đơn hàng, Kho, Nhân sự)
- **Staff**: Chỉ có quyền POS & KDS

### Khi Staff đăng nhập
```
Staff Login → BaristaLayout (Navigation Bar với 3 tabs)
├── Dashboard (Tổng quan)
├── POS (Bán hàng)
└── KDS (Pha chế)
```

---

## ☕ POS (TÍNH TIỀN)

### Quy trình:
1. **Tìm kiếm khách** (nếu có tài khoản)
   - Nhập SĐT để tìm
   - Nếu không tìm thấy → "Khách lẻ" (không tích điểm)
   - Nếu có → Hiển thị tên, hạng, điểm hiện tại

2. **Chọn sản phẩm tư thực đơn**
   - Lưới 15 món trà sữa (có ảnh)
   - Click chọn → Hiện chi tiết Size/Đường/Đá/Số lượng
   - Thêm vào giỏ

3. **Tùy chỉnh ly (Size/Đường/Đá)**
   - **Size**: M/L (+ phí phụ tùy size)
   - **Đường**: 0%, 25%, 50%, 75%, 100%
   - **Đá**: 0%, 25%, 50%, 75%, 100%

4. **Nhập mã giảm giá (Voucher)**
   - Ô nhập mã → Hệ thống kiểm tra:
     - Mã có tồn tại?
     - Mã còn hạn?
   - Nếu OK → Tính tiền giảm
   - Nếu Failed → Hiển thị lỗi

5. **Chọn hình thức nhận hàng**
   - ☐ Tại chỗ (Phí: 0đ)
   - ☐ Giao hàng (Nhập địa chỉ + phí vận chuyển)

6. **Chọn hình thức thanh toán**
   - ☐ Tiền mặt
   - ☐ Chuyển khoản (QR, TK)

7. **Ghi chú đơn hàng**
   - Ô text tự do (VD: "Không đường", "Thêm lemon")

8. **Xác nhận thanh toán**
   - Nút lớn **THANH TOÁN** → Tạo đơn
   - Hệ thống sinh OrderID tự động
   - Giỏ hàng reset

---

## 🔥 KDS (KITCHEN DISPLAY SYSTEM)

### Giao diện:
- **Grid 2 cột** với các ô đơn hàng dạng "gạch"
- **Auto-refresh** mỗi 5 giây
- **Thông báo âm thanh** (Tít tít) khi có đơn mới

### Thông tin hiển thị trên mỗi ô:
```
┌─────────────────────────┐
│ #ORD-xxxx   👤 Khách tên │
│ ⏳ 15m      ⚠️ TRỄ        │
├─────────────────────────┤
│ 2x Trà sữa tài khoản    │
│   🍯 100%  🧊 75%       │
│ ⭐ 1x Boba              │
│                         │
│ 1x Cà phê đen           │
│   🍯 50%   🧊 0%        │
├─────────────────────────┤
│ ✓ Xác nhận  ✓ Xong     │
└─────────────────────────┘
```

### Chỉ báo thời gian (Wait Time)
- 🟢 **<10 phút**: Xanh (Bình thường)
- 🔴 **>10 phút**: Đỏ + "⚠️ TRỄ" (Cảnh báo)

### Phím tắt & Action
- **Xác nhận**: Chuyển từ "Chờ xác nhận" → "Đang làm"
- **Xong**: Đánh dấu hoàn thành (Ẩn khỏi KDS)

### Thanh thống kê (Top):
```
Chờ xác nhận: 3 | Đang làm: 5 | Max wait: 12m
```

---

## 📊 DASHBOARD (TỔNG QUAN)

### Hiển thị:
- 📈 Thống kê đơn hàng hôm nay
  - Tổng đơn
  - Tổng tiền
  - Trung bình tiền/đơn
  
- 🏪 Chi nhánh hiện tại
- 👤 Nhân viên hiện tại (Tên, Vị trí)

### Dữ liệu:** Chỉ hiển thị đơn của chi nhánh hiện tại (Branch Filter)

---

## 🔒 PHÂN QUYỀN & ẨN/HIỆN UI

### Staff **CHỈ** được nhìn thấy:
- ✅ Dashboard
- ✅ Orders (Chỉ đọc - không xóa)
- ✅ News (Read-only - không tạo/sửa)
  
### Staff **KHÔNG** được nhìn thấy:
- ❌ Products quản lý (Chỉ xem thực đơn)
- ❌ Employees
- ❌ Inventory quản lý (Chỉ xem tồn kho chi nhánh)
- ❌ Customers quản lý
- ❌ Branches
- ❌ Analytics
- ❌ Vouchers quản lý

### Các nút **LUÔN ẨN** cho Staff:
```
- [+ Thêm đơn hàng]
- [✎ Sửa đơn hàng]
- [🗑 Xóa đơn hàng]
- [+ Thêm sản phẩm]
- [✎ Sửa sản phẩm]
- [+ Nhập kho]
- [✎ Kiểm kho]
```

---

## 🛠️ CÔNG NGHỆ & ARCHITECTURE

### Tech Stack
- **Frontend**: React + TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS (Horizon UI Light Theme)
- **Icons**: lucide-react

### Color Palette (Horizon UI)
- 🔵 **Primary**: #4318FF (Xanh)
- ⚪ **White**: #FFFFFF
- 🧑 **Navy**: #2B3674
- ⚪ **Gray**: #F3F4F6
- 🔲 **Border Radius**: 20px (bo góc)

### Service Layer
```
src/services/
├── orderService.ts       ✅ CRUD + Real-time
├── voucherService.ts     ✅ Validation
└── customerService.ts    📝 Searching
```

### Components
```
src/components/staff/
├── CustomerSearch.tsx    👤 Tìm kiếm khách
├── POSMenu.tsx          ☕ Lưới menu
├── POSCart.tsx          🛒 Giỏ hàng
├── VoucherSection.tsx   🎟️ Voucher
└── KDSBoard.tsx         🔥 KDS Grid
```

---

## 📱 Real-time Features

### KDS Auto-update
```typescript
useEffect(() => {
  // Subscribe to orders change
  const subscription = orderService.subscribeToOrders(branchId, (payload) => {
    // Reload orders when INSERT/UPDATE happens
    loadOrders()
  })
  
  // Poll every 5 seconds (fallback)
  const interval = setInterval(loadOrders, 5000)
  
  return () => {
    subscription.unsubscribe()
    clearInterval(interval)
  }
}, [branchId])
```

### Sound Notification
- Tone 1: 800Hz (0.2s)
- Silence: 0.05s
- Tone 2: 600Hz (0.2s)
- **Result**: "Tít tít" sound 🔊

---

## 🐛 TROUBLESHOOTING

### Vấn đề: Không thấy đơn mới trên KDS
**Giải pháp:**
1. Kiểm tra branchId có đúng không (localStorage)
2. Refresh trang (F5)
3. Kiểm tra Supabase kết nối

### Vấn đề: Voucher không áp dụng
**Giải pháp:**
1. Kiểm tra mã voucher hết hạn chưa
2. Kiểm tra mã có đúng chính tả không (hoa/thường)
3. Kiểm tra toast message lỗi

### Vấn đề: Không tìm thấy khách
**Giải pháp:**
1. Kiểm tra SĐT nhập đúng không
2. Khách cần có tài khoản (Không tạo mới)
3. Dùng "Khách lẻ" (không tích điểm)

---

## ✅ CHECKLIST TESTING

- [ ] Login as Staff → Thấy 3 tabs (Dashboard, POS, KDS)
- [ ] POS: Thêm sản phẩm → Giỏ hàng đúng
- [ ] POS: Tìm khách → Tích điểm
- [ ] POS: Voucher → Giảm giá đúng
- [ ] POS: Submit → Tạo đơn thành công
- [ ] KDS: Xem đơn mới → Có âm thanh
- [ ] KDS: Wait time > 10m → Đỏ cảnh báo
- [ ] Dashboard: Chỉ thấy đơn chi nhánh mình
- [ ] Sidebar: Không thấy nút Add/Edit/Delete
- [ ] Logout: Quay lại Login

---

## 📞 SUPPORT

- **Lỗi kỹ thuật**: Liên hệ Admin
- **Câu hỏi POS**: Xem hướng dẫn trên UI
- **Reload KDS**: Nút F5 / Refresh Browser

---

**© 2026 LAM TRÀ - Hệ thống Quản lý Bán hàng Cà phê**
