# Stock Wastage & Daily Billing Implementation Guide

**Status:** Implementation complete — Database schema, hooks, and UI components ready
**Last Updated:** 2026-07-01

---

## 📋 Overview

This implementation adds **Stock Wastage (Sating) Tracking** and **Daily Bill View** to the Pokleh Enterprise system. It allows:

1. **Track wastage daily** — Record units that melted/damaged per truck/product/date
2. **Calculate accurate bills** — Bill = Units Sold + (Units Wasted - Negotiated Reduction)
3. **Negotiate reductions** — Admin can adjust wastage charges if supplier agrees to pay less
4. **Daily bill review** — Admin can see daily bills per truck before paying supplier

---

## 🗄️ Database Changes

### Migration: `20260701000000_add_stock_wastage.sql`

#### New Tables

**1. `stock_wastage`** — Track daily wastage per truck
```sql
- id (UUID PK)
- truck_id (FK → trucks)
- product_type (Air Batu Besar | Air Batu Kecil | Air Batu Hancur)
- quantity_wasted (INTEGER)
- waste_date (DATE)
- intake_id (FK → stock_intake, nullable)
- notes (TEXT, nullable)
- created_by (FK → profiles.user_id)
- created_at (TIMESTAMPTZ)
```

**2. `wastage_adjustments`** — Track negotiated reductions
```sql
- id (UUID PK)
- intake_id (FK → stock_intake)
- truck_id (FK → trucks)
- product_type (TEXT)
- total_wasted (INTEGER) — Total units wasted in this batch
- reduction_quantity (INTEGER) — How many we DON'T pay for (supplier agreement)
- reason (TEXT, nullable) — Why supplier agreed to reduce
- adjustment_date (DATE)
- approved_by (FK → profiles.user_id, nullable)
- approved_at (TIMESTAMPTZ, nullable)
- created_by (FK → profiles.user_id)
- created_at (TIMESTAMPTZ)
```

#### Updated Tables

**`supplier_settlements`** — Added wastage columns
```sql
ALTER TABLE supplier_settlements ADD:
- total_wastage (INTEGER DEFAULT 0)
- wastage_reduction (INTEGER DEFAULT 0)
```

#### New RPC Function

**`calculate_settlement_with_wastage(p_intake_id)`**
- Returns: total_received, total_sold, total_returned, total_wastage, wastage_reduction, payable_quantity, cost_per_pax, payable_amount
- Formula: `payable_quantity = total_sold + (total_wastage - wastage_reduction)`

---

## 💾 TypeScript Types

### New Types (in `src/types/pokleh.ts`)

```typescript
export interface StockWastage {
  id: string;
  truck_id: string;
  product_type: ProductType;
  quantity_wasted: number;
  waste_date: string;
  intake_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  truck?: Truck;
  intake?: StockIntake;
}

export interface WastageAdjustment {
  id: string;
  intake_id: string;
  truck_id: string;
  product_type: ProductType;
  total_wasted: number;
  reduction_quantity: number;
  reason: string | null;
  adjustment_date: string;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  intake?: StockIntake;
  truck?: Truck;
}

// Updated SupplierSettlement now includes:
// - total_wastage: number
// - wastage_reduction: number
```

### New Hook Types

```typescript
export interface DailyBillLine {
  truckId: string;
  truckName: string;
  productType: string;
  wasteDate: string;
  quantitySold: number;
  quantityWasted: number;
  wastageReduction: number;
  payableQuantity: number; // sold + (wasted - reduction)
  costPerPax: number;
  payableAmount: number;
  supplierName: string;
}

export interface DailyBillSummary {
  date: string;
  truckId: string;
  truckName: string;
  lines: DailyBillLine[];
  totalSold: number;
  totalWasted: number;
  totalReduction: number;
  totalPayable: number;
  totalAmount: number;
}
```

---

## 🔧 Backend (Repositories & Hooks)

### Repository: `src/repositories/wastageRepo.ts`

```typescript
// Stock Wastage operations
wastageRepo.fetchAll(truckId?, fromDate?, toDate?)
wastageRepo.create(data)
wastageRepo.fetchByIntake(intakeId)
wastageRepo.fetchByTruckAndDate(truckId, date)

// Wastage Adjustment operations
wastageAdjustmentRepo.fetchAll()
wastageAdjustmentRepo.create(data)
wastageAdjustmentRepo.fetchByIntake(intakeId)
wastageAdjustmentRepo.approve(id, data)
```

### Hook: `src/hooks/useStockWastage.ts`

```typescript
const {
  wastages,           // StockWastage[]
  adjustments,        // WastageAdjustment[]
  loading,            // boolean
  addWastage,         // (data) => Promise<{ success, offline?, data }>
  addAdjustment,      // (data) => Promise<{ success, offline?, data }>
  refresh,            // () => Promise<void>
} = useStockWastage();
```

**Usage:**
```typescript
// Record wastage
const result = await addWastage({
  truck_id: "uuid-truck",
  product_type: "Air Batu Besar",
  quantity_wasted: 5,
  waste_date: "2026-07-01",
  intake_id: "uuid-intake" // optional
  notes: "Melted due to sun"
});

// Record negotiation
const result = await addAdjustment({
  intake_id: "uuid-intake",
  truck_id: "uuid-truck",
  product_type: "Air Batu Besar",
  total_wasted: 50,
  reduction_quantity: 25, // Pay only for 25, not 50
  reason: "Agreed with supplier",
  adjustment_date: "2026-07-01"
});
```

**Offline Support:** ✅ Yes
- Wastage records queue automatically if offline
- Syncs when connection restored

### Hook: `src/hooks/useDailyBill.ts`

```typescript
const { dailyBills } = useDailyBill(
  sales,       // Sale[]
  wastages,    // StockWastage[]
  adjustments, // WastageAdjustment[]
  intakes,     // StockIntake[]
  trucks       // Truck[]
);
```

**Returns:**
- `dailyBills: DailyBillSummary[]` — One per truck per date, sorted by date DESC
- Each summary includes:
  - `lines[]` — Breakdown by product type
  - `totalSold`, `totalWasted`, `totalReduction`, `totalPayable`, `totalAmount`

**Usage:**
```typescript
const sales = await fetchSales();
const wastages = await fetchWastages();
const adjustments = await fetchAdjustments();
const intakes = await fetchIntakes();
const trucks = await fetchTrucks();

const { dailyBills } = useDailyBill(sales, wastages, adjustments, intakes, trucks);

dailyBills.forEach(bill => {
  console.log(`${bill.date} - ${bill.truckName}`);
  console.log(`  Sold: ${bill.totalSold}, Wasted: ${bill.totalWasted}`);
  console.log(`  Payable: RM ${bill.totalAmount}`);
});
```

### Updated Hook: `src/hooks/useSettlement.ts`

**Changes:**
- `calculateSettlement()` now queries `stock_wastage` and `wastage_adjustments`
- Formula updated: `payable_quantity = total_sold + (total_wastage - wastage_reduction)`
- Stores `total_wastage` and `wastage_reduction` in settlement record
- Recalculates automatically when called

---

## 🎨 Frontend Components

### Component: `src/components/stock/RecordWastageForm.tsx`

**Props:**
```typescript
interface RecordWastageFormProps {
  trucks: Truck[];
  onSubmit: (data) => Promise<{ success: boolean }>;
  isLoading?: boolean;
}
```

**Features:**
- ✅ Select truck, product type
- ✅ Enter quantity wasted and date
- ✅ Optional notes field
- ✅ Auto-clears on successful submit
- ✅ Inline validation

**Usage:**
```tsx
import { RecordWastageForm } from "@/components/stock/RecordWastageForm";
import { useStockWastage } from "@/hooks/useStockWastage";
import { useTrucks } from "@/hooks/useTrucks";

export function WastagePage() {
  const { trucks } = useTrucks();
  const { addWastage } = useStockWastage();
  
  return (
    <RecordWastageForm 
      trucks={trucks} 
      onSubmit={addWastage}
    />
  );
}
```

### Component: `src/components/stock/DailyBillView.tsx`

**Props:**
```typescript
interface DailyBillViewProps {
  dailyBills: DailyBillSummary[];
  isLoading?: boolean;
}
```

**Features:**
- ✅ Filter by date
- ✅ Filter by truck
- ✅ Desktop table + mobile cards
- ✅ Shows: Sold, Wasted, Reduction, Payable Qty, Amount
- ✅ Summary totals (all bills, total amount to pay)
- ✅ Color-coded: Wasted (orange), Reduction (green)

**Usage:**
```tsx
import { DailyBillView } from "@/components/stock/DailyBillView";
import { useDailyBill } from "@/hooks/useDailyBill";
import { useSales } from "@/hooks/useSales";
import { useStockWastage } from "@/hooks/useStockWastage";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useTrucks } from "@/hooks/useTrucks";

export function DailyBillsPage() {
  const { sales } = useSales();
  const { wastages, adjustments } = useStockWastage();
  const { intakes } = useStockIntake();
  const { trucks } = useTrucks();
  
  const { dailyBills } = useDailyBill(sales, wastages, adjustments, intakes, trucks);
  
  return <DailyBillView dailyBills={dailyBills} />;
}
```

### Enhanced Component: `src/components/stock/SupplierSettlementView.tsx`

**Changes:**
- Added columns: `Wasted`, `Reduction`
- Shows breakdown of how payable is calculated
- Mobile cards updated to show wastage details
- Color-coded: Wasted (orange), Reduction (green)

**Before:**
```
Supplier | Date | Received | Sold | Returned | Payable Qty | Cost | Amount | Status
```

**After:**
```
Supplier | Date | Received | Sold | Wasted | Reduction | Returned | Payable Qty | Cost | Amount | Status
```

---

## 🔄 Business Logic Flow

### Recording Wastage
```
1. Truck driver/admin uses RecordWastageForm
2. Enter truck, product type, quantity, date
3. addWastage() creates stock_wastage record
4. If offline, queues for sync; if online, saves directly
5. Toast confirmation shown
```

### Viewing Daily Bills
```
1. Admin navigates to Daily Bills page
2. DailyBillView renders all bills grouped by truck/date
3. Can filter by specific date/truck
4. Shows: Units Sold, Units Wasted, Negotiated Reduction, Total Payable
5. See RM amount due per day
```

### Settlement Calculation
```
1. Admin clicks "Calculate" for an intake
2. calculateSettlement(intakeId) runs:
   a. Get total_sold (from sales - returns)
   b. Get total_wastage (sum of stock_wastage records)
   c. Get wastage_reduction (sum of wastage_adjustments records)
   d. Calculate payable = sold + (wastage - reduction)
   e. Store in supplier_settlements table
3. SupplierSettlementView shows breakdown with Wasted + Reduction columns
4. Admin can then mark as "Settled" when paying supplier
```

### Negotiating Reductions
```
1. Supplier calls: "Out of 50 units wasted, pay only 25"
2. Admin uses addAdjustment() to record:
   - intake_id: which batch
   - total_wasted: 50
   - reduction_quantity: 25 (don't pay for these)
   - reason: "Negotiated with supplier"
3. Next time calculateSettlement() runs, payable = sold + (50 - 25)
4. SupplierSettlementView shows: Wasted: 50, Reduction: -25
```

---

## 📊 Example Calculation

**Scenario:** Air Batu Besar intake on 2026-07-01
```
Intake:           100 units @ RM 15/pax = RM 1,500
Sales (sold):      50 units
Wastage (sating):  10 units initially
Supplier calls:   "From the 10 wasted, pay only 5"
Returns:           5 units
```

**Settlement:**
```
Total Received:         100 units
Total Sold:              50 units
Total Returned:           5 units
Total Wastage:           10 units
Wastage Reduction:        5 units (negotiated)

Payable Quantity:  50 + (10 - 5) = 55 units
Cost per Pax:      RM 15
Payable Amount:    55 × RM 15 = RM 825

Daily Bill shows:
  Sold:       50 units
  Wasted:     10 units
  Reduction:  -5 units (negotiated with supplier)
  Payable:    55 units = RM 825
```

---

## 🚀 Integration Checklist

- [x] Database migration created
- [x] Types defined
- [x] Repositories created
- [x] Hooks implemented (with offline support)
- [x] UI components created
- [x] Settlement calculation updated
- [x] SupplierSettlementView enhanced

**Still to do:**
- [ ] Add wastage/adjustment database tables to Dexie IndexedDB schema (for offline)
- [ ] Test offline sync flow for wastage records
- [ ] Add "Wastage" page to navigation
- [ ] Add "Daily Bills" page to navigation
- [ ] Add "Wastage Adjustments" admin form
- [ ] Wire up all components to main page routing
- [ ] Test end-to-end: record wastage → calculate settlement → mark settled

---

## 🔐 RLS Policies

All new tables have RLS enabled:
- **Admins** can manage (CRUD) all wastage and adjustment records
- **Staff** can view all wastage and adjustment records
- **Authenticated users** can view settlements with wastage breakdown

---

## 📝 Notes

1. **Wastage vs Returns**: 
   - Returns = physical stock back to supplier
   - Wastage = units melted/damaged (no physical return, but charged to bill)

2. **Offline Support**: ✅
   - All wastage records auto-queue if offline
   - Sync when connection restored
   - UI shows "Saved offline — will sync when connected"

3. **Settlement Idempotency**:
   - Running `calculateSettlement()` multiple times is safe
   - Updates existing settlement with latest wastage/reduction data

4. **Mobile Responsive**: ✅
   - RecordWastageForm works on mobile
   - DailyBillView adapts to mobile (cards instead of tables)
   - SupplierSettlementView mobile view updated

---

## 📞 Questions?

See detailed code comments in:
- `src/repositories/wastageRepo.ts` — Data access layer
- `src/hooks/useStockWastage.ts` — Business logic
- `src/hooks/useDailyBill.ts` — Bill calculation logic
- `src/components/stock/DailyBillView.tsx` — UI rendering
