-- Pokleh Enterprise Daily Closing RPC

CREATE OR REPLACE FUNCTION public.perform_daily_closing(
  p_closing_date DATE,
  p_area_id UUID,
  p_user_id UUID,
  p_action TEXT DEFAULT 'close'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_assigned INTEGER;
  v_total_sold INTEGER;
  v_total_returned INTEGER;
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
  SELECT COALESCE(SUM(sd.quantity_assigned), 0) INTO v_total_assigned
  FROM public.stock_distribution sd
  WHERE sd.area_id = p_area_id AND sd.created_at::date = p_closing_date;

  SELECT COALESCE(SUM(s.quantity), 0) INTO v_total_sold
  FROM public.sales s
  WHERE s.area_id = p_area_id AND s.sale_date = p_closing_date;

  SELECT COALESCE(SUM(sr.quantity_returned), 0) INTO v_total_returned
  FROM public.stock_return sr
  WHERE sr.area_id = p_area_id AND sr.return_date = p_closing_date;

  SELECT
    COALESCE(SUM(s.selling_price) FILTER (WHERE s.payment_type = 'cash'), 0),
    COALESCE(SUM(s.selling_price) FILTER (WHERE s.payment_type = 'debt'), 0)
  INTO v_cash_sales, v_debt_sales
  FROM public.sales s
  WHERE s.area_id = p_area_id AND s.sale_date = p_closing_date;

  SELECT COALESCE(SUM(dc.amount), 0) INTO v_debt_collections
  FROM public.debt_collection dc
  JOIN public.customers c ON c.id = dc.customer_id
  WHERE c.area_id = p_area_id AND dc.collection_date = p_closing_date;

  SELECT COALESCE(SUM(e.amount), 0) INTO v_expenses_total
  FROM public.expenses e
  WHERE e.expense_date = p_closing_date;

  SELECT COALESCE(SUM(ss.payable_amount), 0) INTO v_supplier_payable
  FROM public.supplier_settlements ss
  JOIN public.stock_intake si ON si.id = ss.intake_id
  WHERE ss.status = 'pending';

  v_profit_estimate := v_cash_sales + v_debt_sales + v_debt_collections - v_expenses_total - v_supplier_payable;

  -- Get existing record
  SELECT id, status INTO v_existing_id, v_existing_status
  FROM public.daily_closings
  WHERE closing_date = p_closing_date AND area_id = p_area_id;

  IF p_action = 'close' THEN
    -- Validate
    IF v_total_assigned != v_total_sold + v_total_returned THEN
      RAISE EXCEPTION 'Validation failed: assigned (%) != sold (%) + returned (%)',
        v_total_assigned, v_total_sold, v_total_returned;
    END IF;

    IF v_existing_id IS NULL THEN
      INSERT INTO public.daily_closings (
        closing_date, area_id, status,
        total_assigned, total_sold, total_returned,
        cash_sales, debt_sales, debt_collections,
        expenses_total, supplier_payable, profit_estimate,
        closed_by, closed_at
      ) VALUES (
        p_closing_date, p_area_id, 'closed',
        v_total_assigned, v_total_sold, v_total_returned,
        v_cash_sales, v_debt_sales, v_debt_collections,
        v_expenses_total, v_supplier_payable, v_profit_estimate,
        p_user_id, now()
      ) RETURNING row_to_json(daily_closings.*)::jsonb INTO v_result;
    ELSE
      IF v_existing_status = 'closed' OR v_existing_status = 'reconciled' THEN
        RAISE EXCEPTION 'Day is already % for this area', v_existing_status;
      END IF;
      UPDATE public.daily_closings SET
        status = 'closed',
        total_assigned = v_total_assigned,
        total_sold = v_total_sold,
        total_returned = v_total_returned,
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
