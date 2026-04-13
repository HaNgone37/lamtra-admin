# 🔧 FIX LỖI TẢI TỒN KHO - ERROR 400

## 🚨 Vấn đề

```
Failed to load resource: the tngsubtqlmudbnnfhdp._ingredientid.ascll
server responded with a status of 400 ()
Error fetching branch inventory: Object
[ERROR] loadBranchInventory failed: Object
```

---

## 🎯 Nguyên nhân

### Sai cú pháp Supabase FK JOIN

**❌ CÓ**: Sử dụng tên cột làm alias FK reference
```typescript
.select(`
  branchid,
  ingredientid,
  currentstock,
  minstocklevel,
  ingredient:ingredientid(...)  // ❌ SAI - 'ingredientid' là TÊN CỘT
`)
```

**Vấn đề:** 
1. `ingredientid` là tên **cột** (field), không phải tên **bảng**
2. FK của `branchinventory.ingredientid` trỏ đến bảng `ingredients`
3. Supabase cần TÊN BẢNG để làm JOIN, không phải tên cột
4. Supabase tự động mapping `ingredientid` → `ingredients` table

---

## ✅ Giải pháp

### Cú pháp Supabase FK Join đúng

```typescript
// ✅ ĐÚNG - Sử dụng tên bảng 'ingredients'
.select(`
  branchid,
  ingredientid,
  currentstock,
  minstocklevel,
  ingredients(ingredientid, name, unit, baseprice, minstocklevel)
`)
```

### Hoặc với alias (optional):
```typescript
// ✅ ĐÚNG - Với alias 'ingredient:'
.select(`
  branchid,
  ingredientid,
  currentstock,
  minstocklevel,
  ingredient:ingredients(ingredientid, name, unit, baseprice, minstocklevel)
`)
```

**NHƯNG**: Nếu dùng alias, phần return mapping phải trùng:
```typescript
return (data || []).map((item: any) => ({
  ...
  ingredient: item.ingredient,  // ✅ Trùng với alias
}))
```

---

## 📝 Changes Applied

### File: `src/services/inventoryService.ts`

#### Trước:
```typescript
async getAllBranchInventory(): Promise<BranchInventory[]> {
  const { data, error } = await supabase
    .from('branchinventory')
    .select(`
      branchid,
      ingredientid,
      currentstock,
      minstocklevel,
      ingredient:ingredientid(...)  // ❌ SAI
    `)
  
  return (data || []).map((item: any) => ({
    ...
    ingredient: item.ingredient,  // ❌ Không match
  }))
}

async getBranchInventoryByBranch(branchId: string | number) {
  const { data, error } = await supabase
    .from('branchinventory')
    .select(`
      ...
      ingredient:ingredientid(...)  // ❌ SAI
    `)
    .order('ingredientid', { ascending: true })
    .order('ingredientid', { ascending: true })  // ❌ Lặp
  
  return (data || []).map((item: any) => ({
    ...
    ingredient: item.ingredient,  // ❌ Không match
  }))
}
```

#### Sau:
```typescript
async getAllBranchInventory(): Promise<BranchInventory[]> {
  const { data, error } = await supabase
    .from('branchinventory')
    .select(`
      branchid,
      ingredientid,
      currentstock,
      minstocklevel,
      ingredients(ingredientid, name, unit, baseprice, minstocklevel)  // ✅ ĐÚNG
    `)
  
  return (data || []).map((item: any) => ({
    ...
    ingredient: item.ingredients,  // ✅ Match
  }))
}

async getBranchInventoryByBranch(branchId: string | number) {
  const { data, error } = await supabase
    .from('branchinventory')
    .select(`
      ...
      ingredients(ingredientid, name, unit, baseprice, minstocklevel)  // ✅ ĐÚNG
    `)
    .eq('branchid', branchIdNum)
    .order('ingredientid', { ascending: true })  // ✅ Không lặp
  
  return (data || []).map((item: any) => ({
    ...
    ingredient: item.ingredients,  // ✅ Match
  }))
}
```

---

## 🧪 Test Status

- ✅ Build thành công: `npm run dev`
- ✅ Zero TypeScript errors
- ✅ Supabase query syntax đúng
- ✅ FK JOIN mapping chính xác
- ✅ Server chạy: `http://localhost:3002/`

---

## 📊 Bảng so sánh

| Yếu tố | Sai | Đúng |
|--------|-----|------|
| **FK Reference** | `ingredient:ingredientid(...)` | `ingredients(...)` |
| **Alias (Optional)** | Không dùng | `ingredient:ingredients(...)` |
| **Mapping** | `item.ingredient` | `item.ingredients` |
| **Order** | Lặp 2 lần | 1 lần duy nhất |
| **HTTP Status** | 400 (Bad Request) | 200 (OK) |

---

## 🎓 Bài học

### Supabase FK JOIN Rules:
1. **Cú pháp**: `.select('*, table_name(...)')`
2. **Không dùng tên cột**: Không dùng `column_name(...)` 
3. **Dùng tên bảng**: Dùng `table_name(...)`
4. **Alias khi cần**: `.select('*, alias:table_name(...)')`
5. **Mapping phải match**: `item.table_name` hoặc `item.alias`

### Schema Reference (branchinventory):
```
branchinventory:
  - branchid (FK → branches)
  - ingredientid (FK → ingredients)  ← Supabase auto maps to 'ingredients' table
  - currentstock
  - minstocklevel
```

---

## ✨ Kết quả

Modal Nhập kho hiện **đúng tên nguyên liệu + đơn vị**:
- ✅ Không hiện '?'
- ✅ Data đầy đủ từ JOIN
- ✅ Tồn kho tải thành công

---

## 📁 Files Đã Sửa

- `src/services/inventoryService.ts` - Fix FK JOIN query (2 hàm)
  - `getAllBranchInventory()` 
  - `getBranchInventoryByBranch()`

---

## 🚀 Status: FIXED ✅

