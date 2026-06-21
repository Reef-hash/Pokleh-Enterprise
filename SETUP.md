# Pokleh Enterprise — Setup Guide

## 1. Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- npm or yarn

## 2. Clone and Install

```bash
git clone <repository-url>
cd pokleh-enterprise
npm install
```

## 3. Supabase Setup

### 3.1 Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a strong database password
3. Wait for the project to provision

### 3.2 Get Credentials

1. Go to **Project Settings > API**
2. Copy your **Project URL** and **Project API keys > publishable key** (or anon key)

### 3.3 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 3.4 Run Migrations

Go to **SQL Editor** in your Supabase dashboard and run the migration files in order:

1. `supabase/migrations/20260620000000_pokleh_enterprise_schema.sql`
2. `supabase/migrations/20260620000001_pokleh_rpc_functions.sql`
3. `supabase/migrations/20260620000002_pokleh_daily_closing.sql`
4. `supabase/migrations/20260620000003_pokleh_seed_data.sql`

Or use the Supabase CLI:

```bash
supabase migration up
```

## 4. Create First User

1. Start the app: `npm run dev`
2. Go to `http://localhost:5173/auth`
3. Sign up with a new account
4. In Supabase dashboard, go to **Table Editor > profiles**
5. Set the user's role to `admin`

## 5. Start Developing

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Check Supabase URL and key in `.env` |
| Database errors | Verify all 4 migrations were applied |
| Auth errors | Check that profiles table has a row for your user |
| Build errors | `rm -rf node_modules && npm install` |
