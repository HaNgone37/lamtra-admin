# ⚡ QUICK REFERENCE - NHẬP KHO MODAL

## 📋 Key Changes Summary

### 1. State Management
```typescript
// Add to Inventory.tsx line ~64
const [selectedIngredient, setSelectedIngredient] = useState<BranchInventory | null>(null)
```

### 2. OnRestockClick Callback
```typescript
// In InventoryStockTab props (line ~463)
onRestockClick={(ingredientId: string) => {
  const ingredient = branchInventory.find(item => String(item.ingredientid) === ingredientId)
  if (ingredient) {
    setSelectedIngredient(ingredient)      // ← SAVE object to state
    setSelectedIngredientId(ingredientId)
    setIsRestockModalOpen(true)
  } else {
    showToast('Không tìm thấy nguyên liệu', 'error')
  }
}}
```

### 3. Modal Data Binding
```typescript
// Line ~378-387
<RestockModal
  selectedIngredientName={selectedIngredient?.ingredient?.name || '?'}
  selectedIngredientUnit={selectedIngredient?.ingredient?.unit || '?'}
  // ... other props
/>
```

### 4. Enhanced handleRestock
```typescript
// Key improvements:
✅ Check userBranchId vs selectedBranch
✅ Error if no branchId
✅ Clean state after success
✅ Reload inventory
✅ Detailed error handling
```

---

## 🎯 Core Concepts

| Concept | Before | After |
|---------|--------|-------|
| **Data Flow** | Find ingredient from array every render | Save object to state, access directly |
| **Modal Display** | "? • ?" (not found) | "Cà phê đen • g" (correct) |
| **Validation** | None | quantity > 0 && unitprice > 0 |
| **Auto-calc** | Inline | Real-time with React state |
| **Error Handling** | Basic | Detailed + console logs |
| **Focus** | Manual | Auto-focus useRef |
| **Button State** | Fixed | Dynamic based on validation |

---

## 🔧 File Changes

### Modified Files: 2
1. `src/pages/Inventory.tsx` (4 changes)
   - State: +selectedIngredient
   - Callback: onRestockClick enhanced
   - Props: selectedIngredientName/Unit from state
   - Handler: handleRestock improved

2. `src/components/inventory/RestockModal.tsx` (3 changes)
   - Imports: +useEffect, useRef
   - Logic: validation, prevent negative, auto-focus
   - UI: dynamic button states

### No Changed Files:
- ✅ inventoryService.ts (createReceipt already complete)
- ✅ InventoryStockTab.tsx (no change needed)
- ✅ DATABASE schema (already correct)

---

## 🗂️ Data Structure

### Input
```typescript
{
  branchId: "1",           // From userBranchId or selectedBranch
  ingredientId: 5,         // From selectedIngredient.ingredientid
  quantity: 50,            // From form.quantity
  unitprice: 100000,       // From form.unitprice
  employeeid: "123"        // From localStorage.user
}
```

### Database Operations
```
1. INSERT stockreceipts
   ├── importdate: NOW()
   ├── totalcost: 5000000
   ├── branchid: 1
   └── employeeid: "123"
   → RETURNING receiptid: 456

2. INSERT receiptdetails
   ├── receiptid: 456
   ├── ingredientid: 5
   ├── quantity: 50
   ├── unitprice: 100000
   └── amount: 5000000

3. SELECT currentstock FROM branchinventory
   WHERE branchid=1 AND ingredientid=5
   → currentstock: 110

4. UPSERT branchinventory
   ├── branchid: 1
   ├── ingredientid: 5
   └── currentstock: 160  (110 + 50)
```

---

## 🎨 React Patterns Used

### Pattern 1: Conditional Rendering with State
```typescript
{selectedIngredient?.ingredient?.name || 'N/A'}
// Fallback to 'N/A' if null/undefined
```

### Pattern 2: useEffect for Focus Management
```typescript
useEffect(() => {
  if (isOpen && quantityInputRef.current) {
    setTimeout(() => quantityInputRef.current?.focus(), 100)
  }
}, [isOpen])
```

### Pattern 3: Controlled Input with Validation
```typescript
const handleQuantityChange = (value: string) => {
  const num = parseInt(value || '0')
  if (num < 0) return  // ← Prevent negative
  onFormChange('quantity', value)
}
```

### Pattern 4: Dynamic Button State
```typescript
const isFormValid = quantity > 0 && unitprice > 0
<button disabled={isSubmitting || !isFormValid} />
```

---

## 🧬 Component Hierarchy

```
Inventory.tsx (Parent)
├── State: selectedIngredient, selectedIngredientId, restockForm, isRestockModalOpen
├── Handler: handleRestock (async, 4-step DB transaction)
├── Callback: onRestockClick (find & save ingredient)
│
└── InventoryStockTab (Child)
    ├── Props: branchInventory, onRestockClick
    ├── Render: Table with actions
    │
    └── Button "Nhập" onClick
        → Call parent callback
        → Pass ingredientId only
        → Parent finds & saves full object
        │
        └── RestockModal (Sibling)
            ├── Props: selectedIngredient name/unit
            ├── State: quantity, unitprice, isSubmitting
            ├── Validation: isFormValid
            ├── Handler: onSubmit (call parent handleRestock)
            └── Effect: Auto-focus quantity input
```

---

## ✅ Checklist Before Deploy

- [ ] Read both documentation files
- [ ] Review code changes in Inventory.tsx
- [ ] Review code changes in RestockModal.tsx
- [ ] Run test scenario 1: Modal Display
- [ ] Run test scenario 2: Input Validation
- [ ] Run test scenario 3: Auto Calculate
- [ ] Run test scenario 4: Submit Success
- [ ] Run test scenario 5: Error Handling
- [ ] Run test scenario 6: Role-Based Access
- [ ] Check console for all [RESTOCK] logs
- [ ] Verify database: stockreceipts table has new records
- [ ] Verify database: branchinventory currentstock increased

---

## 🚨 Common Mistakes to Avoid

### ❌ WRONG: Nested find() in render
```typescript
// WRONG - finds on every render
selectedIngredientName={
  branchInventory.find(item => item.ingredientid === selectedIngredientId)?.ingredient?.name || ''
}
```

### ✅ RIGHT: Use state value
```typescript
// RIGHT - one-time lookup, state manages access
const [selectedIngredient, setSelectedIngredient] = useState(null)
// Later in props:
selectedIngredientName={selectedIngredient?.ingredient?.name || '?'}
```

---

### ❌ WRONG: No branch check
```typescript
// WRONG - crashes if selectedBranch is empty
const branchId = Number(userBranchId || selectedBranch)
// selectedBranch could be ""
```

### ✅ RIGHT: Explicit validation
```typescript
// RIGHT - validate before use
let branchId = ''
if (userBranchId) {
  branchId = userBranchId
} else if (selectedBranch) {
  branchId = selectedBranch
} else {
  showToast('Vui lòng chọn chi nhánh', 'error')
  return
}
```

---

### ❌ WRONG: No validation on form
```typescript
// WRONG - allows 0, negative, etc
if (restockForm.quantity) showToast('Success')
```

### ✅ RIGHT: Proper validation
```typescript
// RIGHT - ensures positive numbers
const quantity = parseInt(form.quantity || '0')
const unitprice = parseInt(form.unitprice || '0')
if (quantity <= 0 || unitprice <= 0) {
  showToast('Vui lòng nhập số dương', 'error')
  return
}
```

---

## 🧪 Debug Commands

### Check selectedIngredient
```javascript
// In browser DevTools console:
localStorage.setItem('_debug_selectedIngredient', 'true')
// Then check component logs
```

### Check form state
```javascript
document.querySelector('input[type="number"]:first-of-type').value
```

### Check database after submit
```javascript
// Open Supabase Table editor:
// 1. stockreceipts → filter recent time
// 2. receiptdetails → filter receiptid
// 3. branchinventory → search branchid + ingredientid
```

### Simulate error
```javascript
// Mock network error (DevTools Network tab)
// Set throttling to "Offline"
// Then try to submit
// Should show: "Lỗi nhập kho: ..."
```

---

## 📞 Support & Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal shows "? • ?" | Check console: `selectedIngredient` === null? Check `onRestockClick` executed? |
| Button always disabled | Form validation failing. Check: qty > 0? price > 0? Both numbers? |
| Stock doesn't update | Check: receipt created? Check DB logs. Check branchinventory exists? |
| Modal won't focus input | Check: useEffect hook exist? Check: useRef assigned? |
| Multiple modals open | Check: modal state management. Press Esc to close all. |
| Toast not showing | Check: showToast function exist? Check: timeout for auto-close? |

---

## 🎓 Learning Path

**If new to this code, read in this order:**
1. Start: This file (quick overview)
2. Next: RESTOCK_MODAL_COMPLETE.md (full details)
3. Then: RESTOCK_MODAL_TEST_GUIDE.md (testing guide)
4. Finally: Review actual code changes in IDE

**Key Files to Study:**
- [src/pages/Inventory.tsx](../src/pages/Inventory.tsx)
- [src/components/inventory/RestockModal.tsx](../src/components/inventory/RestockModal.tsx)
- [src/services/inventoryService.ts](../src/services/inventoryService.ts) (reference only)

---

## 🚀 Next Steps

### Phase 1: Testing ✅ READY
- [ ] Run all test scenarios
- [ ] Verify no errors in console
- [ ] Check database updates

### Phase 2: Deployment 🟡 PENDING
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Deploy to production

### Phase 3: Monitoring 🟡 PENDING
- [ ] Monitor errors in logs
- [ ] Check receipt counts
- [ ] Verify inventory trends

---

**Build Status:** ✅ SUCCESS  
**Port:** http://localhost:3004/  
**Last Error Check:** 0 errors  
**Documentation:** Complete ✅
