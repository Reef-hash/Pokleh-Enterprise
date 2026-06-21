# Pokleh Enterprise — Technical Documentation

> Ice Distribution Management System  
> Version: 1.0.0 | Stack: React 19 · TypeScript · Supabase · Dexie.js · PWA

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Authentication & Roles](#5-authentication--roles)
6. [Domain Modules](#6-domain-modules)
7. [Database Schema](#7-database-schema)
8. [Offline-First System](#8-offline-first-system)
9. [State Management](#9-state-management)
10. [API Reference](#10-api-reference)
11. [Business Rules & Validations](#11-business-rules--validations)
12. [Deployment Guide](#12-deployment-guide)

---

## 1. Project Overview

**Pokleh Enterprise** adalah sistem pengurusan pengagihan ais yang dibina khas untuk perniagaan pengagihan ais di Malaysia. Sistem ini mengendalikan keseluruhan kitaran operasi — dari pengambilan stok daripada pembekal, pengagihan ke kawasan penghantaran, jualan kepada pelanggan (tunai atau hutang), kutipan hutang, hingga penutupan harian dan penyesuaian pembekal.

**Pengguna sasaran:** Pemilik perniagaan pengagihan ais dan kakitangan penghantaran.

**Mata wang:** Ringgit Malaysia (RM), locale `ms-MY`.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React 19 SPA (Vite + PWA)             │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Auth Layer  │  │  UI/Pages    │  │  Hooks Layer  │  │
│  │  (Zustand)   │  │  (shadcn/ui) │  │  (React Query)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                 │                  │           │
│  ┌──────▼─────────────────▼──────────────────▼────────┐  │
│  │           Repository Layer (repositories/)         │  │
│  │  areasRepo · salesRepo · stockRepo · debtRepo ...  │  │
│  └──────────────────────────┬──────────────────────────┘  │
│                             │                           │
│  ┌──────────────────────────▼──────────────────────────┐  │
│  │           Offline Layer                             │  │
│  │  OfflineDetector → SyncEngine → Dexie (IndexedDB)  │  │
│  └──────────────────────────┬──────────────────────────┘  │
└─────────────────────────────┼───────────────────────────┘
                              │ HTTPS (Supabase JS SDK)
┌─────────────────────────────▼───────────────────────────┐
│              Supabase (PostgreSQL + Auth + Realtime)     │
│                                                         │
│  16 tables · RLS policies · DB triggers · RPC functions  │
└─────────────────────────────────────────────────────────┘
```

### Aliran Data Utama (Stock Lifecycle)

```
Pembekal
   │
   ▼ stock_intake (rekod pengambilan)
   │
   ▼ stock_distribution (agih ke kawasan)
   │
   ├──▶ sales (jualan ke pelanggan)
   │      ├── payment_type: 'cash'
   │      └── payment_type: 'debt' ──▶ debt_ledger (append-only)
   │
   └──▶ stock_return (stok tak terjual)
          │
          ▼
   supplier_settlement (kira payable kepada pembekal)
          │
          ▼
   daily_closing (penutupan harian: open → closed → reconciled)
```

---

## 3. Technology Stack

| Lapisan | Teknologi | Versi |
|---------|-----------|-------|
| Frontend Framework | React | 19 |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 6.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui (Radix UI) | Latest |
| Charts | Recharts | 2.x |
| Icons | Lucide React | Latest |
| Backend / Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth + RLS | Latest |
| Offline Storage | Dexie.js (IndexedDB) | 4.x |
| Global State | Zustand | Latest |
| Server State | TanStack React Query | 5.x |
| Forms | React Hook Form + Zod | Latest |
| PWA | vite-plugin-pwa + Workbox | Latest |
| Date Utilities | date-fns | 3.x |
| PDF Generation | React PDF | Latest |

---

## 4. Project Structure

```
pokleh-enterprise/
├── src/
│   ├── App.tsx                  # Root: router, sync init, offline init
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Global CSS + Tailwind
│   │
│   ├── pages/
│   │   ├── Index.tsx            # Landing page / redirect to Dashboard
│   │   ├── Auth.tsx             # Login / Register page
│   │   ├── Dashboard.tsx        # Main app shell (page router)
│   │   ├── Documentation.tsx    # In-app help docs
│   │   └── NotFound.tsx         # 404 page
│   │
│   ├── components/
│   │   ├── dashboard/           # PoklehDashboard (KPI + quick links)
│   │   ├── areas/               # AreaManagement
│   │   ├── customers/           # CustomerManagement
│   │   ├── suppliers/           # SuppliersManagement, SupplierPriceHistoryView
│   │   ├── staff/               # StaffAssignment
│   │   ├── stock/               # StockIntakeForm, StockDistributionForm,
│   │   │                        #   StockReturnForm, SupplierSettlementView
│   │   ├── sales/               # SalesEntryForm, DebtLedgerView, DebtCollectionForm
│   │   ├── expenses/            # ExpenseManagement
│   │   ├── closings/            # DailyClosingWorkflow
│   │   ├── reports/             # PoklehReports (charts + tables)
│   │   ├── audit/               # AuditLogViewer (admin only)
│   │   ├── admin/               # StaffAccountManagement (admin only)
│   │   ├── auth/                # ProtectedRoute, AdminRoute
│   │   ├── help/                # GuidedTour, HelpButton
│   │   ├── layout/              # DashboardLayout (sidebar + topbar)
│   │   └── ui/                  # shadcn/ui primitives
│   │
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth hook (delegates to authStore)
│   │   ├── useAreas.ts          # Areas CRUD
│   │   ├── useCustomers.ts      # Customers CRUD
│   │   ├── usePoklehSuppliers.ts # Suppliers CRUD
│   │   ├── useStockIntake.ts    # Stock intake CRUD
│   │   ├── useStockDistribution.ts
│   │   ├── useStockReturn.ts
│   │   ├── useSales.ts
│   │   ├── useDebtLedger.ts
│   │   ├── useDebtCollection.ts
│   │   ├── useExpenses.ts
│   │   ├── useDailyClosings.ts
│   │   ├── useSettlement.ts
│   │   ├── useStaffAssignments.ts
│   │   ├── useSupplierPriceHistory.ts
│   │   └── use-toast.ts / use-mobile.tsx
│   │
│   ├── repositories/
│   │   ├── areasRepo.ts         # Supabase queries untuk areas
│   │   ├── salesRepo.ts
│   │   ├── stockRepo.ts
│   │   ├── debtRepo.ts
│   │   ├── closingRepo.ts
│   │   ├── expensesRepo.ts
│   │   ├── customersRepo.ts
│   │   ├── suppliersRepo.ts
│   │   ├── settlementRepo.ts
│   │   ├── staffRepo.ts
│   │   └── auditRepo.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts         # Zustand: user, profile, session
│   │   ├── offlineStore.ts      # Zustand: online/offline status
│   │   └── syncStore.ts         # Zustand: sync queue status
│   │
│   ├── services/
│   │   ├── offline.ts           # OfflineDetector (browser events + heartbeat)
│   │   └── sync.ts              # SyncEngine (queue processor, retry backoff)
│   │
│   ├── lib/
│   │   ├── db.ts                # Dexie schema (PoklehDB)
│   │   ├── writeHelper.ts       # persistWrite() helper (online/offline routing)
│   │   ├── branding.ts          # App name, icons, theme config
│   │   ├── currency.ts          # formatCurrency() → RM x.xx
│   │   ├── errors.ts            # getUserFriendlyError()
│   │   ├── utils.ts             # cn() + misc utilities
│   │   ├── generatePDF.tsx      # PDF report generation
│   │   ├── help-content.ts      # In-app guided tour content
│   │   └── i18n/                # Internationalisation strings
│   │
│   ├── integrations/supabase/   # Auto-generated Supabase client + types
│   └── types/pokleh.ts          # Core domain TypeScript interfaces
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20260620000000_pokleh_enterprise_schema.sql   # 16 tables + RLS
│       ├── 20260620000001_pokleh_rpc_functions.sql       # RPC helpers
│       ├── 20260620000002_pokleh_daily_closing.sql       # perform_daily_closing()
│       ├── 20260620000003_pokleh_correction_model.sql    # Correction workflow
│       ├── 20260620000004_fix_staff_assignment_unique.sql
│       ├── 20260620000005_add_onboarding_completed.sql   # Guided tour flag
│       ├── 20260620000006_admin_delete_user.sql          # Admin user deletion
│       └── 20260620000007_fix_audit_trigger.sql
│
├── public/
│   └── icons/                   # PWA icons (192, 512, maskable)
│
├── package.json
├── vite.config.ts               # Vite + PWA plugin config
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json                  # SPA rewrite rule
```

---

## 5. Authentication & Roles

### Provider
Supabase Auth (email + password).

### Roles

| Role | Keistimewaan |
|------|-------------|
| `admin` | Akses penuh semua modul; urus akaun kakitangan; lihat audit log |
| `staff` | Akses terhad kepada kawasan yang ditetapkan; tidak boleh akses audit log atau urus akaun |

### Aliran Login
1. Pengguna masuk `email + password` → `supabase.auth.signInWithPassword()`
2. Auth store ambil `profile` dari jadual `profiles`
3. Role disimpan dalam `profile.role`
4. `ProtectedRoute` halang akses jika tiada sesi
5. `AdminRoute` halang akses jika role bukan `admin`

### Onboarding Tour
Apabila pengguna baru login buat kali pertama (`onboarding_completed = false`), **GuidedTour** akan muncul secara automatik. Selepas tour selesai atau dilangkau, `profiles.onboarding_completed` dikemas kini ke `true`.

---

## 6. Domain Modules

### 6.1 Areas (Kawasan)
Kawasan penghantaran. Setiap pelanggan, stok, dan jualan terikat pada satu kawasan.

| Operasi | Keterangan |
|---------|-----------|
| CREATE | Tambah kawasan baru (nama unik) |
| READ | Senarai semua kawasan |
| UPDATE | Kemaskini nama kawasan |
| DELETE | Padam kawasan (admin sahaja) |

---

### 6.2 Customers (Pelanggan)
Pelanggan ais dengan tracking hutang.

| Field | Keterangan |
|-------|-----------|
| `name` | Nama pelanggan |
| `phone` | No. telefon (optional) |
| `address` | Alamat (optional) |
| `area_id` | Kawasan berkhidmat |
| `debt_balance` | Baki hutang semasa (cached dari `debt_ledger`) |
| `active` | Status aktif/tidak aktif |

> `debt_balance` adalah cache — sumber kebenaran sebenar ialah `debt_ledger`. RPC `recalculate_customer_balance()` boleh digunakan untuk semak semula.

---

### 6.3 Suppliers (Pembekal)
Pembekal ais dengan rekod sejarah harga.

- **Supplier**: nama, no. telefon
- **SupplierPriceHistory**: harga kos per pax mengikut tarikh efektif

---

### 6.4 Staff Assignments (Tugasan Kawasan)
Kakitangan boleh ditugaskan ke kawasan tertentu melalui jadual `staff_area_assignments`. Satu kakitangan hanya boleh aktif di satu kawasan pada satu masa (unique constraint `staff_id + area_id`).

---

### 6.5 Stock Operations (Operasi Stok)

#### Stock Intake
Rekod ais yang diterima dari pembekal.
- `quantity_received`: jumlah pax diterima
- `cost_per_pax`: kos per pax (disimpan untuk settlement)

#### Stock Distribution
Agih stok yang diterima ke kawasan-kawasan.
- Validasi: jumlah `quantity_assigned` semua kawasan ≤ `quantity_received`

#### Stock Return
Stok yang tidak terjual dikembalikan dari kawasan.
- Validasi: `quantity_returned` ≤ `quantity_assigned`

---

### 6.6 Sales & Debt (Jualan & Hutang)

#### Sales Entry
Rekod jualan kepada pelanggan.
- `payment_type: 'cash'` — bayar terus
- `payment_type: 'debt'` — catat sebagai hutang, masuk `debt_ledger`

#### Debt Ledger (Append-Only)
Setiap perubahan hutang pelanggan direkodkan sebagai entri baru.

| `entry_type` | Bila berlaku |
|-------------|-------------|
| `sale` | Jualan dengan payment_type = 'debt' |
| `payment` | Kutipan hutang |
| `adjustment` | Pembetulan manual (admin) |

Setiap entri menyimpan `balance_before` dan `balance_after`.

#### Debt Collection
Rekod pembayaran hutang oleh pelanggan.

---

### 6.7 Expenses (Perbelanjaan)
Rekod perbelanjaan operasi harian (bahan api, gaji, dll).

| Field | Keterangan |
|-------|-----------|
| `category` | Kategori perbelanjaan |
| `amount` | Jumlah (RM) |
| `expense_date` | Tarikh |
| `notes` | Nota tambahan |

---

### 6.8 Supplier Settlement (Penyelesaian Pembekal)
Dikira berdasarkan setiap rekod `stock_intake`:

```
payable_quantity = total_received - total_returned
payable_amount   = payable_quantity × cost_per_pax
```

Status: `pending` → `settled`

---

### 6.9 Daily Closing (Penutupan Harian)
State machine per kawasan per tarikh:

```
open ──▶ closed ──▶ reconciled
```

| Status | Keterangan |
|--------|-----------|
| `open` | Hari sedang berjalan |
| `closed` | Penutupan telah dibuat (selepas validasi lulus) |
| `reconciled` | Admin telah sahkan dan sesuaikan |

**Validasi semasa `close`:**
```
total_assigned == total_sold + total_returned
```
Jika tidak sama, sistem akan lempar exception.

**Agregat yang dikira:**
- `total_assigned`, `total_sold`, `total_returned`
- `cash_sales`, `debt_sales`, `debt_collections`
- `expenses_total`, `supplier_payable`
- `profit_estimate = cash_sales + debt_sales + debt_collections - expenses_total - supplier_payable`

---

### 6.10 Reports (Laporan)
Laporan tersedia melalui `PoklehReports`:

- **Sales Report** — jualan mengikut tarikh / kawasan
- **Expense Report** — perbelanjaan mengikut kategori
- **Collection Report** — kutipan hutang
- **Profit Report** — untung rugi harian
- **Area Report** — prestasi setiap kawasan
- **Staff Report** — prestasi kakitangan

Semua laporan disokong dengan **Recharts** untuk visualisasi carta.

---

### 6.11 Audit Log (Log Audit)
Dicatat secara automatik oleh trigger PostgreSQL untuk semua jadual kewangan. Hanya boleh dilihat oleh `admin`.

| Field | Keterangan |
|-------|-----------|
| `user_id` | Pengguna yang melakukan tindakan |
| `action` | INSERT / UPDATE / DELETE |
| `entity` | Nama jadual |
| `old_values` | Data sebelum perubahan (JSON) |
| `new_values` | Data selepas perubahan (JSON) |

---

### 6.12 Staff Account Management
Admin boleh:
- Lihat semua akaun kakitangan
- Padam akaun kakitangan (melalui RPC `admin_delete_user`)

---

## 7. Database Schema

### 16 Jadual

| Jadual | Keterangan |
|--------|-----------|
| `profiles` | Akaun pengguna (terikat pada `auth.users`) |
| `areas` | Kawasan penghantaran |
| `staff_area_assignments` | Hubungan kakitangan-kawasan |
| `customers` | Pelanggan ais |
| `suppliers` | Pembekal ais |
| `supplier_price_history` | Sejarah harga kos per pax |
| `stock_intake` | Stok diterima dari pembekal |
| `stock_distribution` | Stok diagihkan ke kawasan |
| `stock_return` | Stok tidak terjual dikembalikan |
| `sales` | Jualan kepada pelanggan |
| `debt_ledger` | Rekod pergerakan hutang (append-only) |
| `debt_collection` | Pembayaran hutang |
| `expenses` | Perbelanjaan operasi |
| `supplier_settlements` | Penyelesaian pembayaran pembekal |
| `daily_closings` | Penutupan harian |
| `audit_logs` | Log perubahan kewangan |

### RLS Policies
- **Admin**: akses penuh semua jadual
- **Staff**: akses terhad kepada kawasan sendiri melalui fungsi helper `get_my_area_ids()`

### RPC Functions

| Fungsi | Keterangan |
|--------|-----------|
| `perform_daily_closing(date, area_id, user_id, action)` | Tutup atau reconcile hari |
| `get_total_sold_for_intake(intake_id)` | Jumlah terjual untuk satu intake |
| `get_total_returned_for_intake(intake_id)` | Jumlah dikembalikan untuk satu intake |
| `recalculate_customer_balance(customer_id)` | Kira semula baki hutang dari ledger |
| `admin_delete_user(user_id)` | Padam akaun pengguna (admin sahaja) |

---

## 8. Offline-First System

### OfflineDetector (`src/services/offline.ts`)
- Mendengar `window.online` / `window.offline` events
- Heartbeat setiap 30 saat ke Supabase REST endpoint
- Notify semua subscribers apabila status berubah

### SyncEngine (`src/services/sync.ts`)
- Queue tersimpan dalam **Dexie (IndexedDB)**
- FIFO processing apabila sambungan kembali
- **Financial tables** (sales, debt_ledger, dll): append-only — hanya INSERT dibenarkan
- Retry dengan **exponential backoff**: `min(1000 × 2^n, 16000)ms`
- Max 5 percubaan sebelum item dibuang dari queue

### `persistWrite()` (`src/lib/writeHelper.ts`)
Helper utama untuk semua operasi tulis:

```
Offline? → enqueue ke syncQueue + optimistic UI
Online?  → panggil Supabase → success: onSuccess() + dexiePut()
                             → error: rollback optimistic UI
```

### Dexie Schema (`src/lib/db.ts`)
Tables dalam IndexedDB:
- `profiles`, `areas`, `customers`, `suppliers` (entities boleh cache)
- `syncQueue` — pending operations untuk sync

---

## 9. State Management

### Zustand Stores

| Store | Kandungan |
|-------|----------|
| `authStore` | `user`, `session`, `profile`, `loading`, `signIn/signUp/signOut` |
| `offlineStore` | `isOnline` status + subscriber |
| `syncStore` | `syncStatus` (idle/syncing/error) + subscriber |

### React Query (TanStack)
Digunakan dalam hooks untuk server state (fetch + cache + invalidate).

### Pattern Hooks
```typescript
// Contoh pattern di setiap hook
const { data, refetch } = useQuery(...)
const mutation = useMutation({
  mutationFn: async (payload) => persistWrite({ ... })
  onSuccess: () => refetch()
})
```

---

## 10. API Reference

Lihat [API.md](./API.md) untuk rujukan lengkap.

### Contoh Panggilan RPC

```typescript
// Tutup hari
await supabase.rpc("perform_daily_closing", {
  p_closing_date: "2026-06-22",
  p_area_id: "uuid-kawasan",
  p_user_id: "uuid-pengguna",
  p_action: "close"
});

// Kira semula hutang pelanggan
await supabase.rpc("recalculate_customer_balance", {
  p_customer_id: "uuid-pelanggan"
});
```

---

## 11. Business Rules & Validations

| Peraturan | Butiran |
|-----------|---------|
| Stock distribution ≤ intake | `SUM(quantity_assigned) ≤ quantity_received` |
| Stock return ≤ distribution | `quantity_returned ≤ quantity_assigned` |
| Daily closing validation | `total_assigned == total_sold + total_returned` |
| Debt ledger append-only | Tiada UPDATE/DELETE dibenarkan pada `debt_ledger` |
| Financial records append-only | Sales, debt records, expenses tidak boleh dipadam selepas dibuat |
| Staff assignment unique | Satu kakitangan hanya boleh aktif di satu kawasan pada satu masa |
| Supplier settlement | `payable_amount = (received - returned) × cost_per_pax` |
| Profit estimate | `cash + debt + collections - expenses - supplier_payable` |

---

## 12. Deployment Guide

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Build & Deploy

```bash
npm install
npm run build       # output ke dist/
```

Deploy folder `dist/` ke:
- **Vercel** — `vercel.json` sudah dikonfigurasi untuk SPA rewrite
- **Netlify** — tambah `_redirects`: `/* /index.html 200`
- **Cloudflare Pages** — auto detect Vite

### Supabase Migrations

```bash
supabase db push    # jalankan semua migrations
```

Jalankan mengikut urutan nombor migration.

### PWA Icons
Letakkan fail berikut dalam `public/icons/`:
- `icon-192.png`
- `icon-512.png`
- `icon-512-maskable.png`

---

*Dokumen ini dijana secara automatik berdasarkan analisis kod sumber penuh Pokleh Enterprise v1.0.0.*
