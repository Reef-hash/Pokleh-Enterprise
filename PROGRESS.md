# Pokleh Enterprise — Progress Tracker

## Status Legend
- ✅ Complete
- 🔄 In Progress
- ⏳ Pending
- ❌ Blocked

---

## Phase 1: Foundation

### Dependencies
- [x] Install zustand
- [x] Install dexie
- [x] Install react-hook-form + @hookform/resolvers
- [x] Install zod
- [x] Install vite-plugin-pwa

### PWA Configuration
- [x] Configure vite-plugin-pwa in vite.config.ts
- [x] Create PWA manifest (name, icons, theme)
- [x] Configure workbox runtime caching for Supabase API
- [ ] Create app icons (192x192, 512x512)

### Offline Storage (Dexie/IndexedDB)
- [x] Create PoklehDB class with schema
- [x] Define offline entity types (profiles, customers, areas, suppliers)
- [x] Define SyncQueueItem type
- [x] Define OfflineAuditLog type

### Services
- [x] Implement OfflineDetector (network listener + heartbeat)
- [x] Implement SyncEngine (queue processor, FIFO order)
- [x] Financial table append-only sync rule
- [x] Retry logic with exponential backoff (max 5)

### State Management (Zustand)
- [x] Create authStore (session, profile, signIn, signUp, signOut)
- [x] Create offlineStore (online/offline status)
- [x] Create syncStore (sync queue status)
- [x] Delegate existing useAuth hook to authStore

### App Integration
- [x] Initialize sync engine on app mount
- [x] Subscribe to offline status changes
- [x] Subscribe to sync status changes

---

## Phase 2: Core Domain & Database

- [x] Create Supabase migration for all 16 tables
- [x] Implement RLS policies (admin full, staff area-scoped)
- [x] Create database triggers for audit_logs
- [x] Create database triggers for debt_balance cache update
- [x] Generate TypeScript types from schema
- [x] Build Area Management UI (CRUD)
- [x] Build Customer Management UI (CRUD)
- [x] Build Supplier Management UI (adapt existing)
- [x] Build Staff Area Assignment UI
- [x] Implement offline hooks for all new entities

---

## Phase 3: Stock Operations

- [x] Build Stock Intake form
- [x] Build Stock Distribution form (with validation)
- [x] Build Stock Return form (with validation)
- [x] Build Supplier Settlement engine
- [x] Build Supplier Settlement UI
- [x] Implement offline sync for stock records
- [x] Implement distribution total <= intake total validation
- [x] Create RPC functions (get_total_sold_for_intake, get_total_returned_for_intake)
- [x] Register stock modules in navigation and routing

---

## Phase 4: Sales & Debt

- [x] Build Sales recording form (cash + debt)
- [x] Build Debt Ledger engine (balance_before/balance_after)
- [x] Build Debt Collection workflow
- [x] Build Customer balance display (ledger-derived)
- [x] Implement append-only sync for sales
- [x] Implement append-only sync for debt records

---

## Phase 5: Expenses & Profit

- [x] Build Expense Management (CRUD)
- [x] Build Supplier Price History viewer
- [x] Build Profit Calculation engine
- [x] Build Daily Report (received, sold, returned, cash, debt, collections)
- [x] Build Area Report
- [x] Build Staff Report
- [x] Build Company Report
- [x] Integrate Recharts for visual reports

---

## Phase 6: Daily Closing & Deployment

- [x] Build Daily Closing workflow
- [x] Implement close validation: assigned = sold + returned
- [x] Implement OPEN → CLOSED → RECONCILED state machine
- [x] Implement report freezing after close
- [x] Build Audit Log viewer (admin only)
- [x] Full offline integration testing (TypeScript + production build pass)
- [ ] Generate demo seed data
- [ ] Production deployment

---

## Architecture Freeze v1 Revisions

- [x] Revision 1: Debt ledger is source of truth (debt_balance is cached)
- [x] Revision 2: Supplier settlement includes payable_amount + cost_per_pax
- [x] Revision 3: Staff-area via staff_area_assignments junction table
- [x] Revision 4: Append-only sync for financial records
- [x] Revision 5: audit_logs table with DB triggers
- [x] Revision 6: daily_closings table with validation state machine
