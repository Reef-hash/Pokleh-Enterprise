# Pokleh Enterprise — Development Plan & Status

> **Dicipta**: 2026-07-03
> **Tujuan**: Rujukan boleh mobile — untuk sambung kerja dari phone.
> **Supabase Project**: `gsieirprrkuyfzxqcizb` (URL: `https://gsieirprrkuyfzxqcizb.supabase.co`)

---

## 📊 Status Keseluruhan

| Fasa | Status | Nota |
|------|--------|------|
| Phase 1–6 (asas) | ✅ Siap | Lihat `PROGRESS.md` |
| Carry-forward intake lookup fix | ✅ Siap | salesRepo + wastageRepo + useDailyBill |
| Supplier price auto-fill | ✅ Siap | Migration + types + repo + hook + admin UI + intake form |
| Daily closing UX (close all) | ✅ Siap | closeDayAll/reconcileDayAll + UI rewrite |
| Sync sales → debt_ledger | ✅ Siap | Migration `20260701010000` dah wujud |
| **Reports fix** | ⏳ **BERBAKI** | Profit salah, tiada supplier payable/wastage/per-product |
| Demo seed data | ⏳ Berbaki | Dari PROGRESS.md Phase 6 |
| Production deployment | ⏳ Berbaki | Dari PROGRESS.md Phase 6 |

---

## ✅ Yang Dah Siap (Session 2026-07-02/03)

### 1. Carry-Forward Stock Intake Lookup Fix
**Masalah**: Bila stok diambil hari ini tapi jualan/wastage direkodkan, intake tak ditemui sebab carian guna tarikh-match sahaja.

**Fix**:
- `src/repositories/salesRepo.ts` — tambah `distribution:stock_distribution(*, intake:stock_intake(*, supplier:suppliers(*)))` ke `SALES_WITH_RELATIONS`
- `src/repositories/wastageRepo.ts` — tambah `intake:stock_intake(*, supplier:suppliers(*))` ke `WASTAGE_WITH_RELATIONS`
- `src/hooks/useDailyBill.ts` — intake lookup: `sale.distribution?.intake || intakes.find(date-match)`; wastage: `wastage.intake || intakes.find(id-match)` kemudian date-match fallback

### 2. Supplier Price Auto-Fill (Per-Supplier-Per-Product)
**Masalah**: Cost tak ditetapkan per supplier per produk. Driver tak nampak cost, admin kena set.

**Fix**:
- **Migration**: `supabase/migrations/20260702000001_add_product_type_to_price_history.sql` — ADD COLUMN `product_type`, backfill `'Air Batu Besar'`, SET NOT NULL, composite index `(supplier_id, product_type, effective_date DESC)`, unique index `uq_price_history_supplier_product_date`. **DAH APPLIED oleh user.**
- `src/types/pokleh.ts` — `SupplierPriceHistory` ada `product_type: ProductType`
- `src/lib/db.ts` — Dexie version 8, index `supplierPriceHistory: "id, supplier_id, product_type, effective_date"`
- `src/repositories/suppliersRepo.ts` — `priceHistoryRepo.fetchBySupplier()`, `priceHistoryRepo.upsertPrice()`, `fetchAll` join `supplier:suppliers(name)`
- `src/hooks/useSupplierPriceHistory.ts` — `setPrice()`, `getLatestPrice()`, `pricesBySupplier` Map
- `src/components/suppliers/SuppliersManagement.tsx` — modal "Harga / Produk" dengan CurrencyInput per produk, badge harga, button DollarSign
- `src/components/stock/StockIntakeForm.tsx` — auto-fill `cost_per_pax` dari `pricesBySupplier` bila supplier dipilih; admin dapat edit, staff nampak read-only

### 3. Daily Closing UX (Close All Products)
**Masalah**: Kena pilih produk satu-satu untuk tutup hari. Padahal "tutup hari" = semua produk untuk lori itu.

**Fix**:
- `src/hooks/useDailyClosings.ts` — tambah `closeDayAll(date, truckId)` dan `reconcileDayAll(date, truckId)` yang loop `PRODUCT_TYPES` (3 produk), panggil RPC `perform_daily_closing` untuk setiap satu, kumpulkan hasil, toast sekali
- `src/components/closings/DailyClosingWorkflow.tsx` — buang product selector, grid 2-col (date + truck), tunjuk semua 3 produk status serentak, financials diagregat, satu button "Tutup Hari (semua produk)" + satu "Reconcile (semua produk)"
- **Pendekatan**: frontend loop (3 panggilan RPC) — tiada perubahan DB/RPC

### 4. Sync Sales → Debt Ledger (Migration Dah Wujud)
**Fail**: `supabase/migrations/20260701010000_sync_sales_to_debt_ledger.sql`
**Status**: ✅ Dah commit dalam git (`9a8ef0c fix: sync debt sales to debt_ledger + i18n orang->pax`)

Trigger function `sync_sale_to_debt_ledger()`:
- Normal debt sale → INSERT ledger entry (`entry_type='sale'`, +amount)
- Correction → reverse superseded sale's debt (`entry_type='payment'`), then add new sale's debt if 'debt'
- Reversal → reverse superseded sale's debt only
- Cash sale → no ledger entry
- `trg_debt_ledger_balance` trigger fires on each INSERT → `recalculate_customer_balance()` → `customers.debt_balance` kekal sync
- `SECURITY DEFINER` bypass RLS

---

## ⏳ FASA BERBAKI: Reports Fix (PRIORITY)

### Masalah
`src/components/reports/PoklehReports.tsx` ada 6 kelemahan berbanding aliran harian sistem:

### 1. Profit Calculation Salah
**Sekarang**: `profit = totalRevenue - totalExpenses`
**Sebenar**: `profit = revenue - supplier_payable - expenses`
- Kita bayar supplier untuk `(sold + wasted - reduction) × cost_per_pax`
- Cost stok dari `intake.cost_per_pax`, BUKAN dari `expenses`
- `expenses` hanya untuk kos operasi (minyak, gaji, dll)

**Fix**: Kira supplier_payable dari `intakes` (atau guna `daily_closings.supplier_payable` jika dah close)

### 2. Tiada Supplier Payable
Laporan tak tunjuk berapa berhutang/beri kat supplier. Padahal ini nombor penting dalam daily closing (`supplier_payable`).

### 3. Tiada Wastage
`useStockWastage` hook wujud tapi laporan tak ambil. Wastage affect profit (stok rosak = rugi).

### 4. Tiada Per-Product Breakdown
Ada 3 produk (Air Batu Besar/Kecil/Hancur) tapi laporan tak pecah jualan/profit ikut produk.

### 5. Tiada Daily Closing Summary
Table `daily_closings` ada nombor finalized (cash_sales, debt_sales, supplier_payable, profit_estimate) tapi laporan tak guna. Ini sumber data paling tepat sebab dah divalidasi.

### 6. Intake Tak Join Supplier
`intakes.forEach` cuma tambah `quantity_received`, tak tunjuk cost atau supplier.

### Cadangan Pelaksanaan (Pilihan B — Daily Closing Summary)
**Tambah tab baru "Daily Closing Summary"** yang tarik terus dari `daily_closings` table:
- Nombor dah finalized dan divalidasi (sama dengan apa admin tengok bila tutup hari)
- Tak perlu kira semula di frontend
- Termasuk: cash_sales, debt_sales, debt_collections, expenses_total, supplier_payable, profit_estimate, closing_balance

**Langkah-langkah**:
1. Tambah `useDailyClosings` import ke `PoklehReports.tsx`
2. Tambah tab "closing-summary" dalam TabsList (admin only)
3. Buat `closingData` useMemo — filter `closings` by date range, group by date, aggregate
4. Tunjuk LineChart: profit_estimate, supplier_payable, cash_sales over time
5. Tunjuk summary table: tarikh, truck, product, status, sold, cash, profit, supplier_payable
6. Betulkan profit calculation di summary cards (guna `revenue - supplier_payable - expenses`)
7. Tambah wastage data ke daily trends (import `useStockWastage`)
8. Tambah per-product breakdown (group sales by `product_type`)

**Fail-fail yang akan diubah**:
- `src/components/reports/PoklehReports.tsx` (utama)
- Mungkin tambah i18n keys di `src/lib/i18n/translations.ts`

---

## ⏳ FASA BERBAKI: Lain-lain (dari PROGRESS.md)

### Demo Seed Data
- [ ] Generate demo seed data (dari PROGRESS.md Phase 6)
- Buat migration `supabase/migrations/XXXXX_demo_seed_data.sql`
- Data: trucks, customers, suppliers, staff, stock intakes, sales, expenses, closings
- Untuk testing dan demo kepada user

### Production Deployment
- [ ] Production deployment (dari PROGRESS.md Phase 6)
- Vercel deployment (ada `vercel.json`)
- Pastikan env vars betul (Supabase URL, anon key)
- Test PWA di production
- Pastikan RLS policies aktif

---

## 🔧 Senibina & Konsep Penting (Rujukan Pantas)

### Product Types
```typescript
PRODUCT_TYPES = ['Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur']
```

### Stock Payment Model
- Bayar supplier untuk: `(sold + wasted - reduction) × cost_per_pax`
- Stok berbaki (closing_balance) carry-forward ke hari seterusnya
- `cost_per_pax` ditetapkan admin per supplier-per produk (auto-fill di intake)

### Daily Closing State Machine
```
open → closed → reconciled
```
- `open`: jualan sedang berjalan
- `closed`: hari tamat, kunci nombor (validasi: assigned = sold + returned)
- `reconciled`: admin semak & sahkan (final, untuk laporan)

### RPC `perform_daily_closing`
```sql
perform_daily_closing(
  p_closing_date DATE,
  p_truck_id UUID,
  p_product_type TEXT,
  p_user_id UUID,
  p_action TEXT DEFAULT 'close'  -- 'close' atau 'reconcile'
) RETURNS JSONB
```
- Unique key: `(closing_date, truck_id, product_type)` — satu row per truck+product+date
- `close`: kira semua nombor kewangan, set status='closed'
- `reconcile`: cuma tukar status='reconciled', tak kira semula (hanya lepas close)

### Computed Balance Pattern
- Truck stock dikira dynamically via `get_truck_available_stock()` RPC
- `customers.debt_balance` adalah cached value; source of truth = `debt_ledger`
- Trigger `trg_debt_ledger_balance` → `recalculate_customer_balance()` sync cache

### persistWrite Pattern (Complex API)
```typescript
persistWrite({
  entity, action, userId,
  execute,        // async function
  optimistic: { add, remove },  // functions
  onSuccess, msg
})
```
- Untuk simple insert: guna direct repo call + manual state update + `triggerRefresh` lebih mudah

### Offline Storage (Dexie)
- Versi schema semasa: **8**
- `src/lib/db.ts` — `OfflineSupplierPriceHistory` ada `product_type`
- Pattern: fetch online → cache ke Dexie → fallback ke cache bila offline

### i18n
- Bahasa: `ms` (Malay) dan `en` (English)
- Fail: `src/lib/i18n/translations.ts`
- Hook: `useLanguage()` → `{ t, lang, setLang }`

---

## 📂 Struktur Fail Penting

### Repositories (`src/repositories/`)
- `salesRepo.ts` — `SALES_WITH_RELATIONS` ada nested distribution→intake→supplier
- `wastageRepo.ts` — `WASTAGE_WITH_RELATIONS` ada nested intake→supplier
- `closingRepo.ts` — `fetchAll()` join truck; `closeOrReconcile()` call RPC
- `suppliersRepo.ts` — `priceHistoryRepo.fetchBySupplier()`, `upsertPrice()`
- Lain: auditRepo, customersRepo, debtRepo, expensesRepo, settlementRepo, staffRepo, stockRepo, trucksRepo

### Hooks (`src/hooks/`)
- `useDailyClosings.ts` — `closeDayAll()`, `reconcileDayAll()` (loop 3 produk)
- `useDailyBill.ts` — intake lookup guna distribution chain + fallback
- `useSupplierPriceHistory.ts` — `setPrice()`, `getLatestPrice()`, `pricesBySupplier`
- `useStockIntake.ts` — auto-fill cost dari price history
- `useStockWastage.ts` — **belum diguna di reports** (perlu tambah)
- `useSales.ts`, `useExpenses.ts`, `useDebtCollection.ts`, `useTrucks.ts` — dah diguna di reports

### Components (`src/components/`)
- `reports/PoklehReports.tsx` — **PERLU FIX** (profit salah, tiada supplier payable/wastage/per-product/closing summary)
- `closings/DailyClosingWorkflow.tsx` — dah siap (close all products)
- `suppliers/SuppliersManagement.tsx` — dah siap (price modal)
- `stock/StockIntakeForm.tsx` — dah siap (auto-fill cost)

### Migrations (`supabase/migrations/`)
- `20260620000000_pokleh_enterprise_schema.sql` — schema asas (16 tables)
- `20260620000002_pokleh_daily_closing.sql` — `perform_daily_closing` RPC
- `20260620000003_pokleh_correction_model.sql` — debt_ledger balance trigger
- `20260701010000_sync_sales_to_debt_ledger.sql` — sales→debt_ledger sync trigger
- `20260702000001_add_product_type_to_price_history.sql` — per-supplier-per-product pricing (DAH APPLIED)

---

## 🚀 Cara Sambung Kerja (Bila Balik ke Laptop)

1. **Buka workspace**: `d:\Programming\Github_Repo\Production-Repository\Pokleh-Enterprise`
2. **Check git status**: `git status` dan `git log --oneline -5`
3. **Baca fail ini**: `development.md` untuk konteks
4. **Mula dengan**: Reports Fix (Fasa Berbaki — PRIORITY)
5. **Lepas reports siap**: Demo seed data → Production deployment

### Untuk Reports Fix, mula dengan:
1. Baca `src/components/reports/PoklehReports.tsx` (dah ada analisis di atas)
2. Tambah `useDailyClosings` dan `useStockWastage` imports
3. Betulkan profit calculation: `revenue - supplier_payable - expenses`
4. Tambah tab "Daily Closing Summary"
5. Tambah per-product breakdown
6. Test: buat jualan + tutup hari, lepas tu buka reports — nombor patut sama

---

## 📝 Nota Tambahan

- **TypeScript error pre-existing**: `suppliersRepo.ts` line 5 (`create` method, `Record<string, unknown>` not assignable) — BUKAN dari perubahan kita, pattern sama across repos. Abaikan.
- **Git**: Semua perubahan session 2026-07-02/03 dah commit (`8d730c1 rush commit`). Tiada uncommitted changes.
- **Testing**: Belum ada full 1-day end-to-end test. Perlu test selepas reports fix:
  1. Admin set supplier prices per produk
  2. Staff buat stock intake (auto-fill cost)
  3. Staff distribute stok ke lori
  4. Staff buat jualan (cash + debt)
  5. Staff record wastage
  6. Staff tutup hari (semua 3 produk serentak)
  7. Admin reconcile
  8. Buka reports — verify nombor sama dengan closing
