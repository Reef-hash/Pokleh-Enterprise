-- Stock Wastage & Negotiated Adjustments for Supplier Settlements
-- Tracks daily wastage (sating) per truck/product, and negotiated reductions

-- ============================================================
-- 1. STOCK WASTAGE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_wastage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID NOT NULL REFERENCES public.trucks(id),
  product_type TEXT NOT NULL CHECK (product_type IN ('Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur')),
  quantity_wasted INTEGER NOT NULL CHECK (quantity_wasted > 0),
  waste_date DATE NOT NULL,
  intake_id UUID REFERENCES public.stock_intake(id),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_wastage_truck ON public.stock_wastage(truck_id);
CREATE INDEX IF NOT EXISTS idx_stock_wastage_date ON public.stock_wastage(waste_date);
CREATE INDEX IF NOT EXISTS idx_stock_wastage_intake ON public.stock_wastage(intake_id);
CREATE INDEX IF NOT EXISTS idx_stock_wastage_product ON public.stock_wastage(product_type);

ALTER TABLE public.stock_wastage ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. WASTAGE ADJUSTMENT TABLE (for negotiated reductions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wastage_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES public.stock_intake(id),
  truck_id UUID NOT NULL REFERENCES public.trucks(id),
  product_type TEXT NOT NULL CHECK (product_type IN ('Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur')),
  total_wasted INTEGER NOT NULL,
  reduction_quantity INTEGER NOT NULL CHECK (reduction_quantity >= 0),
  reason TEXT,
  adjustment_date DATE NOT NULL,
  approved_by UUID REFERENCES public.profiles(user_id),
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wastage_adjustments_intake ON public.wastage_adjustments(intake_id);
CREATE INDEX IF NOT EXISTS idx_wastage_adjustments_truck ON public.wastage_adjustments(truck_id);

ALTER TABLE public.wastage_adjustments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. UPDATE SUPPLIER_SETTLEMENTS schema
-- ============================================================
ALTER TABLE public.supplier_settlements ADD COLUMN IF NOT EXISTS total_wastage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.supplier_settlements ADD COLUMN IF NOT EXISTS wastage_reduction INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- stock_wastage
CREATE POLICY "Admins can manage wastage" ON public.stock_wastage FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Authenticated users can view wastage" ON public.stock_wastage FOR SELECT
  TO authenticated USING (true);

-- wastage_adjustments
CREATE POLICY "Admins can manage adjustments" ON public.wastage_adjustments FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Authenticated users can view adjustments" ON public.wastage_adjustments FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- 5. AUDIT TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_stock_wastage ON public.stock_wastage;
CREATE TRIGGER trg_audit_stock_wastage AFTER INSERT OR UPDATE OR DELETE ON public.stock_wastage
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

DROP TRIGGER IF EXISTS trg_audit_wastage_adjustments ON public.wastage_adjustments;
CREATE TRIGGER trg_audit_wastage_adjustments AFTER INSERT OR UPDATE OR DELETE ON public.wastage_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- ============================================================
-- 6. UPDATE SETTLEMENT CALCULATION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_settlement_with_wastage(p_intake_id UUID)
RETURNS TABLE(
  total_received INTEGER,
  total_sold INTEGER,
  total_returned INTEGER,
  total_wastage INTEGER,
  wastage_reduction INTEGER,
  payable_quantity INTEGER,
  cost_per_pax DECIMAL,
  payable_amount DECIMAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_received INTEGER;
  v_total_sold INTEGER;
  v_total_returned INTEGER;
  v_total_wastage INTEGER;
  v_wastage_reduction INTEGER;
  v_payable_quantity INTEGER;
  v_cost_per_pax DECIMAL;
BEGIN
  -- Get intake details
  SELECT si.quantity_received, si.cost_per_pax
  INTO v_total_received, v_cost_per_pax
  FROM public.stock_intake si
  WHERE si.id = p_intake_id;

  -- Calculate total sold (received - returned)
  v_total_sold := COALESCE(v_total_received, 0) - public.get_total_returned_for_intake(p_intake_id);

  -- Get total returned
  v_total_returned := public.get_total_returned_for_intake(p_intake_id);

  -- Calculate total wastage for this intake
  SELECT COALESCE(SUM(quantity_wasted), 0)
  INTO v_total_wastage
  FROM public.stock_wastage
  WHERE intake_id = p_intake_id;

  -- Calculate wastage reduction (from adjustments)
  SELECT COALESCE(SUM(reduction_quantity), 0)
  INTO v_wastage_reduction
  FROM public.wastage_adjustments
  WHERE intake_id = p_intake_id;

  -- Payable = Sold + (Wastage - Reduction)
  v_payable_quantity := v_total_sold + (v_total_wastage - v_wastage_reduction);

  RETURN QUERY SELECT
    v_total_received,
    v_total_sold,
    v_total_returned,
    v_total_wastage,
    v_wastage_reduction,
    v_payable_quantity,
    v_cost_per_pax,
    (v_payable_quantity::DECIMAL * v_cost_per_pax)::DECIMAL;
END;
$$;

-- ============================================================
-- 7. REALTIME PUBLICATION
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_wastage;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wastage_adjustments;
