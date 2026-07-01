-- Fix: stock_wastage was NOT deducted from truck available stock.
-- get_truck_available_stock() previously computed:
--   intake + transfer_in - transfer_out - sold - returned
-- Wastage (sating) was only used for supplier settlement calculations,
-- never for the live truck balance shown in TruckStockView. This caused
-- the displayed stock to be overstated whenever wastage was recorded,
-- risking over-selling beyond the physically available stock.
--
-- This migration:
--   1. Recreates get_truck_available_stock() to subtract SUM(quantity_wasted)
--   2. Adds a BEFORE INSERT validation trigger on stock_wastage to prevent
--      recording wastage that exceeds available stock (mirrors
--      trg_validate_sale_balance on public.sales).

-- ============================================================
-- 1. UPDATE get_truck_available_stock() to subtract wastage
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_truck_available_stock(
  p_truck_id UUID,
  p_product_type TEXT,
  p_as_of_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_intake INTEGER;
  v_transfer_in INTEGER;
  v_transfer_out INTEGER;
  v_sold INTEGER;
  v_returned INTEGER;
  v_wasted INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity_received), 0) INTO v_intake
    FROM public.stock_intake
    WHERE truck_id = p_truck_id AND product_type = p_product_type AND intake_date <= p_as_of_date;

  SELECT COALESCE(SUM(quantity_assigned), 0) INTO v_transfer_in
    FROM public.stock_distribution
    WHERE to_truck_id = p_truck_id AND product_type = p_product_type AND created_at::date <= p_as_of_date;

  SELECT COALESCE(SUM(quantity_assigned), 0) INTO v_transfer_out
    FROM public.stock_distribution
    WHERE from_truck_id = p_truck_id AND product_type = p_product_type AND created_at::date <= p_as_of_date;

  SELECT COALESCE(SUM(quantity), 0) INTO v_sold
    FROM public.sales
    WHERE truck_id = p_truck_id AND product_type = p_product_type AND sale_date <= p_as_of_date;

  SELECT COALESCE(SUM(quantity_returned), 0) INTO v_returned
    FROM public.stock_return
    WHERE truck_id = p_truck_id AND product_type = p_product_type AND return_date <= p_as_of_date;

  SELECT COALESCE(SUM(quantity_wasted), 0) INTO v_wasted
    FROM public.stock_wastage
    WHERE truck_id = p_truck_id AND product_type = p_product_type AND waste_date <= p_as_of_date;

  RETURN v_intake + v_transfer_in - v_transfer_out - v_sold - v_returned - v_wasted;
END;
$$;

COMMENT ON FUNCTION public.get_truck_available_stock(UUID, TEXT, DATE) IS
  'Available stock = intake + transfer_in - transfer_out - sold - returned - wasted. Wastage deduction added 2026-07-02.';

-- ============================================================
-- 2. VALIDATION TRIGGER: prevent wastage exceeding available stock
--    (mirrors trg_validate_sale_balance on public.sales)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_wastage_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_available INTEGER;
BEGIN
  v_available := public.get_truck_available_stock(NEW.truck_id, NEW.product_type, NEW.waste_date);
  IF NEW.quantity_wasted > v_available THEN
    RAISE EXCEPTION 'Insufficient stock on truck for this wastage: requested %, available %', NEW.quantity_wasted, v_available;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_wastage_balance ON public.stock_wastage;
CREATE TRIGGER trg_validate_wastage_balance BEFORE INSERT ON public.stock_wastage
  FOR EACH ROW EXECUTE FUNCTION public.validate_wastage_balance();
