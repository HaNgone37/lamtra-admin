# 🎨 NHẬP KHO MODAL - VISUAL & TEST GUIDE

## 📱 UI FLOW

```
┌─────────────────────────────────────────────────────┐
│           📊 INVENTORY STOCK TAB                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Chọn chi nhánh: [▼ Lâm Trà Downtown]              │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ STT │ Nguyên liệu  │ Tồn kho │ Đơn vị │ ... │   │
│  ├──────────────────────────────────────────────┤   │
│  │ 1   │ Cà phê đen   │ 150     │ g     │ ... │   │
│  │     │              │         │       │ [Nhập]   │
│  │     │              │         │       │ [Kiểm] │   │
│  ├──────────────────────────────────────────────┤   │
│  │ 2   │ Đường trắng  │ 50 ⚠️   │ kg    │ ... │   │
│  │     │              │         │       │ [Nhập] ◄─── Click "Nhập"
│  │     │              │         │       │ [Kiểm]   │
│  ├──────────────────────────────────────────────┤   │
│  │ 3   │ Sữa tươi    │ 0 ❌    │ lít   │ ... │   │
│  │     │              │         │       │ [Nhập]   │
│  │     │              │         │       │ [Kiểm]   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
                          ↓
        ╔═══════════════════════════════════╗
        ║   Modal "Nhập Kho" Mở             ║
        ║   AUTO-FOCUS quantity input       ║
        ╚═══════════════════════════════════╝
```

---

## 🎯 MODAL STATES

### State 1: Modal Open (Empty)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📦 Nhập Kho                          ┃
┃  Đường trắng • kg                     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                        ┃
┃  SỐ LƯỢNG (kg)                        ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │ (cursor blinking)                │ ◄── Auto-focus
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ĐƠN GIÁ (VNĐ)                       ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │                                  │ ┃
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │ TỔNG TIỀN PHIẾU                  │ ┃
┃  │ 0 VNĐ                            │ ◄── Gray (empty form)
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ┌──────────────────┐ ┌──────────────┐┃
┃  │ Hủy              │ │ Xác Nhận ✓   ││◄── Xác Nhận disabled ❌
┃  └──────────────────┘ └──────────────┘┃
┃  (Pink border)       (Gray bg)         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

### State 2: User Typing
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📦 Nhập Kho                          ┃
┃  Đường trắng • kg                     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                        ┃
┃  SỐ LƯỢNG (kg)                        ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │ 50                               │ ◄── Border pink when focused
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ĐƠN GIÁ (VNĐ)                       ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │ 100000                           │ ┃
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │ TỔNG TIỀN PHIẾU                  │ ┃
┃  │ 5,000,000 VNĐ                    │ ◄── Pink bg (valid form)
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ┌──────────────────┐ ┌──────────────┐┃
┃  │ Hủy              │ │ Xác Nhận ✓   ││◄── Xác Nhận enabled ✅
┃  └──────────────────┘ └──────────────┘┃
┃  (Pink border)       (Pink bg)         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

### State 3: Processing
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📦 Nhập Kho                          ┃
┃  Đường trắng • kg                     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                        ┃
┃  SỐ LƯỢNG (kg)                        ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │ 50                               │ ◄── Disabled
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ĐƠN GIÁ (VNĐ)                       ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │ 100000                           │ ◄── Disabled
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ┌──────────────────────────────────┐ ┃
┃  │ TỔNG TIỀN PHIẾU                  │ ┃
┃  │ 5,000,000 VNĐ                    │ ┃
┃  └──────────────────────────────────┘ ┃
┃                                        ┃
┃  ┌──────────────────┐ ┌──────────────┐┃
┃  │ Hủy              │ │ Đang xử lý...││◄── Loading state
┃  └──────────────────┘ └──────────────┘┃ ◄── Button disabled ❌
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## ✅ TEST PLAN

### 🧪 TEST 1: Modal Display
**Objective:** Verify modal hiển thị đúng tên & đơn vị

**Steps:**
1. Login → Inventory tab
2. Select branch "Lâm Trà Downtown"
3. Click nút "Nhập" ở dòng "Cà phê đen"

**Verify:**
- [ ] Modal title: "📦 Nhập Kho"
- [ ] Subtitle: "Cà phê đen • g" (NOT "? • ?")
- [ ] Quantity label: "SỐ LƯỢNG (g)"
- [ ] Quantity input focused (cursor visible)
- [ ] Tổng tiền: "0 VNĐ" (gray background)

**Expected Result:** ✅ All checkmarks passed

---

### 🧪 TEST 2: Input Validation
**Objective:** Verify prevent negative numbers

**Steps:**
1. Open modal
2. In Quantity: type `-50`
3. Verify: negative not entered

**Expected Result:**
- [ ] Quantity input shows: "" (empty, negative rejected)
- [ ] Button: disabled (gray)
- [ ] Tổng tiền: "0 VNĐ"

**Steps:**
4. Quantity: `50`
5. Unitprice: `100000`

**Expected Result:**
- [ ] Quantity: "50" ✅
- [ ] Unitprice: "100000" ✅
- [ ] Tổng tiền: "5,000,000 VNĐ" ✅
- [ ] Button: enabled (pink) ✅

**Steps:**
6. Quantity: `0`

**Expected Result:**
- [ ] Button: disabled (gray) ✅
- [ ] Reason: validation = quantity > 0 ✅

---

### 🧪 TEST 3: Auto-Calculate
**Objective:** Verify tổng tiền tự động tính

**Test Cases:**
| Số lượng | Đơn giá | Tổng tiền | Button |
|---------|---------|-----------|--------|
| 0       | 0       | 0         | ❌     |
| 10      | 0       | 0         | ❌     |
| 0       | 50000   | 0         | ❌     |
| **10**  | **50000** | **500,000** | ✅ |
| 25      | 200000  | 5,000,000 | ✅     |
| 1       | 1       | 1         | ✅     |

**Verify:**
- [ ] Format with comma: "5,000,000" (not "5000000")
- [ ] Locale: "vi-VN"
- [ ] Update real-time as user types

---

### 🧪 TEST 4: Submit Success
**Objective:** Verify complete flow until success

**Setup:**
- Branch: "Lâm Trà Downtown"
- Ingredient: "Cà phê đen"
- Quantity: 10
- Unitprice: 50000

**Steps:**
1. Click "Xác Nhận"

**Verify (in console):**
```
✅ [RESTOCK] Starting restock with: {
  quantity: 10,
  unitprice: 50000,
  totalcost: 500000,
  branchId: "1",
  ingredientId: 5,
  ingredientName: "Cà phê đen",
  employeeid: "123"
}

✅ Receipt created with id: 456
✅ Receipt details created
✅ Inventory stock updated: 160
```

**Verify (UI):**
- [ ] Toast: "Nhập kho thành công. Phiếu #456"
- [ ] Toast color: green
- [ ] Modal closes automatically
- [ ] Form cleared

**Verify (Inventory Table):**
- [ ] Table updated
- [ ] Cà phê đen row: currentstock = old (150) + new (10) = 160

**Expected Result:** ✅ Full flow success

---

### 🧪 TEST 5: Error Handling
**Objective:** Verify error cases

#### Test 5a: Missing Branch (Super Admin)
**Setup:** Super admin, NO branch selected

**Steps:**
1. Open modal
2. Click "Xác Nhận"

**Expected Result:**
- [ ] Toast: "Vui lòng chọn chi nhánh"
- [ ] Modal stays open
- [ ] Form data preserved

#### Test 5b: Ingredient Not Found
**Setup:** (Simulate by console)

```javascript
// Manually delete branchInventory item before click
setBranchInventory([])
```

**Steps:**
1. Try to click "Nhập"

**Expected Result:**
- [ ] Toast: "Không tìm thấy nguyên liệu"
- [ ] Modal doesn't open

#### Test 5c: Network Error
**Setup:** (Simulate in DevTools)

```javascript
// Network tab: Offline
// Or mock error in service
```

**Steps:**
1. Fill form: qty=10, price=50000
2. Click "Xác Nhận"

**Expected Result:**
- [ ] Toast: "Lỗi nhập kho: ..." (detailed error)
- [ ] Button shows: "Xác Nhận ✓" (not loading)
- [ ] Can retry

---

### 🧪 TEST 6: Role-Based Access

#### Test 6a: Branch Manager
**Login:** manager@branch1.com

**Steps:**
1. Inventory tab
2. See only "Lâm Trà Downtown" branch
3. Click "Nhập" ở any ingredient

**Expected Result:**
- [ ] Modal opens with ingredient name/unit
- [ ] After submit: receipt created for branch #1
- [ ] Console: branchId = "1" (from userBranchId)

#### Test 6b: Super Admin
**Login:** admin@company.com

**Steps:**
1. Inventory tab
2. See branch dropdown with multiple options
3. Select "Lâm Trà Hoan Kiem"
4. Click "Nhập" ở any ingredient

**Expected Result:**
- [ ] Modal opens with ingredient name/unit
- [ ] After submit: receipt created for branch #3 (Hoan Kiem)
- [ ] Console: branchId = "3" (from selectedBranch)

---

### 🧪 TEST 7: UI Polish

#### Test 7a: Button States
**Verify:**
- [ ] Hủy button: pink border, white bg
- [ ] Hủy hover: light pink bg
- [ ] Xác Nhận enabled: pink bg, white text
- [ ] Xác Nhận hover: slight lift animation
- [ ] Xác Nhận disabled: gray bg, no hover effect

#### Test 7b: Input Focus
**Verify:**
- [ ] Input default: light pink border
- [ ] Input focus: pink border + light pink shadow
- [ ] Input blur: light pink border, no shadow
- [ ] Quantity auto-focus when modal opens

#### Test 7c: Totals Display
**Verify:**
- [ ] Empty form: light gray bg
- [ ] Valid form: light pink bg (matches theme)
- [ ] Color transition smooth (0.3s ease)
- [ ] Number format: "1,234,567 VNĐ" (comma every 3 digits)

---

## 🐛 COMMON ISSUES & DEBUG

### Issue: Modal shows "? • ?" for name/unit

**Debug:**
```javascript
// 1. Check if selectedIngredient is populated
console.log('selectedIngredient:', selectedIngredient)

// 2. Check if ingredient object has nested ingredient property
console.log('selectedIngredient?.ingredient:', selectedIngredient?.ingredient)

// 3. Check branchInventory data structure
console.log('branchInventory:', branchInventory)
console.log('First item:', branchInventory[0])
```

**Common Causes:**
- branchInventory hasn't loaded yet
- onRestockClick callback not executed
- ingredient property is undefined

---

### Issue: Button always stays disabled

**Debug:**
```javascript
// Check form values
console.log('Form:', form)
console.log('Quantity:', parseInt(form.quantity || '0'))
console.log('Unitprice:', parseInt(form.unitprice || '0'))
console.log('isFormValid:', quantity > 0 && unitprice > 0)
```

**Common Causes:**
- Negative validation too strict
- parseInt fails on empty string
- One of quantity/unitprice is 0

---

### Issue: Stock doesn't update after submit

**Debug:**
```javascript
// Check receipt creation success
console.log('[RESTOCK] Result:', result)
console.log('Receipt ID:', result.receiptid)

// Check branchinventory update
// Go to Table mode: https://app.supabase.com
// branchinventory → filter branchid & ingredientid
// Verify currentstock increased
```

**Common Causes:**
- branchinventory record doesn't exist (needs INSERT not UPDATE)
- Wrong ingredientid / branchid
- Transaction failed silently

---

## 📊 ACCEPTANCE CRITERIA

| Criteria | Status | Notes |
|----------|--------|-------|
| Modal hiển thị tên + đơn vị | ✅ |  selectedIngredient from state |
| Auto-focus quantity input | ✅ | useRef + useEffect |
| Tự động tính tổng tiền | ✅ | quantity × unitprice |
| Prevent negative numbers | ✅ | Validation in handlers |
| Button validation | ✅ | isFormValid = qty > 0 && price > 0 |
| Submit success → receipt created | ✅ | 4-step transaction |
| Inventory stock updated | ✅ | branchinventory upsert |
| Error handling | ✅ | Multiple scenario tests |
| Role-based branchId | ✅ | userBranchId or selectedBranch |
| Toast notifications | ✅ | Success/error messages |
| UI responsiveness | ✅ | No lag on input |
| Build 0 errors | ✅ | TypeScript validation |

---

**Last Updated:** 2026-04-13  
**Build Status:** ✅ Successful (http://localhost:3004/)  
**Ready for Testing:** ✅ YES
