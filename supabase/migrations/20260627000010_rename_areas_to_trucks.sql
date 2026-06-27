-- Refactor: "Area" -> "Truck" (Lori)
-- Areas can no longer express truck-to-truck dependency (Lori C feeds Lori D/E
-- directly, D's leftover sweeps to E overnight). Trucks become the operating unit.
-- This migration renames the core entities only; stock_intake/stock_distribution/
-- stock_return/daily_closings structural changes (new columns, transfer support)
-- follow in a later migration.

-- ============================================================
-- 1. RENAME CORE TABLES
-- ============================================================
ALTER TABLE public.areas RENAME TO trucks;
ALTER TABLE public.staff_area_assignments RENAME TO staff_truck_assignments;
ALTER TABLE public.staff_truck_assignments RENAME COLUMN area_id TO truck_id;
-- Renaming a column does not rename its FK constraint, so the inline
-- `area_id ... REFERENCES` columns left behind constraints still named
-- after "area_id"; rename those explicitly so embedded PostgREST selects
-- and generated types can refer to a "_truck_id_fkey" name that matches
-- the current column.
ALTER TABLE public.staff_truck_assignments RENAME CONSTRAINT staff_area_assignments_area_id_fkey TO staff_truck_assignments_truck_id_fkey;

-- ============================================================
-- 2. RENAME area_id -> truck_id ON DEPENDENT TABLES
-- ============================================================
ALTER TABLE public.customers RENAME COLUMN area_id TO truck_id;
ALTER TABLE public.customers RENAME CONSTRAINT customers_area_id_fkey TO customers_truck_id_fkey;
ALTER TABLE public.stock_distribution RENAME COLUMN area_id TO truck_id;
ALTER TABLE public.stock_distribution RENAME CONSTRAINT stock_distribution_area_id_fkey TO stock_distribution_truck_id_fkey;
ALTER TABLE public.sales RENAME COLUMN area_id TO truck_id;
ALTER TABLE public.sales RENAME CONSTRAINT sales_area_id_fkey TO sales_truck_id_fkey;
ALTER TABLE public.stock_return RENAME COLUMN area_id TO truck_id;
ALTER TABLE public.stock_return RENAME CONSTRAINT stock_return_area_id_fkey TO stock_return_truck_id_fkey;
ALTER TABLE public.daily_closings RENAME COLUMN area_id TO truck_id;
ALTER TABLE public.daily_closings RENAME CONSTRAINT daily_closings_area_id_fkey TO daily_closings_truck_id_fkey;

-- ============================================================
-- 3. RENAME INDEXES / CONSTRAINTS
-- ============================================================
DROP INDEX IF EXISTS uq_active_assignment;
CREATE UNIQUE INDEX uq_active_truck_assignment ON public.staff_truck_assignments(staff_id, truck_id) WHERE ended_date IS NULL;

ALTER INDEX IF EXISTS idx_staff_area_staff RENAME TO idx_staff_truck_staff;
ALTER INDEX IF EXISTS idx_staff_area_area RENAME TO idx_staff_truck_truck;
ALTER INDEX IF EXISTS idx_customers_area RENAME TO idx_customers_truck;
ALTER INDEX IF EXISTS idx_stock_distribution_area RENAME TO idx_stock_distribution_truck;
ALTER INDEX IF EXISTS idx_sales_area RENAME TO idx_sales_truck;

ALTER TABLE public.daily_closings RENAME CONSTRAINT uq_closing_area_date TO uq_closing_truck_date;

-- ============================================================
-- 4. HELPER FUNCTION: get_my_area_ids() -> get_my_truck_ids()
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_truck_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ BEGIN RETURN QUERY SELECT truck_id FROM public.staff_truck_assignments WHERE staff_id = auth.uid() AND ended_date IS NULL; END; $$;

-- ============================================================
-- 5. RLS POLICIES referencing area_id / get_my_area_ids() -- drop & recreate
-- ============================================================

-- trucks (was areas)
DROP POLICY IF EXISTS "Admins can manage areas" ON public.trucks;
DROP POLICY IF EXISTS "Staff can view their areas" ON public.trucks;
DROP POLICY IF EXISTS "Admins can view all areas" ON public.trucks;
CREATE POLICY "Admins can manage trucks" ON public.trucks FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view their trucks" ON public.trucks FOR SELECT
  USING (public.get_current_user_role() = 'staff' AND id IN (SELECT public.get_my_truck_ids()));
CREATE POLICY "Admins can view all trucks" ON public.trucks FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- staff_truck_assignments (was staff_area_assignments) -- no area_id/function ref, just relabel
DROP POLICY IF EXISTS "Admins can manage staff assignments" ON public.staff_truck_assignments;
DROP POLICY IF EXISTS "Staff can view own assignments" ON public.staff_truck_assignments;
CREATE POLICY "Admins can manage staff assignments" ON public.staff_truck_assignments FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view own assignments" ON public.staff_truck_assignments FOR SELECT
  USING (staff_id = auth.uid() OR public.get_current_user_role() = 'admin');

-- customers
DROP POLICY IF EXISTS "Staff can manage customers in their area" ON public.customers;
CREATE POLICY "Staff can manage customers in their truck" ON public.customers FOR ALL
  USING (truck_id IN (SELECT public.get_my_truck_ids()))
  WITH CHECK (truck_id IN (SELECT public.get_my_truck_ids()));

-- stock_distribution
DROP POLICY IF EXISTS "Staff can view their area distributions" ON public.stock_distribution;
DROP POLICY IF EXISTS "Staff can insert distributions to their area" ON public.stock_distribution;
CREATE POLICY "Staff can view their truck distributions" ON public.stock_distribution FOR SELECT
  USING (truck_id IN (SELECT public.get_my_truck_ids()) OR public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can insert distributions to their truck" ON public.stock_distribution FOR INSERT
  WITH CHECK (truck_id IN (SELECT public.get_my_truck_ids()) OR public.get_current_user_role() = 'admin');

-- sales
DROP POLICY IF EXISTS "Staff can manage sales in their area" ON public.sales;
DROP POLICY IF EXISTS "Staff can view sales in their area" ON public.sales;
CREATE POLICY "Staff can manage sales in their truck" ON public.sales FOR ALL
  USING (truck_id IN (SELECT public.get_my_truck_ids()))
  WITH CHECK (truck_id IN (SELECT public.get_my_truck_ids()));
CREATE POLICY "Staff can view sales in their truck" ON public.sales FOR SELECT
  USING (truck_id IN (SELECT public.get_my_truck_ids()) OR public.get_current_user_role() = 'admin');

-- debt_ledger (scoped via customers.truck_id)
DROP POLICY IF EXISTS "Staff can view their area debt ledger" ON public.debt_ledger;
CREATE POLICY "Staff can view their truck debt ledger" ON public.debt_ledger FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE truck_id IN (SELECT public.get_my_truck_ids())));

-- debt_collection (scoped via customers.truck_id)
DROP POLICY IF EXISTS "Staff can manage collections in their area" ON public.debt_collection;
CREATE POLICY "Staff can manage collections in their truck" ON public.debt_collection FOR ALL
  USING (customer_id IN (SELECT id FROM public.customers WHERE truck_id IN (SELECT public.get_my_truck_ids())))
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE truck_id IN (SELECT public.get_my_truck_ids())));

-- stock_return
DROP POLICY IF EXISTS "Staff can manage returns in their area" ON public.stock_return;
CREATE POLICY "Staff can manage returns in their truck" ON public.stock_return FOR ALL
  USING (truck_id IN (SELECT public.get_my_truck_ids()))
  WITH CHECK (truck_id IN (SELECT public.get_my_truck_ids()));

-- daily_closings
DROP POLICY IF EXISTS "Staff can view their area closings" ON public.daily_closings;
CREATE POLICY "Staff can view their truck closings" ON public.daily_closings FOR SELECT
  USING (truck_id IN (SELECT public.get_my_truck_ids()) OR public.get_current_user_role() = 'admin');

-- ============================================================
-- 6. DROP OLD FUNCTION (now unreferenced)
-- ============================================================
DROP FUNCTION IF EXISTS public.get_my_area_ids();
