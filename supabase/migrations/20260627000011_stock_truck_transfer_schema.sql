-- Truck-to-truck stock transfer support + multi-product intake
-- Lori C takes a large batch and redistributes part of it to Lori D/E (who have
-- no direct supplier access); stock_distribution becomes a general truck-to-truck
-- transfer instead of a one-hop warehouse->area allocation.

-- ============================================================
-- 1. STOCK_INTAKE: which truck physically collected this from the supplier
-- ============================================================
ALTER TABLE public.stock_intake ADD COLUMN IF NOT EXISTS truck_id UUID REFERENCES public.trucks(id);
ALTER TABLE public.stock_intake ALTER COLUMN truck_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_intake_truck ON public.stock_intake(truck_id);

-- ============================================================
-- 2. STOCK_DISTRIBUTION: general truck-to-truck transfer
-- ============================================================
ALTER TABLE public.stock_distribution RENAME COLUMN truck_id TO to_truck_id;
ALTER TABLE public.stock_distribution RENAME CONSTRAINT stock_distribution_truck_id_fkey TO stock_distribution_to_truck_id_fkey;
ALTER TABLE public.stock_distribution ADD COLUMN IF NOT EXISTS from_truck_id UUID REFERENCES public.trucks(id);
ALTER TABLE public.stock_distribution ALTER COLUMN from_truck_id SET NOT NULL;
ALTER TABLE public.stock_distribution ALTER COLUMN intake_id DROP NOT NULL;

ALTER INDEX IF EXISTS idx_stock_distribution_truck RENAME TO idx_stock_distribution_to_truck;
CREATE INDEX IF NOT EXISTS idx_stock_distribution_from_truck ON public.stock_distribution(from_truck_id);

DROP POLICY IF EXISTS "Staff can view their truck distributions" ON public.stock_distribution;
DROP POLICY IF EXISTS "Staff can insert distributions to their truck" ON public.stock_distribution;
CREATE POLICY "Staff can view their truck distributions" ON public.stock_distribution FOR SELECT
  USING (from_truck_id IN (SELECT public.get_my_truck_ids()) OR to_truck_id IN (SELECT public.get_my_truck_ids()) OR public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can insert distributions from their truck" ON public.stock_distribution FOR INSERT
  WITH CHECK (from_truck_id IN (SELECT public.get_my_truck_ids()) OR public.get_current_user_role() = 'admin');

-- ============================================================
-- 3. STOCK_RETURN: decoupled from a single distribution hop, taggable to an intake batch
-- ============================================================
ALTER TABLE public.stock_return ALTER COLUMN distribution_id DROP NOT NULL;
ALTER TABLE public.stock_return ADD COLUMN IF NOT EXISTS intake_id UUID REFERENCES public.stock_intake(id);
CREATE INDEX IF NOT EXISTS idx_stock_return_intake ON public.stock_return(intake_id);

-- ============================================================
-- 4. DAILY_CLOSINGS: per truck + date + product_type, with carry-forward balance
-- ============================================================
ALTER TABLE public.daily_closings ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'Air Batu Besar';
ALTER TABLE public.daily_closings ADD CONSTRAINT chk_closing_product_type
  CHECK (product_type IN ('Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur'));

ALTER TABLE public.daily_closings ADD COLUMN IF NOT EXISTS total_transfer_in INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.daily_closings ADD COLUMN IF NOT EXISTS total_transfer_out INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.daily_closings ADD COLUMN IF NOT EXISTS closing_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.daily_closings RENAME COLUMN total_assigned TO total_intake;

ALTER TABLE public.daily_closings DROP CONSTRAINT IF EXISTS uq_closing_truck_date;
ALTER TABLE public.daily_closings ADD CONSTRAINT uq_closing_truck_date_product UNIQUE (closing_date, truck_id, product_type);

-- ============================================================
-- 5. STOCK BALANCE VALIDATION TRIGGERS
-- (bodies call public.get_truck_available_stock(), defined in the next migration;
--  PL/pgSQL resolves function calls at execution time, not at CREATE FUNCTION time,
--  so this ordering is safe as long as both migrations apply before real inserts)
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_distribution_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_available INTEGER;
BEGIN
  v_available := public.get_truck_available_stock(NEW.from_truck_id, NEW.product_type, CURRENT_DATE);
  IF NEW.quantity_assigned > v_available THEN
    RAISE EXCEPTION 'Insufficient stock on truck for this transfer: requested %, available %', NEW.quantity_assigned, v_available;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_distribution_balance ON public.stock_distribution;
CREATE TRIGGER trg_validate_distribution_balance BEFORE INSERT ON public.stock_distribution
  FOR EACH ROW EXECUTE FUNCTION public.validate_distribution_balance();

CREATE OR REPLACE FUNCTION public.validate_sale_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_available INTEGER;
BEGIN
  v_available := public.get_truck_available_stock(NEW.truck_id, NEW.product_type, NEW.sale_date);
  IF NEW.quantity > v_available THEN
    RAISE EXCEPTION 'Insufficient stock on truck for this sale: requested %, available %', NEW.quantity, v_available;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_sale_balance ON public.sales;
CREATE TRIGGER trg_validate_sale_balance BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.validate_sale_balance();
