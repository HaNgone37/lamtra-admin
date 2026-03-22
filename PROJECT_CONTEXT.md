# 🍵 LAM TRÀ SYSTEM - ADMIN DASHBOARD CONTEXT

## 1. TỔNG QUAN DỰ ÁN
- **Tên dự án:** Hệ thống quản lý chuỗi cửa hàng đồ uống Lam Trà.
- **Mục tiêu:** Xây dựng Dashboard quản trị cho Super Admin, Manager và Staff.
- **Trạng thái:** Tách biệt Repository (lamtra-admin), khởi tạo mới bằng Vite + React + TypeScript.

## 2. TECH STACK & CONFIG
- **Frontend:** React 18, TypeScript, Vite.
- **UI Style:** Light Theme, hiện đại, bo góc (Radius: 20px), màu chủ đạo Blue (#4318FF) và White (#FFFFFF), Font: Inter/Sans-serif.
- **Icons:** `lucide-react`.
- **Database & Auth:** Supabase (PostgreSQL). 
- **API Strategy:** Gọi trực tiếp Supabase SDK (`@supabase/supabase-js`) từ Frontend cho các thao tác CRUD. Node.js chỉ dùng cho các nghiệp vụ đặc thù (Payment, ZNS).

## 3. CẤU TRÚC THƯ MỤC HIỆN TẠI (LATEST)
/src
 ┣ /assets       (Hình ảnh, Icons)
 ┣ /components   (Sidebar.tsx, Layout.tsx, Card.tsx)
 ┣ /pages        (Dashboard.tsx, Products.tsx, Orders.tsx, Employees.tsx)
 ┣ /services     (productService.ts, orderService.ts, authService.ts)
 ┣ /types        (Định nghĩa Interface cho Database)
 ┣ /utils        (supabaseClient.ts)
 ┗ App.tsx       (Router chính)

## 4. ĐẶC TẢ CƠ SỞ DỮ LIỆU (SUPABASE)
**Quy tắc:** Tên bảng/cột 100% `lowercase`. Tiền tệ `int8` (VNĐ). Tọa độ `float8`. Thời gian `timestamptz+07`.

### Bảng cốt lõi (Đã có Seed Data):
- `branches`: `branchid` (PK), `name`, `address`, `longitude`, `latitude`, `isactive`.
- `categories`: `categoryid` (PK), `name`, `description`.
- `products`: `productid` (PK), `name`, `subtitle`, `description`, `baseprice`, `imageurl`, `status`, `categoryid` (FK).
- `toppings`: `toppingid` (PK), `name`, `price`, `imageurl`.
- `sizes`: `sizeid` (PK), `name`, `additionalprice`.
- `branchproductstatus`: `branchid` (FK), `productid` (FK), `status` (Còn món/Hết món).
- `accounts`: `accountid` (PK-UUID), `role` (Admin/Manager/Staff), `branchid` (FK), `employeeid` (FK).

### Bảng nghiệp vụ (Đã có 5 đơn hàng mẫu):
- `orders`: `orderid` (PK-varchar), `totalamount`, `finalamount`, `status` (Chờ/Đang làm/Xong/Hủy), `branchid` (FK), `orderdate`.
- `orderdetails`: `orderid` (FK), `productid` (FK), `quantity`, `subtotal`.

## 5. PHÂN QUYỀN & NGHIỆP VỤ (RBAC)
- **Super Admin:** Quản lý toàn bộ chi nhánh, thực đơn tổng, xem doanh thu toàn quốc.
- **Branch Manager:** Chỉ xem data thuộc `branchid` của mình. Quản lý nhân viên chi nhánh, bật/tắt món tại chi nhánh (`branchproductstatus`).
- **Staff:** Tiếp nhận đơn hàng Realtime. Đổi trạng thái đơn hàng (Chờ -> Đang làm -> Xong).
- **Realtime:** Sử dụng `supabase.channel` để lắng nghe thay đổi bảng `orders` và thông báo cho Staff/Manager ngay lập tức.

## 6. LOGIC TRỪ KHO (INVENTORY REDUCTION)
- Mỗi sản phẩm/size/topping có định lượng trong bảng `recipes`.
- Khi đơn hàng chuyển sang trạng thái 'Xong', hệ thống thực hiện trừ kho tự động trong bảng `branchinventory` (Lưu ý: Logic này ưu tiên xử lý sau, hiện tại tập trung hiển thị đơn hàng).

## 7. QUY TẮC CODE DÀNH CHO AI (CLAUDE/GPT)
1. **TypeScript First:** Luôn định nghĩa Interface cho dữ liệu trả về từ Supabase.
2. **Component Separation:** Tách logic fetch dữ liệu vào thư mục `/services`.
3. **Clean UI:** Sử dụng CSS Inline hoặc Tailwind. Màu sắc tuân thủ bảng màu Blue-White của Horizon UI.
4. **Error Handling:** Luôn có `try-catch` và thông báo lỗi khi thao tác với Supabase.
5. **Context Awareness:** Luôn kiểm tra `role` của user trước khi hiển thị các tính năng nhạy cảm.

## 8. QUẢN LÝ TÍCH ĐIỂM LOYALTY
1. **Tỷ lệ tích điểm:** 10.000 VNĐ chi tiêu = 1 Điểm tích lũy. (VD: Đơn 50k = 5 điểm).
2. **Hạng thành viên (Dựa trên totalpoints):**
- Đồng: < 100 điểm.
- Bạc: 100 - 499 điểm.
- Vàng: ≥ 500 điểm.
3. **Luồng cộng điểm:** Khi Staff (Bên Admin của bạn) bấm trạng thái đơn hàng thành 'Xong', hệ thống sẽ cộng điểm cho khách.
4. **Luồng trừ điểm:** Khi Khách (Bên Web khách) bấm 'Đổi voucher', hệ thống sẽ trừ điểm của khách.