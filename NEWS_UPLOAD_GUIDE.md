# 📸 Hướng Dẫn Upload Ảnh Bài Viết

## ✨ Tính Năng Mới

Tính năng upload ảnh trong News.tsx đã được cập nhật với các cải tiến:

### 1. **Drag & Drop Interface** (Kéo & Thả)
- Kéo ảnh trực tiếp vào vùng upload
- Hoặc nhấp vào vùng để chọn file từ máy tính
- Giao diện thân thiện, chuyên nghiệp

### 2. **Supabase Storage Integration**
- Upload lên bucket: `lamtra-media`
- Folder: `news/`
- Đường dẫn file tự động: `news/{timestamp}_{filename}`
- Ví dụ: `news/1712234567890_image.jpg`

### 3. **Progress Bar & Status**
- Hiển thị thanh tiến trình khi đang upload
- Thông báo "Đang xử lý ảnh..." trong lúc upload
- Tự động lấy public URL sau khi hoàn thành

### 4. **Image Preview**
- Xem trước ảnh ngay sau khi chọn/upload
- Nút X để xóa ảnh đã chọn

### 5. **Error Handling**
- Kiểm tra định dạng file: chỉ `.jpg`, `.png`, `.webp`
- Kiểm tra kích thước: tối đa 5MB
- Thông báo lỗi chi tiết nếu có vấn đề

---

## 🔧 Cấu Hình Kỹ Thuật

### Supabase Storage Path
```
Bucket: lamtra-media
Folder: news/
File Path Formula: 'news/' + Date.now() + '_' + original_filename
```

### Database
- **Bảng**: `news` (lowercase như cũ)
- **Cột**: `thumbnail` (auto-filled sau khi upload)
- Lưu public URL từ Supabase

### File Formats Hỗ Trợ
- ✅ `.jpg` / `.jpeg`
- ✅ `.png`
- ✅ `.webp`
- ❌ Định dạng khác sẽ hiện thông báo lỗi

### Max File Size
- 5 MB

---

## 📝 Cách Sử Dụng

### Tạo Bài Viết Mới
1. Nhấp **"Tạo bài viết"**
2. Điền **Tiêu đề** và **Nội dung**
3. Chọn **Loại** (Khuyến mãi / Tuyển dụng / Tin tức)
4. **Chọn ảnh**:
   - **Cách 1**: Kéo ảnh vào vùng upload
   - **Cách 2**: Nhấp để chọn file
5. Chờ upload hoàn thành (xem progress bar)
6. Xem trước ảnh
7. Nhấp **"Tạo"** để lưu bài viết

### Sửa Bài Viết
- Thay đổi ảnh: Nhấp nút sửa, rồi chọn ảnh mới
- Upload sẽ tự động replace thumbnail cũ

### Xóa Ảnh Đã Chọn
- Nhấp nút **X** trên preview ảnh
- Chọn ảnh khác hoặc bỏ trống

---

## 🐛 Troubleshooting

| Lỗi | Nguyên nhân | Cách Khắc Phục |
|-----|-----------|----------------|
| "Ch\u1ec9 h\u1ed7 tr\u1ee3 \u0111\u1ecbnh d\u1ea1ng .jpg, .png, .webp" | File sai định dạng | Chuyển đổi ảnh sang .jpg, .png, hoặc .webp |
| "File qu\u00e1 l\u1edbn, t\u1ed1i \u0111a 5MB" | Ảnh vượt quá 5MB | Nén ảnh lại trước khi upload |
| "L\u1ed7i upload \u1ea3nh" | Kết nối Supabase hoặc permissions | Kiểm tra Supabase config, bucket permissions |
| Preview không h\u00e0nh | Ảnh upload thất bại | Xem lại thông báo lỗi, ch\u1ecdn ảnh khác |

---

## 📦 Dependencies

Các thư viện được sử dụng:
- `@supabase/supabase-js` - Storage API
- `lucide-react` - Icons (Cloud, X)
- React builtin - FileReader API for preview

---

## 🎯 Ưu Điểm So Với Cách Cũ

| Trước | Sau |
|-------|-----|
| Input URL text thô | Drag & Drop chuyên nghiệp |
| Không preview trước | Preview ngay lập tức |
| URL manual dễ sai | Auto-generated public URL |
| Không theo dõi upload | Progress bar real-time |
| Có thể crash nếu URL sai | Validation & error handling |

---

## 📋 Checklist

- [x] Supabase bucket `lamtra-media` được tạo
- [x] Folder `news/` đã được chia sẵn
- [x] Drag & Drop UI hoàn thành
- [x] Upload logic với progress tracking
- [x] Error handling (định dạng, kích thước)
- [x] Image preview
- [x] Auto-fill thumbnail URL
- [x] Reset state sau khi save/cancel
- [x] TypeScript support
- [x] Build pass
