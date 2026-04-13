# 🔧 FIX BRANCHINVENTORY - SCHEMA MISMATCH

## 🚨 Lỗi Phát Hiện

Lỗi khi tải tồn kho cho chi nhánh:
```
Error fetching branch inventory
[ERROR] loadBranchInventory failed
```

---

## 🎯 Nguyên Nhân: Schema Mismatch

### Schema Thực Tế (DATABASE_SCHEMA_DESIGN.md)
```
10. ingredients: 
    - ingredientid (PK)
    - name
    - unit (g, ml, cái)
    - baseprice
    - minstocklevel  ← Nằm ở đây

12. branchinventory:
    - branchid (FK)
    - ingredientid (FK)
    - currentstock
    (KHÔNG có minstocklevel!)
```

### ❌ Lỗi trong Code

#### Lỗi 1: Query `minstocklevel` từ `branchinventory`
```typescript
.select(`
  branchid,
  ingredientid,
  currentstock,
  minstocklevel,  ← ❌ LỖI! Cột này không tồn tại trong branchinventory
  ingredients(ingredientid, name, unit, baseprice, minstocklevel)
`)
```

**Vấn đề:** SQL sẽ báo lỗi undefined column 'minstocklevel' từ branchinventory

#### Lỗi 2: Insert `minstocklevel` vào `branchinventory`
```typescript
async addToInventory(branchId, ingredientId, currentstock, minstocklevel = 0) {
  await supabase
    .from('branchinventory')
    .insert([{
      branchid: branchId,
      ingredientid: ingredientId,
      currentstock,
      minstocklevel,  ← ❌ LỖI! Cột này không tồn tại
    }])
}
```

**Vấn đề:** INSERT sẽ fail vì cột `minstocklevel` không tồn tại trong bảng

---

## ✅ Giải Pháp

### Fix 1: Query đúng (Không lấy minstocklevel từ branchinventory)

**Trước:**
```typescript
.select(`
  branchid,
  ingredientid,
  currentstock,
  minstocklevel,  ← ❌ SAI
  ingredients(ingredientid, name, unit, baseprice, minstocklevel)
`)

return (data || []).map((item: any) => ({
  ...
  minstocklevel: item.minstocklevel,  ← ❌ Không tồn tại
  ingredient: item.ingredients,
}))
```

**Sau:**
```typescript
.select(`
  branchid,
  ingredientid,
  currentstock,
  ingredients(ingredientid, name, unit, baseprice, minstocklevel)  ← ✅ Lấy từ JOIN
`)

return (data || []).map((item: any) => ({
  ...
  minstocklevel: item.ingredients?.minstocklevel || 0,  ← ✅ Từ ingredients
  ingredient: item.ingredients,
}))
```

### Fix 2: Insert chỉ 3 cột bắt buộc

**Trước:**
```typescript
async addToInventory(branchId, ingredientId, currentstock, minstocklevel = 0) {
  .insert([{
    branchid: branchId,
    ingredientid: ingredientId,
    currentstock,
    minstocklevel,  ← ❌ SAI
  }])
}
```

**Sau:**
```typescript
async addToInventory(branchId, ingredientId, currentstock) {
  .insert([{
    branchid: branchId,
    ingredientid: ingredientId,
    currentstock,  ← ✅ Chỉ 3 cột đúng
  }])
}
```

---

## 📝 Changes Applied

### File: `src/services/inventoryService.ts`

#### Hàm 1: `getAllBranchInventory()`
```diff
  .select(`
    branchid,
    ingredientid,
    currentstock,
-   minstocklevel,
    ingredients(ingredientid, name, unit, baseprice, minstocklevel)
  `)
  
  return (data || []).map((item: any) => ({
    branchid: item.branchid,
    ingredientid: item.ingredientid,
    currentstock: item.currentstock,
-   minstocklevel: item.minstocklevel,
+   minstocklevel: item.ingredients?.minstocklevel || 0,
    ingredient: item.ingredients,
  }))
```

#### Hàm 2: `getBranchInventoryByBranch()`
```diff
  .select(`
    branchid,
    ingredientid,
    currentstock,
-   minstocklevel,
    ingredients(ingredientid, name, unit, baseprice, minstocklevel)
  `)
  .eq('branchid', branchIdNum)
  .order('ingredientid', { ascending: true })
  
  return (data || []).map((item: any) => ({
    branchid: item.branchid,
    ingredientid: item.ingredientid,
    currentstock: item.currentstock,
-   minstocklevel: item.minstocklevel,
+   minstocklevel: item.ingredients?.minstocklevel || 0,
    ingredient: item.ingredients,
  }))
```

#### Hàm 3: `addToInventory()`
```diff
- async addToInventory(branchId, ingredientId, currentstock, minstocklevel = 0)
+ async addToInventory(branchId, ingredientId, currentstock)
  
  .insert([{
    branchid: branchId,
    ingredientid: ingredientId,
    currentstock,
-   minstocklevel,
  }])
```

---

## 🧪 Test Status

- ✅ Build thành công: `npm run dev`
- ✅ TypeScript validation: Zero errors
- ✅ Schema matches: `branchinventory` (3 cột) + JOIN `ingredients` (5 cột)
- ✅ Server chạy: `http://localhost:3003/`

---

## 📊 Schema Correctly Mapped

```
branchinventory table (3 cột):
├── branchid (FK → branches)
├── ingredientid (FK → ingredients)
└── currentstock

JOIN ingredients table (5 cột):
├── ingredientid (PK)
├── name
├── unit
├── baseprice
└── minstocklevel ← Lấy từ đây

Result object (8 properties):
├── branchid
├── ingredientid
├── currentstock
├── minstocklevel (from ingredients.minstocklevel)
└── ingredient { id, name, unit, baseprice, minstocklevel }
```

---

## ✨ Kết Quả

### Toàn bộ tồn kho các chi nhánh giờ sẽ:
- ✅ Load thành công (không lỗi 400/column not found)
- ✅ Hiển thị đủ thông tin: tên + đơn vị + tồn kho + ngưỡng
- ✅ Phiếu nhập kho tạo được
- ✅ Modal Nhập kho hoạt động bình thường

---

## 📁 Files Đã Sửa

- ✅ `src/services/inventoryService.ts`
  - `getAllBranchInventory()` - Fix query
  - `getBranchInventoryByBranch()` - Fix query duplicate .order() + mapping
  - `addToInventory()` - Bỏ tham số minstocklevel không cần

---

## 🎓 Bài Học

**Supabase SELECT Rules:**
1. Chỉ select cột **thực sự tồn tại** trong bảng
2. Cột FK có thể JOIN sang bảng khác
3. Data từ JOIN nằm trong property có tên là **bảng được join** hoặc **alias**
4. Mapping phải match tên property trả về từ DB

**branchinventory Specifics:**
```
Schema:      branchid | ingredientid | currentstock
Never add:   minstocklevel  ← Always in ingredients table
Always do:   JOIN ingredients(minstocklevel)
```

---

## 🚀 Status: FIXED ✅

Toàn bộ tồn kho các chi nhánh giờ sẽ load được bình thường!

