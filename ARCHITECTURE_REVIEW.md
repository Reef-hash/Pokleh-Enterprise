# Pokleh Enterprise — Architecture Review

**Reviewer:** Staff Engineer review (offline-first PWA / Dexie / Supabase)
**Scope:** Reliability, maintainability, performance, sync consistency, DX
**Method:** Direct inspection of `src/lib/db.ts`, `src/lib/writeHelper.ts`, `src/services/sync.ts`, `src/services/offline.ts`, all 13 `src/hooks/use*.ts` write hooks, `src/repositories/*.ts`, `src/stores/*.ts`, `src/App.tsx`, `package.json`, and the Postgres schema/migrations.

---

## A. Executive Summary

The system is not unreliable because it lacks MVVM. It is unreliable because the **data layer has no single source of truth, no idempotent write path, and inconsistent offline coverage**. React hooks already function as informal ViewModels — that part of "MVVM" is effectively in place. The actual defects live one layer down, in how records get an identity, how the sync queue replays them, and how independent hook instances disagree with each other about what the current state is.

Three findings dominate everything else and explain almost all seven reported symptoms:

1. **IDs are server-generated, but the offline queue is keyed by a client-generated ID that is never sent to the server.** This is the root cause of duplicate records, both in the local Dexie cache (permanently) and in Supabase itself (whenever a retry follows a successful-but-unconfirmed insert — a routine occurrence on a PWA used by drivers on phones with flaky signal, where tabs get backgrounded/killed mid-request).
2. **Every write hook keeps its own private `useState`.** There is no shared, reactive cache. Two components that both call `useStockIntake()` (e.g. the intake form and the reports page) hold two independent copies of the truth. A save in one doesn't appear in the other until that *specific* hook instance happens to refetch. This is what makes saves "feel like they didn't happen" and trains users to retry — which is what manufactures the duplicates that finding #1 then fails to deduplicate.
3. **Offline-write coverage is inconsistent across modules.** Sales, returns, expenses, and debt collection have an offline path (via a shared `persistWrite` helper, or a hand-rolled equivalent). Supplier settlement calculation and **daily closing have none** — an explicitly "offline-first" system cannot close the day without a live connection, which directly contradicts the stated business requirement.

**On the central question — would strict MVVM fix this?** No, only partially, and it is not the highest-leverage fix available. MVVM is a *presentation-layer* pattern; the bugs above live in the *data/sync layer*. Imposing strict View/ViewModel ceremony on top of the current data layer would make the hooks more uniform to read, but would not stop a single duplicate record or fix a single offline gap. The correct fix is a **Local-First Repository + Outbox** as the backbone, with the existing hooks-as-ViewModels pattern kept (it's already idiomatic and mostly fine) and a small Service Layer added for the multi-step financial transactions that are currently being orchestrated unsafely on the client.

---

## B. Root Cause Analysis

### B1. No client-owned identity → broken idempotency (the duplicate-record bug)

Every financial table is defined as:

```sql
id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
```
(`supabase/migrations/20260620000000_pokleh_enterprise_schema.sql`, `stock_intake`, `sales`, `debt_ledger`, `debt_collection`, `stock_return`, `expenses`)

The server, not the client, decides the row's identity. Meanwhile, every offline write goes through `persistWrite` (`src/lib/writeHelper.ts:35-43`):

```
const tempId = crypto.randomUUID();
const payload = id ? { ...data, id } : { ...data };   // `id` is never passed by any caller
await syncEngine.enqueue({ entity, entityId: id || tempId, action, payload });
```

No caller (`useSales`, `useStockReturn`, `useExpenses`, `useDebtCollection`, the hand-rolled `useStockIntake`) ever passes `id` into this config. So `payload` never contains an `id`, while the queue item's `entityId` is the client's `tempId`. When the queue is replayed (`src/services/sync.ts:97-123`):

```
const { data } = await supabase.from(item.entity).insert(payload).select("id").single();
if (data) await db.syncQueue.update(item.id!, { entityId: data.id });
```

Supabase generates a **new, different** id. The queue item is updated with the new id, but **the Dexie table row that was already written under `tempId` (via `cacheOffline`) is never updated or removed.** The next `fetchAll()` (triggered by `refreshTick`) pulls the canonical row under the server id and `bulkPut`s it alongside the orphaned `tempId` row — both now sit permanently in IndexedDB. That is a duplicate, by construction, on every single offline write in the app.

It gets worse for true server-side duplicates. `processItem` has a guard meant to stop double-inserts on retry:

```
if (FINANCIAL_TABLES.has(item.entity)) {
  const { data: existing } = await supabase.from(item.entity).select("id").eq("id", item.entityId).maybeSingle();
  if (existing) return;
}
```

This checks for a row whose id equals `item.entityId` — the **client tempId**. Since the server never receives that id (see above), this lookup can never match for an INSERT. The guard is structurally inert. If an insert succeeds on the server but the subsequent `db.syncQueue.delete(item.id!)` doesn't complete (tab killed, OS backgrounds the PWA, IndexedDB write fails) — a normal occurrence for delivery staff on phones — the next `processQueue()` run **re-inserts the same financial record as a brand-new row in Supabase**. There is no database-level constraint to catch this either: none of the financial tables has a unique constraint on anything resembling an idempotency key.

This single defect is the direct cause of reported symptoms **#3 (duplicate records)** and a major contributor to **#5 (local/UI/cloud state divergence)**.

### B2. No shared source of truth → "UI doesn't update" (and the retries that create #1's duplicates)

Every `useX` hook (`useStockIntake`, `useSales`, `useExpenses`, `useDebtCollection`, …) owns its data in a private `useState`, populated by its own `fetchAll()` on mount and refreshed only on its own `refreshTick` dependency. There is no cache shared between hook instances. Concretely: `useStockIntake()` is called independently in `StockIntakeForm.tsx`, `PoklehReports.tsx`, and indirectly via `stockIntakeRepo` in `SupplierSettlementView.tsx`. Each call site gets its **own** copy of the intake list. A save in the form updates that instance's state optimistically — but a different screen showing the same data has no way to know anything changed until *it* independently refetches.

Offline, this is worse: `refreshTick` is only bumped after `syncEngine.processQueue()` runs, which only happens while online. So while offline, a screen that isn't the one you just submitted from will look completely unchanged — exactly symptom **#1 ("UI does not immediately update")** and **#2 ("user retries")**. The retry, on a system with the B1 defect, creates a second record.

Notably, `@tanstack/react-query` (`package.json`, `^5.83.0`) is already a dependency — the right tool for exactly this problem — but there is no `QueryClientProvider` anywhere in `src/App.tsx` and zero `useQuery`/`useMutation` usage in the codebase. It's dead weight; the team is paying its install cost while hand-rolling the cache/loading-state logic it exists to provide.

### B3. Offline coverage is inconsistent across modules

| Hook | Offline write path? |
|---|---|
| `useSales`, `useStockReturn`, `useExpenses`, `useDebtCollection` (collection record) | Yes, via `persistWrite` |
| `useStockIntake` | Yes, hand-rolled (duplicates `persistWrite` logic with its own bugs) |
| `useSettlements.markSettled` | Yes, hand-rolled |
| `useSettlements.calculateSettlement` | **No** — direct `supabase` calls, falls into a generic catch → "Connection error. Please try again." |
| `useDailyClosings.closeDay` / `reconcileDay` | **No** — direct RPC call, no offline branch at all |

Daily closing is one of the explicit core features in this project's brief. As written, **a truck that loses signal at end of day cannot close the day** — the most basic offline-first guarantee the product promises is violated for one of its most important workflows. This is symptom **#4 (inconsistent sync)** and **#7 (delayed/unreliable actions)** in concrete form: three different reliability tiers coexist for "save a record," depending on which hook you happen to be looking at.

### B4. Multi-step financial transactions are orchestrated client-side, non-atomically — and one path silently drops a write

`useDebtCollection.addCollection` (`src/hooks/useDebtCollection.ts:50-94`) does three things as separate, sequential network calls: (1) insert the collection row via `persistWrite`, (2) `customersRepo.fetchBalance` to read the *current* balance, (3) insert a `debt_ledger` row with a client-computed `balance_before`/`balance_after`. Two problems:

- **The offline path silently drops the ledger entry.** `collectionResult` is only ever assigned inside `onSuccess`, which `persistWrite` only calls on its *online* success branch (`src/lib/writeHelper.ts:62`). On the offline branch, `persistWrite` returns `{ success: true, offline: true }` without ever calling `onSuccess`. So `if (result.success && collectionResult)` is false offline, and **no debt-ledger entry is ever created for an offline collection — not now, not after sync.** The collection itself eventually syncs to Supabase, but its ledger trail never does. This directly produces symptom **#5 (state divergence)** in the most damaging place possible: the debt ledger, the audited financial record.
- **Even online, this is a classic read-then-write race.** The Postgres schema already has a trigger, `maintain_debt_balance` (`supabase/migrations/20260620000003_pokleh_correction_model.sql:84-103`), that recalculates `customers.debt_balance` authoritatively from the full `debt_ledger` history on every insert — the migration's own comment says *"customers.debt_balance is a CACHED value only; source of truth is debt_ledger."* The client doesn't need to compute `balance_before/after` at all; the database already owns that. By computing it client-side from a separate, non-transactional read, the code reintroduces exactly the race the trigger was built to avoid: two concurrent collections for the same customer can both read the same stale "before" balance, producing an internally inconsistent audit trail in `debt_ledger` even though the cached `customers.debt_balance` self-heals via the trigger.

### B5. Connectivity detection lags reality

`offlineDetector` (`src/services/offline.ts`) combines `navigator.onLine` events with a 30-second heartbeat (`startHeartbeat`, line 27-44). A connection that drops between heartbeats can be acted on as "online" for up to 30 seconds, during which `processQueue()` may start, fail mid-loop, and leave partially-processed state — compounding B1.

### B6. Anti-patterns catalog (symptom #11)

- **Fetch-then-fallback instead of cache-then-sync.** Every hook's `fetchAll` is `try { network } catch { read Dexie }` — Dexie is treated as a fallback, not as the primary read path. True offline-first reads local-first, always, and syncs in the background.
- **Server-generated IDs in an offline-write system.** Structurally incompatible with a reliable outbox (B1).
- **"Repository" that only wraps remote queries.** `src/repositories/*.ts` are thin Supabase query builders. They don't own caching, IDs, or the offline contract — so each hook reinvents that contract, three different ways (B3).
- **Per-hook private state masquerading as a data layer** (B2).
- **Unused architecture investment.** `@tanstack/react-query` installed, never wired up.
- **Client-side recomputation of a value the database already owns via trigger** (B4).
- **Coarse, global invalidation.** `useSyncStore.refreshTick` is one global counter that every mounted hook reacts to by refetching its *entire* table, regardless of whether that table was touched by the sync cycle that just ran.
- **Inconsistent reliability tiers presented as a uniform "offline-first" promise** to the end user (B3).

---

## C. Recommended Architecture

### Is MVVM the right answer? A direct verdict.

**Partial, and not the highest-leverage one.** React hooks (`useStockIntake`, `useSales`, etc.) already are ViewModels in everything but name: they hold presentation state and expose intents (`addIntake`, `addSale`) to dumb Views. Formalizing that with stricter MVVM ceremony (classes, DI containers, rigid interfaces) would improve *readability and testability of the View layer* — worth maybe 15–20% of the perceived problem — but it does not touch identity generation, queue idempotency, atomic multi-step transactions, or shared cache state, which is where every reported symptom actually originates. Spending the refactor budget on "strict MVVM" first would leave duplicate records, the debt-ledger gap, and the daily-closing offline gap completely unfixed.

### Recommended hybrid: Local-First Repository + Outbox, with MVVM-style hooks on top, and a thin Service Layer for compound transactions

```
View (React components)
   ↕ (presentation state + intents only)
ViewModel (hooks — keep this part, it's already correct)
   ↕ (calls one of:)
Service Layer (only for multi-step domain transactions: CollectDebtPayment, CloseDay, SettleSupplier)
   ↕
Repository (ONE per aggregate; owns Dexie + Outbox + Supabase as a single contract)
   ↕                                    ↕
Local DB (Dexie, source of truth     Outbox (durable, ordered,
for all reads, reactive)             idempotent mutation queue)
                                          ↕
                                      Supabase (durable cloud store, sync target — never read directly by a ViewModel)
```

### D. Comparison of candidate architectures

| Architecture | Reliability | Maintainability | Performance | Sync Consistency | DX | Complexity |
|---|---|---|---|---|---|---|
| **Current (ad hoc hooks)** | Low — duplicate inserts, silent ledger gaps, no offline coverage for 2 of 9 modules | Low/Med — 3 divergent patterns for "save a record" | Medium — redundant refetches across sibling components | Low — broken dedupe, ghost Dexie rows, non-atomic multi-step writes | Medium — easy to read one hook in isolation, unpredictable across hooks | Low to write, high (hidden) to maintain |
| **Strict MVVM** | No change — doesn't touch the data/sync layer | Medium/High — cleaner View/ViewModel boundary, more testable | Neutral | No change unless paired with a real Model layer | Medium — fights React's grain if done as classes/DI; hooks already do this idiomatically | Medium/High for the ceremony, low payoff alone |
| **Repository Pattern (done properly, not name-only)** | High — single place owning IDs, caching, offline contract per entity | High — fix once, fixed everywhere | Good — one cache layer, dedupe in-flight requests | High — uniform guarantees per entity | High — hooks become thin (`useLiveQuery(() => repo.list())`) | Medium — real but bounded refactor; highest leverage per unit effort |
| **Service Layer** | High, specifically for compound transactions (debt collection+ledger, settlement, closing) | High — business rules live in one named, testable place | Neutral/positive if pushed into Postgres RPCs (fewer round trips) | High for multi-step ops; necessary complement to Repository, not a substitute | High clarity on "where do business rules live" | Medium |
| **Full Event-Driven (message bus / event sourcing / CQRS)** | Can be excellent, but unjustified at this scale | Lower initially — adds indirection, harder to trace "what happens when I save a sale" | Fine either way at hundreds of tx/day | A *narrow* slice (reactive local-DB subscriptions) is exactly what's needed; the *broad* form is not | Lower — new team-wide mental model, steep ramp | High — not recommended wholesale for a single small team on one Postgres instance |
| **Offline Queue / Outbox** | Highest leverage available — idempotent, ordered, durable, retryable mutation log keyed by a client-owned id | Good once unified — currently the app already has 70% of this (`syncQueue`, `syncEngine`, `persistWrite`) and needs finishing, not inventing | Good — writes feel instant because they're always local-first | This *is* the mechanism that guarantees eventual consistency and kills duplicates, when done correctly | Requires discipline (no hook may call `supabase` directly for writes) but is simple to reason about once enforced | Medium — finish what exists, fix the ID bug, make it universal |

**Recommendation:** Repository (real) + Outbox (finished) as the backbone, Service Layer for the financial multi-step operations, light event-driven reactivity (Dexie's own live-query mechanism) for cache invalidation — not a message bus. Keep hooks-as-ViewModels; don't impose strict MVVM ceremony on top, it isn't where the leverage is. This combination is appropriately sized for "hundreds of transactions/day on one Supabase project" (symptom **#12**) — full event sourcing/CQRS would be over-engineering for this scale and team size.

---

## D. Folder Structure

```
src/
  app/                      # App shell, providers, router (today's App.tsx/main.tsx)
  views/                    # Pure presentation; no business logic, no supabase/Dexie imports
    stock-intake/
      StockIntakeForm.tsx
      StockIntakeList.tsx
  viewmodels/               # Today's hooks/, kept thin: presentation state + calls into domain/data layers
    useStockIntake.ts
  domain/
    services/               # Multi-step business transactions only (not CRUD passthroughs)
      debtCollectionService.ts   # collection insert + ledger entry as ONE unit
      dailyClosingService.ts
      supplierSettlementService.ts
    models/                 # Plain TS types (today's types/pokleh.ts)
  data/
    repositories/           # ONE per aggregate; the ONLY code allowed to touch Dexie + Outbox + Supabase together
      stockIntakeRepository.ts
      salesRepository.ts
      debtRepository.ts
    local/
      db.ts                # Dexie schema (today's lib/db.ts)
      outbox.ts            # Finished sync queue / engine (today's services/sync.ts)
      connectivity.ts       # Offline detector (today's services/offline.ts)
    remote/
      supabaseClient.ts
  stores/                  # Cross-cutting GLOBAL state only: auth, connectivity, sync status — never per-entity data
  lib/
  types/
```

**The structural rule that matters more than the folder names:** a ViewModel may never import `supabase` directly, and a View may never import a Repository or the Supabase client directly. Today, `useSettlements.calculateSettlement` calls `supabase.from(...)` inline, bypassing any repository — that's the kind of boundary violation this structure is meant to make impossible to write by accident.

---

## E. Data Flow

### Write path (User Action → Local DB → UI Update → Sync Queue → Supabase)

```
User Action (View)
   │ calls viewmodel.addSale(input)
   ▼
ViewModel (hook)
   │ delegates to Service (multi-step) or Repository (single-entity)
   ▼
Repository.create(entity)
   │ 1. id = crypto.randomUUID()   ← generated ONCE, used everywhere downstream
   │ 2. write full record to Dexie immediately   ← this IS the optimistic update, for free
   ▼
Local Database (Dexie) ──reactive query (useLiveQuery)──▶ every subscribed View updates instantly,
   │                                                        regardless of which component wrote it
   │ 3. enqueue Outbox job { entity, id, op: INSERT, payload incl. id, createdAt }
   ▼
Outbox Queue (durable, ordered per entity, idempotent by id)
   │ when online:
   ▼
Sync Engine ── upsert(payload, { onConflict: "id" }) ──▶ Supabase / Postgres
   │ success → stamp syncedAt on the Dexie row (same id, no row swap, no ghost)
   │ failure → exponential backoff, job stays in the outbox
   ▼
Dexie row updated (syncedAt set) ──reactive query──▶ UI shows a per-record "synced" indicator
```

### Pull path (data created by other users/devices)

```
Supabase (changed rows, watermarked by updated_at)
   ▼
Sync Engine pull ── upsert into Dexie, SKIP any id with a pending Outbox job ──▶ Local DB
   ▼ (reactive query)
UI
```

**This is what guarantees UI consistency (#9):** no View ever reads from a one-off `useState` populated by a fetch. Every View reads from Dexie through a reactive/live query. There is exactly one place data can be wrong, and it's the same place for every screen.

---

## F. Sync Strategy (guaranteeing eventual synchronization — #10)

- **Single durable queue** — already exists (`syncQueue` table); keep it, finish it.
- **Per-entity ordering, not just global FIFO.** The current loop does `for (const item of queue)` over the *entire* queue and `continue`s past any item still in backoff — which lets a later operation on the same row run ahead of an earlier one still waiting to retry. Group/replay strictly per `entityId`.
- **Idempotent replay** — `upsert(payload, { onConflict: "id" })` instead of `insert`, now safe because the id is client-owned (see G). Retries become no-ops instead of duplicates.
- **Conflict resolution** — timestamp-based (`updated_at`) last-write-wins is adequate for this domain (one staff member per truck at a time); anything genuinely concurrent should be flagged into `audit_logs` for review rather than silently dropped.
- **Tighter connectivity signal** — keep the heartbeat, but also treat any failed sync call itself as an immediate "go offline" signal rather than waiting up to 30s for the next heartbeat.
- **Incremental pulls** — replace wholesale `fetchAll()` + `bulkPut` with `updated_at`-watermarked pulls, and never let a pull overwrite a Dexie row that has a pending outbox job for the same id.
- **Resumability** — the outbox already survives app restarts (it's just a Dexie table) and is already flushed on boot (`useAppBootstrap`); keep that property, it's correct.

---

## G. Duplicate Prevention Strategy (#8)

1. **Generate the primary key client-side** (`crypto.randomUUID()`) at the moment of the user action, and include it in every INSERT payload sent to Supabase. This is the single highest-leverage fix in this entire review — it is the root cause behind B1.
2. **Replace `insert` with `upsert(..., { onConflict: "id" })`** in the sync engine for INSERT-type jobs. A replayed job becomes a no-op instead of a new row.
3. **Delete the current "check if exists by entityId" pre-flight query** in `sync.ts` — it's structurally inert today (B1) and becomes unnecessary once upserts are idempotent.
4. **Reconcile, don't replace.** Because the id is now stable end-to-end, a successful sync updates the *same* Dexie row (stamping `syncedAt`) instead of leaving a `tempId` orphan next to a new server-id row.
5. **Add DB-level idempotency keys as a last line of defense** where a natural business key exists (the schema already does this correctly for `daily_closings` via `uq_closing_area_date` — extend that thinking anywhere a row should be unique per business fact).
6. **Keep (and extend) the UI-level guard** of disabling the submit button while a mutation is in flight — already present in `StockIntakeForm.tsx`, missing in some others. This is a UX nicety, not the fix; #1–#5 are the fix.

---

## H. Migration Plan

This is a live system handling money — no big-bang rewrite. Phase by risk, fix the worst correctness bugs before touching structure.

**Phase 0 — stop the bleeding (days, no architecture change):**
- Generate ids client-side and include them in INSERT payloads; switch the sync engine to `upsert(onConflict:"id")`.
- Fix the `useDebtCollection` offline path so the ledger entry is created (or queued) even when the collection itself was queued offline.
- Add an offline path (or an explicit, honest "requires connection" UI state — not a silent failure) to `useSettlements.calculateSettlement` and `useDailyClosings`.
- Audit all submit buttons for a double-submit guard; the pattern in `StockIntakeForm.tsx` is correct, copy it everywhere it's missing.

**Phase 1 — foundational layer (1–2 weeks, additive):**
- Introduce `dexie-react-hooks`' `useLiveQuery` for one pilot module (stock intake is the best candidate — it already has the most code to delete). Replace its manual `useState` + fetch with a Repository + live query.
- Formalize the Repository layer: each entity gets `create` / `update` / an observable `list`, internally doing Dexie-write → outbox-enqueue, with online/offline branching hidden from the ViewModel entirely. This is where the three divergent "save a record" implementations collapse into one.

**Phase 2 — roll out (2–4 weeks):**
- Migrate the remaining modules onto the same pattern, financial/ledger modules first (sales, debt, settlement, closing — they have the worst bugs found).
- Introduce the Service Layer for the multi-step transactions (debt collection+ledger, settlement calculation, daily closing), replacing sequential client orchestration — ideally backed by Postgres RPCs for atomicity (the codebase already does this well for closing/reconciliation; extend that precedent).
- Make a decision on `@tanstack/react-query`: either remove it (genuinely unused today) or adopt it specifically for remote-only reads that aren't part of the offline-write path. Don't keep paying for it unused.

**Phase 3 — hardening (ongoing):**
- Per-record sync-status UI (pending/synced/error), now cheap because the repository is the single read path.
- Background Sync (service worker) for queue flush when the PWA is backgrounded — `vite-plugin-pwa`/workbox is already configured, this extends it rather than introducing something new.
- Integration tests around the Outbox specifically — it is the highest-risk, highest-value code in the app and currently has no visible test coverage.

Restructure folders incrementally alongside Phase 1–2, not as a standalone rename — a folder-only diff disconnected from the bug fixes adds churn without reducing risk.

---

## I. Risks and Tradeoffs

- **Changing ID generation from server-default to client-owned is the highest-risk single change**, not because it's conceptually hard, but because it touches every financial table's write path and needs verifying against RLS: `upsert` requires both INSERT and UPDATE policy grants, where today's flow may only have needed INSERT. Stage this on a Supabase branch and test deliberately — don't ship it casually.
- **`useLiveQuery`/reactive-Dexie is a different mental model** (push-based reactivity vs. fetch-on-mount). Expect a short-term velocity dip during Phase 1 while the team adjusts.
- **Moving multi-step transactions into Postgres RPCs** centralizes money-moving logic in SQL/plpgsql, which is less familiar to a TS-heavy team and harder to unit test than TypeScript. Worth it for atomicity on financial operations — but it is a real, ongoing DX cost, not a free win.
- **Strict layering (no direct `supabase` calls from hooks) adds short-term boilerplate** per feature. For a small team, this is a deliberate trade of velocity for correctness — appropriate given the stated goal is reliability for money-handling workflows, not feature throughput.
- **Do not adopt full event sourcing/CQRS or a message bus.** At "hundreds of transactions per day" on a single Supabase Postgres instance, that complexity has no payoff here and would actively hurt maintainability and onboarding.
- **Phase 0 fixes touch financial tables directly** (sales, debt_ledger, stock_intake, debt_collection). Ship behind manual QA on a Supabase branch before production — the blast radius of getting the ID/idempotency change wrong is "money and stock counts," which is the one place in this app where a mistake is expensive to unwind.

---

## Bottom line

MVVM is already ~80% present in this codebase via hooks-as-ViewModels, and finishing it would be a low-risk, low-payoff exercise relative to the reported problems. The actual fix is at the data layer: give every offline write a client-owned, idempotent identity; make Dexie the single reactive source of truth instead of N independent `useState`s; finish the outbox so every module — including settlement and daily closing — gets the same offline guarantee; and pull the multi-step financial transactions (debt collection + ledger, settlement, closing) out of ad hoc sequential client calls into one atomic unit each. That combination, not a presentation-pattern rename, is what makes this reliable for a real business running on flaky connectivity.
