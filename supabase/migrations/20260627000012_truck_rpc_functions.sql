-- RPC functions for truck-based stock balance, settlement, and daily closing.
-- Settlement no longer traces which truck sold which pax through the
-- distribution chain (multi-hop C->D->E transfers make exact lot-tracing
-- impractical for a fast-moving retail flow): payable = total_received -
-- total_returned, and total_sold becomes a derived value.

-- ============================================================
-- 1. TRUCK AVAILABLE STOCK (intake + transfer_in - transfer_out - sold - returned)
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

  RETURN v_intake + v_transfer_in - v_transfer_out - v_sold - v_returned;
END;
$$;

-- ============================================================
-- 2. SUPPLIER SETTLEMENT: simplified, direct-column based
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_total_returned_for_intake(p_intake_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(quantity_returned), 0) FROM public.stock_return WHERE intake_id = p_intake_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_total_sold_for_intake(p_intake_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_received INTEGER;
BEGIN
  SELECT quantity_received INTO v_received FROM public.stock_intake WHERE id = p_intake_id;
  RETURN COALESCE(v_received, 0) - public.get_total_returned_for_intake(p_intake_id);
END;
$$;

-- ============================================================
-- 3. DAILY CLOSING: per truck + date + product_type, carry-forward balance
-- ============================================================
DROP FUNCTION IF EXISTS public.perform_daily_closing(DATE, UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.perform_daily_closing(
  p_closing_date DATE,
  p_truck_id UUID,
  p_product_type TEXT,
  p_user_id UUID,
  p_action TEXT DEFAULT 'close'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_intake INTEGER;
  v_total_transfer_in INTEGER;
  v_total_transfer_out INTEGER;
  v_total_sold INTEGER;
  v_total_returned INTEGER;
  v_closing_balance INTEGER;
  v_cash_sales DECIMAL(10,2);
  v_debt_sales DECIMAL(10,2);
  v_debt_collections DECIMAL(10,2);
  v_expenses_total DECIMAL(10,2);
  v_supplier_payable DECIMAL(10,2);
  v_profit_estimate DECIMAL(10,2);
  v_existing_id UUID;
  v_existing_status TEXT;
  v_result JSONB;
BEGIN
  -- Compute aggregates
  SELECT COALESCE(SUM(si.quantity_received), 0) INTO v_total_intake
  FROM public.stock_intake si
  WHERE si.truck_id = p_truck_id AND si.product_type = p_product_type AND si.intake_date = p_closing_date;

  SELECT COALESCE(SUM(sd.quantity_assigned), 0) INTO v_total_transfer_in
  FROM public.stock_distribution sd
  WHERE sd.to_truck_id = p_truck_id AND sd.product_type = p_product_type AND sd.created_at::date = p_closing_date;

  SELECT COALESCE(SUM(sd.quantity_assigned), 0) INTO v_total_transfer_out
  FROM public.stock_distribution sd
  WHERE sd.from_truck_id = p_truck_id AND sd.product_type = p_product_type AND sd.created_at::date = p_closing_date;

  SELECT COALESCE(SUM(s.quantity), 0) INTO v_total_sold
  FROM public.sales s
  WHERE s.truck_id = p_truck_id AND s.product_type = p_product_type AND s.sale_date = p_closing_date;

  SELECT COALESCE(SUM(sr.quantity_returned), 0) INTO v_total_returned
  FROM public.stock_return sr
  WHERE sr.truck_id = p_truck_id AND sr.product_type = p_product_type AND sr.return_date = p_closing_date;

  v_closing_balance := v_total_intake + v_total_transfer_in - v_total_sold - v_total_transfer_out - v_total_returned;

  SELECT
    COALESCE(SUM(s.selling_price) FILTER (WHERE s.payment_type = 'cash'), 0),
    COALESCE(SUM(s.selling_price) FILTER (WHERE s.payment_type = 'debt'), 0)
  INTO v_cash_sales, v_debt_sales
  FROM public.sales s
  WHERE s.truck_id = p_truck_id AND s.product_type = p_product_type AND s.sale_date = p_closing_date;

  -- debt_collections/expenses_total/supplier_payable are not product_type-scoped
  -- (debt is per-customer, expenses/payable are company-wide) -- same scope as
  -- the pre-truck-refactor implementation, carried over unchanged.
  SELECT COALESCE(SUM(dc.amount), 0) INTO v_debt_collections
  FROM public.debt_collection dc
  JOIN public.customers c ON c.id = dc.customer_id
  WHERE c.truck_id = p_truck_id AND dc.collection_date = p_closing_date;

  SELECT COALESCE(SUM(e.amount), 0) INTO v_expenses_total
  FROM public.expenses e
  WHERE e.expense_date = p_closing_date;

  SELECT COALESCE(SUM(ss.payable_amount), 0) INTO v_supplier_payable
  FROM public.supplier_settlements ss
  WHERE ss.status = 'pending';

  v_profit_estimate := v_cash_sales + v_debt_sales + v_debt_collections - v_expenses_total - v_supplier_payable;

  -- Get existing record
  SELECT id, status INTO v_existing_id, v_existing_status
  FROM public.daily_closings
  WHERE closing_date = p_closing_date AND truck_id = p_truck_id AND product_type = p_product_type;

  IF p_action = 'close' THEN
    -- Validate: carry-forward stock balance must not go negative (Lori E may
    -- legitimately carry unsold stock overnight, so no hard equality here)
    IF v_closing_balance < 0 THEN
      RAISE EXCEPTION 'Validation failed: closing balance is negative (intake %, transfer_in %, sold %, transfer_out %, returned %)',
        v_total_intake, v_total_transfer_in, v_total_sold, v_total_transfer_out, v_total_returned;
    END IF;

    IF v_existing_id IS NULL THEN
      INSERT INTO public.daily_closings (
        closing_date, truck_id, product_type, status,
        total_intake, total_sold, total_returned, total_transfer_in, total_transfer_out, closing_balance,
        cash_sales, debt_sales, debt_collections,
        expenses_total, supplier_payable, profit_estimate,
        closed_by, closed_at
      ) VALUES (
        p_closing_date, p_truck_id, p_product_type, 'closed',
        v_total_intake, v_total_sold, v_total_returned, v_total_transfer_in, v_total_transfer_out, v_closing_balance,
        v_cash_sales, v_debt_sales, v_debt_collections,
        v_expenses_total, v_supplier_payable, v_profit_estimate,
        p_user_id, now()
      ) RETURNING row_to_json(daily_closings.*)::jsonb INTO v_result;
    ELSE
      IF v_existing_status = 'closed' OR v_existing_status = 'reconciled' THEN
        RAISE EXCEPTION 'Day is already % for this truck/product', v_existing_status;
      END IF;
      UPDATE public.daily_closings SET
        status = 'closed',
        total_intake = v_total_intake,
        total_sold = v_total_sold,
        total_returned = v_total_returned,
        total_transfer_in = v_total_transfer_in,
        total_transfer_out = v_total_transfer_out,
        closing_balance = v_closing_balance,
        cash_sales = v_cash_sales,
        debt_sales = v_debt_sales,
        debt_collections = v_debt_collections,
        expenses_total = v_expenses_total,
        supplier_payable = v_supplier_payable,
        profit_estimate = v_profit_estimate,
        closed_by = p_user_id,
        closed_at = now()
      WHERE id = v_existing_id
      RETURNING row_to_json(daily_closings.*)::jsonb INTO v_result;
    END IF;
  ELSIF p_action = 'reconcile' THEN
    IF v_existing_id IS NULL THEN
      RAISE EXCEPTION 'Cannot reconcile: day is not closed yet';
    END IF;
    IF v_existing_status != 'closed' THEN
      RAISE EXCEPTION 'Cannot reconcile: current status is %', v_existing_status;
    END IF;
    UPDATE public.daily_closings SET
      status = 'reconciled',
      reconciled_by = p_user_id,
      reconciled_at = now()
    WHERE id = v_existing_id
    RETURNING row_to_json(daily_closings.*)::jsonb INTO v_result;
  ELSE
    RAISE EXCEPTION 'Unknown action: %', p_action;
  END IF;

  RETURN v_result;
END;
$$;
