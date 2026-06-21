# Pokleh Enterprise — Ice Distribution Management System

Ice distribution management platform built with React, TypeScript, and Supabase. Tracks stock intake-to-distribution, sales and debt management, supplier settlements, and daily closing.

## Features

- **Stock Management** — Record stock intake from suppliers, distribute to delivery areas, track returns
- **Sales & Debt** — Record sales (cash/debt), maintain append-only debt ledger, track collections
- **Daily Closing** — End-of-day reconciliation with validation, profit calculation, and day locking
- **Supplier Management** — Price history tracking, cost-per-pax records, payable settlement
- **Area-Based Operations** — Assign staff to coverage areas with role-based access
- **Reports** — Sales, expense, collection, and profit reports with charts
- **Audit Trail** — All financial operations logged with user, action, and metadata
- **Offline-First** — IndexedDB cache with sync queue for offline resilience

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| UI | shadcn/ui, Recharts, Lucide icons |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth with RLS policies |
| Offline | Dexie.js (IndexedDB) with sync engine |
| Build | Vite, PWA with service worker |

## Prerequisites

- Node.js 18+
- Supabase account (free tier)
- npm or yarn

## Quick Start

```bash
git clone <repository-url>
cd pokleh-enterprise
npm install
cp .env.example .env
# Fill in your Supabase credentials in .env
npm run dev
```

The application will be available at `http://localhost:5173`.

## Database Schema

The system uses 16 tables in the `public` schema:

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts linked to Supabase Auth |
| `areas` | Delivery coverage areas |
| `staff_area_assignments` | Staff-to-area relationships |
| `customers` | Ice customers with debt tracking |
| `suppliers` | Ice suppliers |
| `supplier_price_history` | Historical cost per pax |
| `stock_intake` | Incoming stock from suppliers |
| `stock_distribution` | Stock assigned to delivery areas |
| `stock_return` | Unsold stock returned from areas |
| `supplier_settlements` | Supplier payable reconciliation |
| `sales` | Customer ice sales (cash/debt) |
| `debt_ledger` | Append-only debt movements |
| `debt_collection` | Debt payment collections |
| `expenses` | Operational expenses |
| `daily_closings` | End-of-day reconciliation |
| `audit_logs` | Change tracking for financial tables |

All tables have Row Level Security (RLS) enabled with role-based policies.

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run type-check` — Run TypeScript type checking
- `npm run lint` — Run ESLint

## Deployment

Configure environment variables in your deployment platform:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Deploy the `dist/` folder to any static hosting (Vercel, Netlify, Cloudflare Pages).

## License

MIT
