# Kiểm tra Validation Dữ liệu - Phần Employees

**Ngày kiểm tra**: 24/03/2026

## 📊 Tóm tắt

Phần Employees hiện tại **thiếu validation** khá nhiều. Chỉ có kiểm tra cơ bản khi thêm nhân viên, nhưng validation không toàn diện cho tất cả trường dữ liệu và không có real-time feedback cho người dùng.

---

## 🔴 Các vấn đề tìm thấy

### 1. **Fullname (Tên nhân viên)**
- ❌ Không kiểm tra độ dài tối thiểu/tối đa
- ❌ Không loại bỏ khoảng trắng (trim)
- ❌ Không kiểm tra ký tự đặc biệt không hợp lệ
- ❌ Cho phép chỉ toàn khoảng trắng
- ❌ Không phát hiện lỗi tại thời điểm nhập

**Vấn đề**: Người dùng có thể nhập "   " hoặc tên quá dài, không có cảnh báo trước

---

### 2. **Email**
- ⚠️ Có `type="email"` nhưng không dùng JavaScript validation
- ❌ Không kiểm tra định dạng email đúng
- ❌ Không kiểm tra độ dài
- ❌ Không loại bỏ khoảng trắng thừa
- ❌ Có thể chứa ký tự không hợp lệ
- ❌ Không kiểm tra email đã tồn tại trong DB

**Vấn đề**: `type="email"` browser validation không tin cậy + có thể lưu email sai định dạng

---

### 3. **Phone (Số điện thoại)**
- ❌ Không kiểm tra định dạng (chỉ chấp nhận số, không dấu gạch ngang v.v.)
- ❌ Không kiểm tra độ dài (số Việt Nam từ 10-11 chữ số)
- ❌ Cho phép để trống (mặc dù là trường quan trọng)
- ❌ Cho phép nhập chữ cái, ký tự đặc biệt
- ❌ Không loại bỏ khoảng trắng

**Vấn đề**: Có thể nhập "abc123" hoặc "1234" (quá ngắn) mà không bị lỗi

---

### 4. **Position (Vị trí)**
- ✅ Sử dụng select → đã được kiểm soát
- ⚠️ Nhưng không validate nếu người dùng bypass từ console

**Vấn đề**: Nếu người dùng tấn công từ console, có thể nhập vị trí không hợp lệ

---

### 5. **Branchid (Chi nhánh)**
- ❌ Chỉ kiểm tra nếu Super Admin
- ❌ Không kiểm tra branchid có hợp lệ không (có tồn tại trong DB không)
- ❌ Cho phép để trống (dù là bắt buộc)

**Vấn đề**: Branch Manager có thể bypass logic

---

### 6. **Status (Trạng thái)**
- ⚠️ Sử dụng select trong edit modal
- ❌ Nhưng trong add modal không có field này
- ❌ Không validate giá trị status hợp lệ

**Vấn đề**: Tính không nhất quán, có thể lửi dữ liệu sai

---

## 📋 Chi tiết các hàm validation hiện tại

### ✅ Hiện có:
```typescript
// Trong handleAddEmployee
if (!formData.fullname || !formData.email || !formData.branchid) {
  setToast({ message: 'Vui lòng điền đầy đủ thông tin', type: 'error' })
  return
}
```

### ❌ Thiếu:
- `handleUpdateEmployee`: Không có validation gì cả
- Email format validation
- Phone format/length validation
- XSS prevention (sanitization)
- Duplicate email check
- Trim whitespace
- Real-time validation feedback

---

## 🎯 Danh sách Issues cụ thể

| # | Trường | Vấn đề | Mức độ | Giải pháp |
|---|--------|--------|--------|-----------|
| 1 | Fullname | Không trim/kiểm tra độ dài | 🟡 Trung bình | Trim + 2-100 ký tự |
| 2 | Email | Không validate format | 🔴 Cao | Regex + kiểm tra trùng |
| 3 | Phone | Không kiểm tra định dạng VN | 🔴 Cao | Regex (10-11 số) |
| 4 | Branchid | Không kiểm tra hợp lệ | 🟡 Trung bình | Check nó trong branches array |
| 5 | Update | Không có validation | 🔴 Cao | Thêm validation như Add |
| 6 | Real-time | Không có feedback ngay | 🟡 Trung bình | Thêm error state + display |

---

## 💡 Khuyến nghị

### Ngắn hạn (Essential):
1. ✅ Thêm email validation (format + lowercase)
2. ✅ Thêm phone validation (Việt Nam 10-11 số)
3. ✅ Trim tất cả text inputs
4. ✅ Thêm validation vào updateEmployee
5. ✅ Fullname: 2-100 ký tự

### Trung hạn (Recommended):
1. 📝 Tạo utility file `validationUtils.ts` cho reusable validators
2. 📝 Thêm real-time validation feedback (error message bên dưới field)
3. 📝 Kiểm tra email trùng trong DB trước khi lưu
4. 📝 Sanitize inputs chống XSS

### Dài hạn (Nice to have):
1. 📊 Validation schemas với Zod/Yup
2. 🔐 Rate limiting trên API
3. 📱 Mobile phone number formatting
4. 🌐 Multi-language error messages

---

## 📝 Code locations cần sửa

- **File**: `src/pages/Employees.tsx`
  - Line ~282: `handleAddEmployee()` - Thêm validation
  - Line ~304: `handleUpdateEmployee()` - Thêm validation
  - Form inputs (Line ~570-650, 680-750) - Thêm error display
  
- **Cần tạo**: `src/utils/validationUtils.ts` - Helper functions

---

## ✅ Danh sách hành động

- [ ] Tạo validation utility functions
- [ ] Update Employees.tsx với validation
- [ ] Thêm error state đến form modals
- [ ] Test tất cả trường nhập liệu
- [ ] Kiểm tra lại sau sửa

