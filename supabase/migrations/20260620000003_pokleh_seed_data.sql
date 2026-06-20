-- Pokleh Enterprise Demo Seed Data
-- Run after schema migration and a user has been created

DO $$
DECLARE
  v_area_a_id UUID;
  v_area_b_id UUID;
  v_area_c_id UUID;
  v_area_d_id UUID;
  v_supplier_id UUID;
  v_admin_id UUID;
BEGIN
  -- Get existing area IDs
  SELECT id INTO v_area_a_id FROM public.areas WHERE name = 'Area A';
  SELECT id INTO v_area_b_id FROM public.areas WHERE name = 'Area B';
  SELECT id INTO v_area_c_id FROM public.areas WHERE name = 'Area C';
  SELECT id INTO v_area_d_id FROM public.areas WHERE name = 'Area D';

  -- Get default supplier
  SELECT id INTO v_supplier_id FROM public.suppliers WHERE name = 'Primary Ice Supplier';

  -- Get first admin user (if any)
  SELECT user_id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;

  -- Customers per area
  INSERT INTO public.customers (name, phone, address, area_id, debt_balance) VALUES
    ('Ahmad bin Razak', '012-3456789', 'No 12, Jalan Merpati', v_area_a_id, 0),
    ('Siti Nurhaliza', '013-4567890', 'No 5, Jalan Kenangan', v_area_a_id, 0),
    ('Ravi Chandran', '014-5678901', 'No 8, Jalan Bahagia', v_area_a_id, 0),
    ('Mei Ling Wong', '016-6789012', 'No 22, Jalan Indah', v_area_b_id, 0),
    ('Tan Sri Osman', '017-7890123', 'No 3, Jalan Sentosa', v_area_b_id, 0),
    ('Kamarul Ariffin', '019-8901234', 'No 15, Jalan Damai', v_area_c_id, 0),
    ('Fatimah Abu Bakar', '011-9012345', 'No 7, Jalan Ria', v_area_c_id, 0),
    ('Rajesh Kumar', '018-0123456', 'No 10, Jalan Murni', v_area_d_id, 0),
    ('Aishah Mohammed', '015-1234567', 'No 1, Jalan Sejahtera', v_area_d_id, 0)
  ON CONFLICT DO NOTHING;

  -- Supplier price history
  INSERT INTO public.supplier_price_history (supplier_id, cost_per_pax, effective_date) VALUES
    (v_supplier_id, 1.50, CURRENT_DATE - INTERVAL '30 days'),
    (v_supplier_id, 1.60, CURRENT_DATE - INTERVAL '15 days'),
    (v_supplier_id, 1.55, CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  -- Only proceed if we have an admin user
  IF v_admin_id IS NOT NULL THEN
    -- Stock intake
    INSERT INTO public.stock_intake (intake_date, supplier_id, quantity_received, cost_per_pax, notes, created_by)
    VALUES (CURRENT_DATE, v_supplier_id, 500, 1.55, 'Weekly supply', v_admin_id);

    -- Expenses
    INSERT INTO public.expenses (category, amount, expense_date, notes, created_by) VALUES
      ('Transportation', 45.00, CURRENT_DATE, 'Delivery fuel', v_admin_id),
      ('Packaging', 30.00, CURRENT_DATE, 'Ice bags', v_admin_id);
  END IF;
END $$;
