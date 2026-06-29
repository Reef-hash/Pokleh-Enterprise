-- Reset Database: Delete all data EXCEPT admin users and selling prices
-- This allows the client to start fresh while preserving:
-- 1. Admin login credentials (auth.users + profiles where role = 'admin')
-- 2. Selling price list (harga jual)

-- ============================================================
-- 1. DISABLE FINANCIAL DELETE PROTECTION TRIGGERS
-- ============================================================
-- These triggers prevent deletion of financial records (correction model)
-- We disable them temporarily for this reset operation

ALTER TABLE public.sales DISABLE TRIGGER USER;
ALTER TABLE public.debt_collection DISABLE TRIGGER USER;
ALTER TABLE public.expenses DISABLE TRIGGER USER;
ALTER TABLE public.stock_intake DISABLE TRIGGER USER;
ALTER TABLE public.stock_distribution DISABLE TRIGGER USER;
ALTER TABLE public.stock_return DISABLE TRIGGER USER;
ALTER TABLE public.supplier_settlements DISABLE TRIGGER USER;
ALTER TABLE public.debt_ledger DISABLE TRIGGER USER;

-- ============================================================
-- 2. DELETE OPERATIONAL DATA (in FK dependency order - child tables first)
-- ============================================================

-- Audit logs (no deps on other data tables)
DELETE FROM public.audit_logs;

-- Daily closings (refs trucks, profiles)
DELETE FROM public.daily_closings;

-- Expenses (refs profiles)
DELETE FROM public.expenses;

-- Supplier settlements (refs stock_intake, profiles)
DELETE FROM public.supplier_settlements;

-- Debt collection (refs customers, profiles)
DELETE FROM public.debt_collection;

-- Debt ledger (refs customers, profiles)
DELETE FROM public.debt_ledger;

-- Sales (refs customers, trucks, stock_distribution, profiles)
DELETE FROM public.sales;

-- Stock return (refs stock_distribution, stock_intake, trucks, profiles)
DELETE FROM public.stock_return;

-- Stock distribution (refs stock_intake, trucks, profiles)
DELETE FROM public.stock_distribution;

-- Stock intake (refs suppliers, trucks, profiles)
DELETE FROM public.stock_intake;

-- Supplier price history (refs suppliers)
DELETE FROM public.supplier_price_history;

-- Customers (refs trucks)
DELETE FROM public.customers;

-- Suppliers
DELETE FROM public.suppliers;

-- Staff truck assignments (refs profiles, trucks)
DELETE FROM public.staff_truck_assignments;

-- Trucks (formerly areas)
DELETE FROM public.trucks;

-- ============================================================
-- 3. RE-ENABLE FINANCIAL DELETE PROTECTION TRIGGERS
-- ============================================================
-- Restore the triggers after reset is complete

ALTER TABLE public.sales ENABLE TRIGGER USER;
ALTER TABLE public.debt_collection ENABLE TRIGGER USER;
ALTER TABLE public.expenses ENABLE TRIGGER USER;
ALTER TABLE public.stock_intake ENABLE TRIGGER USER;
ALTER TABLE public.stock_distribution ENABLE TRIGGER USER;
ALTER TABLE public.stock_return ENABLE TRIGGER USER;
ALTER TABLE public.supplier_settlements ENABLE TRIGGER USER;
ALTER TABLE public.debt_ledger ENABLE TRIGGER USER;

-- ============================================================
-- 2. DELETE NON-ADMIN USERS
-- ============================================================

-- Delete non-admin profiles first (optional, cascade will handle it)
DELETE FROM public.profiles WHERE role != 'admin';

-- Delete non-admin auth.users
-- This will CASCADE DELETE their profiles due to ON DELETE CASCADE
DELETE FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE role = 'admin');

-- ============================================================
-- 3. PRESERVED DATA
-- ============================================================
-- The following tables are NOT touched:
-- - public.selling_price_list (harga jual kekal)
-- - public.profiles (admin sahaja)
-- - auth.users (admin sahaja)
