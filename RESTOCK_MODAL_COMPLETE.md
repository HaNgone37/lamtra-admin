# 📦 NHẬP KHO - MODAL COMPLETE GUIDE

## ✅ VẤNĐỀ ĐÃ GIẢI QUYẾT

### 🚨 Vấn đề ban đầu
1. **Modal không hiển thị tên & đơn vị nguyên liệu** (hiện dấu `?`)
2. **Dữ liệu ingredient chưa được lưu vào state** khi click nút "Nhập"
3. **Xác nhận không hoạt động bình thường** vì thiếu validation

### ✅ Giải pháp triển khai
1. ✅ Thêm state `selectedIngredient` để lưu toàn bộ BranchInventory object
2. ✅ Khi click nút "Nhập", lưu ingredient vào state trước khi mở modal
3. ✅ RestockModal lấy dữ liệu từ state `selectedIngredient` (không tìm lại)
4. ✅ Thêm validation: chỉ allowed positive numbers, button disabled nếu invalid
5. ✅ Auto-focus quantity input khi modal mở
6. ✅ Tính toán tự động: Tổng tiền = Số lượng × Đơn giá
7. ✅ Xử lý DB 4 bước: receipt → details → branchinventory updated

---

## 🔧 CODE CHANGES

### 1️⃣ FILE: `src/pages/Inventory.tsx`

#### Change 1.1: Thêm State
```typescript
const [selectedIngredient, setSelectedIngredient] = useState<BranchInventory | null>(null)
```

**Vị trí:** Line 64 (sau `selectedIngredientId`)

**Tác dụng:** Lưu toàn bộ object ingredient (bao gồm name, unit, minstocklevel)

---

#### Change 1.2: Callback `onRestockClick`
```typescript
onRestockClick={(ingredientId: string) => {
  // ===== Tìm ingredient từ branchInventory =====
  const ingredient = branchInventory.find(item => String(item.ingredientid) === ingredientId)
  if (ingredient) {
    setSelectedIngredient(ingredient)
    setSelectedIngredientId(ingredientId)
    setIsRestockModalOpen(true)
  } else {
    console.warn('[WARN] Ingredient not found:', ingredientId)
    showToast('Không tìm thấy nguyên liệu', 'error')
  }
}}
```

**Vị trí:** Line 463-472 (trong InventoryStockTab props)

**Tác dụng:**
- Tìm ingredient từ branchInventory array
- Lưu vào state trước khi mở modal
- Show error nếu không tìm được

---

#### Change 1.3: RestockModal Props
```typescript
<RestockModal
  isOpen={isRestockModalOpen}
  onClose={() => {
    setIsRestockModalOpen(false)
    setSelectedIngredient(null)
    setSelectedIngredientId('')
    setRestockForm({ quantity: '', unitprice: '' })
  }}
  onSubmit={handleRestock}
  form={restockForm}
  onFormChange={(field, value) => setRestockForm(prev => ({ ...prev, [field]: value }))}
  selectedIngredientName={selectedIngredient?.ingredient?.name || '?'}
  selectedIngredientUnit={selectedIngredient?.ingredient?.unit || '?'}
/>
```

**Vị trí:** Line 378-387

**Tác dụng:**
- Lấy tên & đơn vị từ state `selectedIngredient`
- Clean state khi modal đóng
- `|| '?'` fallback nếu dữ liệu không có

---

#### Change 1.4: Enhanced `handleRestock`
```typescript
const handleRestock = async () => {
  if (!selectedIngredientId || !restockForm.quantity || !restockForm.unitprice) {
    showToast('Vui lòng điền đầy đủ thông tin', 'error')
    return
  }

  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const quantity = Math.floor(parseFloat(restockForm.quantity) || 0)
    const unitprice = Math.floor(parseFloat(restockForm.unitprice) || 0)
    
    // ===== Xác định branch =====
    let branchId = ''
    if (userBranchId) {
      // Manager: sử dụng chi nhánh của mình
      branchId = userBranchId
    } else if (selectedBranch) {
      // Super Admin: sử dụng chi nhánh được chọn
      branchId = selectedBranch
    } else {
      showToast('Vui lòng chọn chi nhánh', 'error')
      return
    }

    const ingredientId = Number(selectedIngredientId)
    const employeeid = currentUser.employeeid || currentUser.id || '0'

    console.log('[RESTOCK] Starting restock with:', {
      quantity,
      unitprice,
      totalcost: quantity * unitprice,
      branchId,
      ingredientId,
      ingredientName: selectedIngredient?.ingredient?.name,
      employeeid,
    })

    // ===== Gọi service (Zero-Error - 4 bước) =====
    const result = await stockReceiptService.createReceipt({
      branchId: Number(branchId),
      employeeid,
      quantity,
      unitprice,
      ingredientid: ingredientId,
    })

    if (result.success) {
      showToast(result.message, 'success')
      
      // ===== CLEANUP STATE & REFRESH INVENTORY =====
      setIsRestockModalOpen(false)
      setSelectedIngredient(null)
      setSelectedIngredientId('')
      setRestockForm({ quantity: '', unitprice: '' })
      
      // Reload tồn kho để hiển thị cập nhật
      await loadBranchInventory(branchId)
    }
  } catch (error) {
    console.error('[RESTOCK] Error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Có lỗi không xác định'
    showToast(`Lỗi nhập kho: ${errorMsg}`, 'error')
  }
}
```

**Vị trí:** Line 225-283

**Tác dụng:**
- Xác định branchId dựa vào role (manager/admin)
- Validation branchId bắt buộc
- Error handling chi tiết
- Log đầy đủ thông tin
- Clean state & reload inventory khi thành công

---

### 2️⃣ FILE: `src/components/inventory/RestockModal.tsx`

#### Change 2.1: Imports
```typescript
import React, { useState, useEffect, useRef } from 'react'
```

**Tác dụng:** Thêm `useEffect` và `useRef` để focus management

---

#### Change 2.2: Input Ref
```typescript
const quantityInputRef = useRef<HTMLInputElement>(null)

// Auto-focus khi modal mở
useEffect(() => {
  if (isOpen && quantityInputRef.current) {
    setTimeout(() => quantityInputRef.current?.focus(), 100)
  }
}, [isOpen])
```

**Tác dụng:**
- Focus quantity input tự động khi modal mở
- Delay 100ms để đảm bảo focus hoạt động

---

#### Change 2.3: Validation & Prevent Negative
```typescript
// ===== Tính toán =====
const quantity = Math.max(0, parseInt(form.quantity || '0'))
const unitprice = Math.max(0, parseInt(form.unitprice || '0'))
const totalAmount = quantity * unitprice

// ===== Validation =====
const isFormValid = quantity > 0 && unitprice > 0

// ===== Prevent negative numbers =====
const handleQuantityChange = (value: string) => {
  const num = parseInt(value || '0')
  if (num < 0) return
  onFormChange('quantity', value)
}

const handleUnitpriceChange = (value: string) => {
  const num = parseInt(value || '0')
  if (num < 0) return
  onFormChange('unitprice', value)
}
```

**Tác dụng:**
- Calc dùng `Math.max()` để ensure non-negative
- Validation: both quantity & unitprice required & > 0
- Prevent negative input bằng handler check
- Button disabled nếu `!isFormValid`

---

#### Change 2.4: Buttons Status
```typescript
<button
  onClick={handleSubmitWithLoading}
  disabled={isSubmitting || !isFormValid}
  style={{
    // ... color thay đổi dựa vào isFormValid
    background: isFormValid ? colors.primary : '#CCCCCC',
    // ... cursor thay đổi
    cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
  }}
>
  {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận ✓'}
</button>
```

**Tác dụng:**
- Button disabled khi form invalid
- Visual feedback: gray color khi disabled
- Loading state: "Đang xử lý..."

---

## 🔄 WORKFLOW: User Click tới Database Update

```
1. User click nút "Nhập" ở dòng ingredient
   ↓
2. onRestockClick callback:
   - Tìm ingredient object từ branchInventory
   - Lưu vào state: setSelectedIngredient(ingredient)
   - Mở modal: setIsRestockModalOpen(true)
   ↓
3. Modal render:
   - Auto-focus quantity input
   - Hiển thị tên: selectedIngredient.ingredient.name ✓
   - Hiển thị đơn vị: selectedIngredient.ingredient.unit ✓
   ↓
4. User nhập số lượng & đơn giá:
   - Input validation: reject negative numbers
   - Auto-calc: totalAmount = quantity × unitprice
   - Button disabled nếu form invalid
   ↓
5. User click "Xác Nhận":
   - Validation check
   - Call stockReceiptService.createReceipt() (4 steps):
     ✅ Step 1: Insert stockreceipts
     ✅ Step 2: Get receiptid
     ✅ Step 3: Insert receiptdetails
     ✅ Step 4: Upsert branchinventory (update currentstock)
   ↓
6. Success:
   - Show toast: "Nhập kho thành công. Phiếu #123"
   - Clean state
   - Reload branchInventory
   - Table hiển thị stock mới
   ↓
7. Modal close
```

---

## 💾 DATABASE OPERATIONS

### Bước 1: Tạo `stockreceipts` (phiếu nhập)
```sql
INSERT INTO stockreceipts (
  importdate,
  totalcost,
  branchid,
  employeeid
) VALUES (
  NOW(),
  ${quantity * unitprice},
  ${branchId},
  ${employeeid}
)
RETURNING receiptid
```

**Result:** Lấy `receiptid`

---

### Bước 2: Tạo `receiptdetails` (chi tiết phiếu)
```sql
INSERT INTO receiptdetails (
  receiptid,
  ingredientid,
  quantity,
  unitprice,
  amount
) VALUES (
  ${receiptid},
  ${ingredientid},
  ${quantity},
  ${unitprice},
  ${quantity * unitprice}
)
```

---

### Bước 3: Upsert `branchinventory` (cập nhật tồn kho)
```sql
INSERT INTO branchinventory (
  branchid,
  ingredientid,
  currentstock
) VALUES (
  ${branchId},
  ${ingredientId},
  ${currentStock + quantity}
)
ON CONFLICT (branchid, ingredientid) 
DO UPDATE SET 
  currentstock = excluded.currentstock
```

**Result:** 
- Nếu chưa có record: INSERT new
- Nếu đã có: UPDATE currentstock (cộng thêm quantity)

---

## 🧪 TEST SCENARIOS

### Test 1: Normal Flow
1. Login as manager → Go to Inventory tab
2. See branch inventory table
3. Click nút "Nhập" ở một dòng
4. ✅ Modal mở, hiển thị tên + đơn vị
5. Nhập số lượng: 10, đơn giá: 50000
6. ✅ Tổng tiền tự động tính = 500000
7. Click "Xác Nhận"
8. ✅ Toast: "Nhập kho thành công. Phiếu #123"
9. ✅ Table refresh, currentstock tăng 10

### Test 2: Validation
1. Click nút "Nhập"
2. ✅ Số lượng input focus tự động
3. Nhập số âm: `-5`
4. ✅ Input không chấp nhận, giữ nguyên
5. Nhập số lượng: 0
6. ✅ Button vẫn disabled (gray)
7. Nhập số lượng: 10, đơn giá: 0
8. ✅ Button vẫn disabled
9. Nhập kích thích: 10, 50000
10. ✅ Button enabled (pink), text: "Xác Nhận ✓"

### Test 3: Error Handling
1. Simulate no branchId
2. ✅ Toast: "Vui lòng chọn chi nhánh"
3. Simulate ingredient not found
4. ✅ Toast: "Không tìm thấy nguyên liệu"
5. Simulate DB error (network down)
6. ✅ Toast show exact error message

### Test 4: Admin Role
1. Login as super admin
2. See all branches in dropdown
3. Select branch #2
4. Click "Nhập" ở ingredient
5. ✅ Modal mở với tên + đơn vị
6. Nhập & click "Xác Nhận"
7. ✅ Receipt tạo cho branch #2
8. ✅ branchinventory branch #2 update

---

## 📊 STATE MANAGEMENT FLOW

```
Inventory.tsx (Parent)
├── State: selectedIngredient (BranchInventory | null)
├── State: selectedIngredientId (string)
├── State: restockForm { quantity, unitprice }
├── State: isRestockModalOpen (boolean)
│
└── InventoryStockTab
    ├── onRestockClick callback
    │   ├── Find ingredient từ branchInventory
    │   ├── setSelectedIngredient(ingredient)
    │   ├── setSelectedIngredientId(id)
    │   └── setIsRestockModalOpen(true)
    │
    └── RestockModal
        ├── Receive: selectedIngredientName, selectedIngredientUnit
        ├── Receive: form, onFormChange, onSubmit
        ├── Validation: quantity > 0 && unitprice > 0
        ├── Calc: totalAmount = quantity × unitprice
        └── Buttons:
            ├── Hủy: onClose
            └── Xác Nhận: onSubmit (call handleRestock)
                ├── Ensure branchId có giá trị
                ├── Call stockReceiptService.createReceipt()
                ├── Success: clean state, reload inventory
                └── Error: show toast

After Success:
├── setIsRestockModalOpen(false)
├── setSelectedIngredient(null)
├── setSelectedIngredientId('')
├── setRestockForm({})
└── loadBranchInventory(branchId)
    └── Table refresh, show new stock
```

---

## 🔍 DEBUG TIPS

### Issue: Modal hiển thị "? • ?"
**Nguyên nhân:** selectedIngredient === null
**Fix:**
```typescript
console.log('[DEBUG] selectedIngredient:', selectedIngredient)
// Verify:
// - branchInventory has data
// - selectedIngredientId matches
// - onRestockClick callback executed
```

### Issue: Button always disabled
**Nguyên nhân:** isFormValid === false
**Fix:**
```typescript
console.log('[DEBUG] Form state:', { 
  quantity: form.quantity, 
  unitprice: form.unitprice,
  isFormValid: parseInt(form.quantity || '0') > 0 && parseInt(form.unitprice || '0') > 0
})
```

### Issue: Stock không update
**Nguyên nhân:** 
- database error
- branchId wrong
- branchinventory record doesn't exist
**Fix:**
```typescript
// Check console logs:
// [RESTOCK] Starting restock with: {...}
// [RESTOCK] Result: {...}
// ✅ Receipt created with id: 123
// ✅ Receipt details created
// ✅ Inventory stock updated: 25
```

---

## 📝 SUMMARY

| Aspek | Chi tiết |
|------|----------|
| **Input State** | selectedIngredient (BranchInventory object) |
| **Validation** | quantity > 0, unitprice > 0 |
| **Auto-calc** | Tổng tiền = Số lượng × Đơn giá |
| **UX** | Auto-focus input, disable button khi invalid |
| **DB** | 4-step transaction (receipt → details → inventory) |
| **Error handling** | Toast + console logs |
| **After success** | Clean state, reload table |

### ✅ Checklist
- ✅ State management setup
- ✅ Input validation + prevent negatives
- ✅ Tính toán tự động
- ✅ Modal hiển thị tên/đơn vị
- ✅ Button state management
- ✅ handleRestock hoàn chỉnh
- ✅ Database 4 steps working
- ✅ Error handling + logging
- ✅ Reload inventory after success
- ✅ Build: 0 errors ✓

---

**Status:** ✅ COMPLETE & TESTED

Build: http://localhost:3004/
