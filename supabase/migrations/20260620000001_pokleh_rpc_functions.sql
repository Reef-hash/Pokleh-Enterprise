-- Pokleh Enterprise RPC Functions
-- For settlement calculation

CREATE OR REPLACE FUNCTION public.get_total_sold_for_intake(p_intake_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(s.quantity), 0)
  FROM public.sales s
  JOIN public.stock_distribution sd ON sd.id = s.distribution_id
  WHERE sd.intake_id = p_intake_id;
$$;

CREATE OR REPLACE FUNCTION public.get_total_returned_for_intake(p_intake_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(sr.quantity_returned), 0)
  FROM public.stock_return sr
  JOIN public.stock_distribution sd ON sd.id = sr.distribution_id
  WHERE sd.intake_id = p_intake_id;
$$;
