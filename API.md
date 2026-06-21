# Pokleh Enterprise — API Reference

This project uses Supabase as its backend. The API follows Supabase's auto-generated REST patterns with custom PostgreSQL functions for business logic.

## Authentication

```typescript
import { supabase } from "@/integrations/supabase/client";

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password"
});

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password"
});

// Sign out
await supabase.auth.signOut();
```

## Database Tables

All tables live in the `public` schema with RLS enabled.

### Core Tables

| Table | Key Fields |
|-------|-----------|
| `profiles` | `user_id`, `email`, `name`, `role` (admin/staff) |
| `areas` | `name` (unique) |
| `customers` | `name`, `phone`, `area_id`, `debt_balance` (cached) |
| `suppliers` | `name`, `phone` |
| `staff_area_assignments` | `staff_id`, `area_id`, `assigned_date`, `ended_date` |

### Stock Tables

| Table | Key Fields |
|-------|-----------|
| `stock_intake` | `supplier_id`, `quantity_received`, `cost_per_pax` |
| `stock_distribution` | `intake_id`, `area_id`, `quantity_assigned` |
| `stock_return` | `distribution_id`, `area_id`, `quantity_returned` |

### Financial Tables (Append-Only)

| Table | Key Fields |
|-------|-----------|
| `sales` | `customer_id`, `quantity`, `selling_price`, `payment_type` (cash/debt) |
| `debt_ledger` | `customer_id`, `entry_type` (sale/payment/adjustment), `amount`, `balance_before`, `balance_after` |
| `debt_collection` | `customer_id`, `amount`, `staff_id` |
| `expenses` | `category`, `amount`, `expense_date` |
| `supplier_settlements` | `intake_id`, `payable_quantity`, `cost_per_pax`, `payable_amount`, `status` |

### Operational Tables

| Table | Key Fields |
|-------|-----------|
| `daily_closings` | `closing_date`, `area_id`, `status` (open/closed/reconciled), computed aggregates |
| `audit_logs` | `user_id`, `action`, `entity`, `entity_id`, `old_values`, `new_values` |

### Supplier Price History

| Table | Key Fields |
|-------|-----------|
| `supplier_price_history` | `supplier_id`, `cost_per_pax`, `effective_date` |

## Custom RPC Functions

```typescript
// Close or reconcile a day
const { data, error } = await supabase.rpc("perform_daily_closing", {
  p_closing_date: "2026-06-21",
  p_area_id: "uuid",
  p_user_id: "uuid",
  p_action: "close" // or "reconcile"
});

// Get total sold quantity for a stock intake
const { data } = await supabase.rpc("get_total_sold_for_intake", {
  p_intake_id: "uuid"
});

// Get total returned quantity for a stock intake
const { data } = await supabase.rpc("get_total_returned_for_intake", {
  p_intake_id: "uuid"
});

// Recalculate a customer's debt balance from ledger
const { data } = await supabase.rpc("recalculate_customer_balance", {
  p_customer_id: "uuid"
});
```

## Real-time Subscriptions

Tables enabled for real-time: `areas`, `customers`, `sales`, `debt_ledger`, `debt_collection`, `stock_intake`, `stock_distribution`, `stock_return`, `expenses`, `daily_closings`.

## Row Level Security

All tables have RLS with two-tier access:

- **Admin role** — Full read/write access to all tables
- **Staff role** — Area-scoped read/write via `get_my_area_ids()` helper
