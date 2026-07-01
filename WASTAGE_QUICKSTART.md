# Stock Wastage Implementation - Quick Start Guide

**Status:** ✅ **COMPLETE** — Ready to test  
**Last Updated:** 2026-07-01

---

## 🚀 What's New

Three new features added to handle wastage (sating) tracking and billing:

### 1. **Record Sating (Wastage)** 
**Location:** Stock → Record Sating  
**Who:** Admin or Staff  
**What:** Log units that melted/damaged during the day

### 2. **Daily Bills**
**Location:** Stock → Daily Bills  
**Who:** Admin only  
**What:** View breakdown of what to pay supplier each day

### 3. **Wastage Adjustments**
**Location:** More → Wastage Adjustments  
**Who:** Admin only  
**What:** Record supplier negotiations (reduce payment for damaged units)

---

## 📋 Database Migration

**Status:** Ready to apply  
**File:** `supabase/migrations/20260701000000_add_stock_wastage.sql`

**New tables:**
- `stock_wastage` — Track daily wastage per truck
- `wastage_adjustments` — Track supplier negotiation reductions
- `supplier_settlements` updated with `total_wastage` + `wastage_reduction` fields

**To apply:**
```bash
supabase migration up
# OR
supabase db push
```

---

## 🎯 Day-to-Day Usage

### **Daily Workflow (Operations)**

#### Step 1: Record Wastage (Mid-day or End-of-day)
```
Admin/Driver → Stock → Record Sating
├─ Select truck (e.g., "Lori PMT")
├─ Select product (e.g., "Air Batu Besar")
├─ Enter quantity wasted (e.g., 5)
├─ Select date
├─ Add notes (optional)
└─ Click "Record Wastage" ✅
```

System shows:
- ✅ "Wastage recorded"
- Or offline: "Saved offline — will sync when connected"

#### Step 2: Review Daily Bills (End-of-day)
```
Admin → Stock → Daily Bills
├─ See all trucks' activities today
├─ Filter by date/truck if needed
├─ Shows: Sold | Wasted | Payable | RM Amount
└─ Note what to pay supplier today
```

Example display:
```
2026-07-01 | Lori PMT | Air Batu Besar
├─ Sold:      50 units
├─ Wasted:    5 units
├─ Reduction: 0 units
├─ Payable:   55 units × RM15 = RM 825
```

### **Weekly/Monthly Workflow (Supplier Settlement)**

#### Step 1: Calculate Settlement
```
Admin → More → Settlements
├─ Find pending intake
├─ Click "Calculate"
└─ System auto-includes wastage in payable amount
```

Settlement shows:
```
Supplier Settlement
├─ Received:    100 units
├─ Sold:        50 units
├─ Wasted:      5 units
├─ Reduction:   0 units
├─ Payable:     55 units × RM15 = RM 825
└─ Status:      Pending
```

#### Step 2: Negotiate if Supplier Calls (If needed)
```
Supplier: "Out of 5 wasted, only charge 3"

Admin → More → Wastage Adjustments
├─ Select intake
├─ Enter: Total Wasted = 5
├─ Enter: Reduction = 2 (don't pay for these)
├─ Add reason: "Supplier agreed"
└─ Click "Record Adjustment"
```

Updated settlement:
```
├─ Wasted:      5 units
├─ Reduction:   2 units (negotiated)
├─ Payable:     50 + (5-2) = 53 units × RM15 = RM 795
└─ Savings:     RM 30
```

#### Step 3: Mark as Settled
```
Admin → More → Settlements
└─ Click "Settle" button → ✅ "Settlement marked as settled"
```

---

## 🔄 Calculation Logic

**Bill Formula:**
```
Payable Amount = (Units Sold + Units Wasted - Negotiated Reduction) × Cost per Pax

Example:
Intake:       100 units @ RM15/pax
Sold:         50 units
Wasted:       5 units
Reduction:    0 units (no negotiation)
─────────────────────────────────
Payable:      (50 + 5 - 0) = 55 units
Amount Due:   55 × RM15 = RM 825
```

**If Supplier Negotiates:**
```
Same intake, but supplier agrees to absorb 2 units
Reduction:    2 units
─────────────────────────────────
Payable:      (50 + 5 - 2) = 53 units
Amount Due:   53 × RM15 = RM 795
Savings:      RM 30
```

---

## 🗂️ Files Modified/Created

### **Database**
- ✅ `supabase/migrations/20260701000000_add_stock_wastage.sql` — New migration

### **Types**
- ✅ `src/types/pokleh.ts` — Added `StockWastage`, `WastageAdjustment` types

### **Backend (Hooks & Repos)**
- ✅ `src/repositories/wastageRepo.ts` — New repository
- ✅ `src/hooks/useStockWastage.ts` — New hook (with offline support)
- ✅ `src/hooks/useDailyBill.ts` — New hook (bill calculation)
- ✅ `src/hooks/useSettlement.ts` — Updated (now includes wastage)
- ✅ `src/lib/db.ts` — Updated (added IndexedDB tables for offline)

### **Frontend (Components)**
- ✅ `src/components/stock/RecordWastageForm.tsx` — Form to record wastage
- ✅ `src/components/stock/WastageAdjustmentForm.tsx` — Form to record adjustment
- ✅ `src/components/stock/DailyBillView.tsx` — Dashboard showing daily bills
- ✅ `src/components/stock/RecordWastagePage.tsx` — Container page
- ✅ `src/components/stock/DailyBillsPage.tsx` — Container page
- ✅ `src/components/stock/WastageAdjustmentsPage.tsx` — Container page
- ✅ `src/components/stock/SupplierSettlementView.tsx` — Enhanced with wastage columns

### **Navigation & Routing**
- ✅ `src/components/layout/BottomNavigation.tsx` — Added menu items
- ✅ `src/pages/Dashboard.tsx` — Added routes

---

## ✅ Features

- ✅ **Record wastage daily** — Droplet icon, simple form
- ✅ **Offline support** — Records queue if offline, sync when connected
- ✅ **View daily bills** — See truck breakdown before paying supplier
- ✅ **Track negotiations** — Record supplier agreements to reduce charges
- ✅ **Auto-calculate settlement** — Wastage included in bill automatically
- ✅ **Mobile responsive** — Works on phones
- ✅ **Audit trail** — All changes logged

---

## 🧪 Testing Checklist

### **Test 1: Record Wastage (Online)**
- [ ] Go to Stock → Record Sating
- [ ] Fill form (truck, product, quantity, date, notes)
- [ ] Click "Record Wastage"
- [ ] ✅ Should see toast: "Wastage recorded"
- [ ] Wastage appears in "Recent Wastage Records" table

### **Test 2: Record Wastage (Offline)**
- [ ] Open DevTools → Network → Offline
- [ ] Go to Stock → Record Sating
- [ ] Fill form and submit
- [ ] ✅ Should see: "Saved offline — will sync when connected"
- [ ] Go online
- [ ] ✅ Should auto-sync

### **Test 3: View Daily Bills**
- [ ] Create some sales and wastage records
- [ ] Go to Stock → Daily Bills
- [ ] ✅ Should see grouped bills by truck and date
- [ ] ✅ Shows: Sold | Wasted | Reduction | Payable | Amount
- [ ] ✅ Totals are correct

### **Test 4: Adjust Wastage (Negotiation)**
- [ ] Go to More → Wastage Adjustments
- [ ] Select an intake
- [ ] Enter: Total Wasted = 10, Reduction = 5
- [ ] ✅ Should show green "Savings" amount
- [ ] Click "Record Adjustment"
- [ ] ✅ Should see in adjustment history

### **Test 5: Settlement Recalculates**
- [ ] Go to More → Settlements
- [ ] Create or recalculate a settlement
- [ ] ✅ Should show: Wasted + Reduction columns
- [ ] ✅ Payable = Sold + (Wasted - Reduction)
- [ ] Settlement details show breakdown

### **Test 6: Mobile UI**
- [ ] Open on mobile browser
- [ ] Test all forms on mobile
- [ ] ✅ Forms should be readable
- [ ] ✅ Daily bills should show as cards, not tables

---

## 🎨 Visual Icons

| Feature | Icon | Color |
|---------|------|-------|
| Record Wastage | 💧 Droplet | Blue |
| Daily Bills | 📄 Receipt | Default |
| Wastage Adjustments | 🤝 Handshake | Blue |
| Wasted Amount | — | Orange |
| Reduction Amount | — | Green |

---

## 💡 Tips & Best Practices

1. **Record wastage same day** — Easier to remember details
2. **Include notes** — e.g., "Melted due to sun", "Damaged in transit"
3. **Review daily bills** — Know exact amount to pay supplier
4. **Keep negotiation notes** — Why supplier reduced charge

---

## ❓ Troubleshooting

### "Wastage not appearing in bill"
- Check: Intake ID is correctly linked
- Check: Waste date matches sale date period
- Try: Refresh page

### "Adjustment not working"
- Check: Reduction ≤ Total Wasted
- Check: Selected correct intake
- Try: Clear form and start over

### "Settlement shows 0 wastage"
- Check: No wastage records created for this intake
- Check: Wastage created before settlement calculated
- Solution: Create wastage, then recalculate settlement

---

## 📞 Need Help?

See detailed documentation:
- `WASTAGE_IMPLEMENTATION.md` — Complete technical reference
- `WASTAGE_QUICKSTART.md` — This file
- Code comments in hooks/components

---

## 🎉 You're Ready!

**Next Steps:**
1. Apply migration: `supabase db push`
2. Test the flows above
3. Show team how to use it
4. Start recording wastage!

Happy tracking! 🚀
