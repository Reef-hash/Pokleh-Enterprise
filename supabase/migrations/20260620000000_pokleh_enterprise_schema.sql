-- Pokleh Enterprise Distribution Management System
-- Schema Migration: All 16 tables + RLS + Triggers + Seed Data
-- Architecture Freeze v1

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. PROFILES (linked to auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. AREAS
-- ============================================================
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. STAFF AREA ASSIGNMENTS
-- ============================================================
CREATE TABLE public.staff_area_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ended_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_active_assignment UNIQUE (staff_id, area_id),
  CONSTRAINT chk_dates CHECK (ended_date IS NULL OR ended_date >= assigned_date)
);

CREATE INDEX idx_staff_area_staff ON public.staff_area_assignments(staff_id) WHERE ended_date IS NULL;
CREATE INDEX idx_staff_area_area ON public.staff_area_assignments(area_id) WHERE ended_date IS NULL;

ALTER TABLE public.staff_area_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. CUSTOMERS
-- ============================================================
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  area_id UUID NOT NULL REFERENCES public.areas(id),
  debt_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_area ON public.customers(area_id);
CREATE INDEX idx_customers_active ON public.customers(active);
CREATE INDEX idx_customers_name ON public.customers(name);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. SUPPLIERS
-- ============================================================
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. SUPPLIER PRICE HISTORY
-- ============================================================
CREATE TABLE public.supplier_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  cost_per_pax DECIMAL(10,2) NOT NULL CHECK (cost_per_pax >= 0),
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_supplier ON public.supplier_price_history(supplier_id);

ALTER TABLE public.supplier_price_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. STOCK INTAKE
-- ============================================================
CREATE TABLE public.stock_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_date DATE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
  cost_per_pax DECIMAL(10,2) NOT NULL CHECK (cost_per_pax >= 0),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_intake_date ON public.stock_intake(intake_date);
CREATE INDEX idx_stock_intake_supplier ON public.stock_intake(supplier_id);

ALTER TABLE public.stock_intake ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. STOCK DISTRIBUTION
-- ============================================================
CREATE TABLE public.stock_distribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES public.stock_intake(id),
  area_id UUID NOT NULL REFERENCES public.areas(id),
  quantity_assigned INTEGER NOT NULL CHECK (quantity_assigned > 0),
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_distribution_intake ON public.stock_distribution(intake_id);
CREATE INDEX idx_stock_distribution_area ON public.stock_distribution(area_id);

ALTER TABLE public.stock_distribution ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. SALES
-- ============================================================
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  area_id UUID NOT NULL REFERENCES public.areas(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'debt')),
  distribution_id UUID REFERENCES public.stock_distribution(id),
  staff_id UUID NOT NULL REFERENCES public.profiles(user_id),
  sale_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_sales_customer ON public.sales(customer_id);
CREATE INDEX idx_sales_area ON public.sales(area_id);
CREATE INDEX idx_sales_staff ON public.sales(staff_id);
CREATE INDEX idx_sales_distribution ON public.sales(distribution_id);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. DEBT LEDGER
-- ============================================================
CREATE TABLE public.debt_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('sale', 'payment', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_debt_ledger_customer ON public.debt_ledger(customer_id);
CREATE INDEX idx_debt_ledger_created ON public.debt_ledger(created_at);

ALTER TABLE public.debt_ledger ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. DEBT COLLECTION
-- ============================================================
CREATE TABLE public.debt_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  collection_date DATE NOT NULL,
  staff_id UUID NOT NULL REFERENCES public.profiles(user_id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_debt_collection_customer ON public.debt_collection(customer_id);
CREATE INDEX idx_debt_collection_date ON public.debt_collection(collection_date);

ALTER TABLE public.debt_collection ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. STOCK RETURN
-- ============================================================
CREATE TABLE public.stock_return (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  distribution_id UUID NOT NULL REFERENCES public.stock_distribution(id),
  area_id UUID NOT NULL REFERENCES public.areas(id),
  quantity_returned INTEGER NOT NULL CHECK (quantity_returned >= 0),
  return_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_return_distribution ON public.stock_return(distribution_id);
CREATE INDEX idx_stock_return_date ON public.stock_return(return_date);

ALTER TABLE public.stock_return ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. SUPPLIER SETTLEMENTS
-- ============================================================
CREATE TABLE public.supplier_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES public.stock_intake(id),
  total_received INTEGER NOT NULL DEFAULT 0,
  total_sold INTEGER NOT NULL DEFAULT 0,
  total_returned INTEGER NOT NULL DEFAULT 0,
  payable_quantity INTEGER NOT NULL DEFAULT 0,
  cost_per_pax DECIMAL(10,2) NOT NULL DEFAULT 0,
  payable_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  settlement_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
  settled_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_settlements_intake ON public.supplier_settlements(intake_id);
CREATE INDEX idx_supplier_settlements_status ON public.supplier_settlements(status);

ALTER TABLE public.supplier_settlements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. EXPENSES
-- ============================================================
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 15. DAILY CLOSINGS
-- ============================================================
CREATE TABLE public.daily_closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  closing_date DATE NOT NULL,
  area_id UUID NOT NULL REFERENCES public.areas(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled')),
  total_assigned INTEGER NOT NULL DEFAULT 0,
  total_sold INTEGER NOT NULL DEFAULT 0,
  total_returned INTEGER NOT NULL DEFAULT 0,
  cash_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  debt_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  debt_collections DECIMAL(10,2) NOT NULL DEFAULT 0,
  expenses_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit_estimate DECIMAL(10,2) NOT NULL DEFAULT 0,
  closed_by UUID REFERENCES public.profiles(user_id),
  closed_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES public.profiles(user_id),
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_closing_area_date UNIQUE (closing_date, area_id)
);

CREATE INDEX idx_daily_closings_date ON public.daily_closings(closing_date);
CREATE INDEX idx_daily_closings_status ON public.daily_closings(status);

ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 16. AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 17. AUDIT LOG TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_values, new_values)
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ============================================================
-- 18. DEBT BALANCE CACHE FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalculate_customer_balance(p_customer_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(
    CASE WHEN entry_type IN ('sale', 'adjustment') THEN amount
         WHEN entry_type = 'payment' THEN -amount
         ELSE 0 END
  ), 0) INTO v_balance
  FROM public.debt_ledger
  WHERE customer_id = p_customer_id;

  UPDATE public.customers SET debt_balance = v_balance, updated_at = now()
  WHERE id = p_customer_id;

  RETURN v_balance;
END;
$function$;

-- ============================================================
-- 19. AUDIT TRIGGERS (on financial tables)
-- ============================================================
CREATE TRIGGER trg_audit_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER trg_audit_sales AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER trg_audit_debt_ledger AFTER INSERT OR UPDATE OR DELETE ON public.debt_ledger
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER trg_audit_debt_collection AFTER INSERT OR UPDATE OR DELETE ON public.debt_collection
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER trg_audit_stock_intake AFTER INSERT OR UPDATE OR DELETE ON public.stock_intake
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER trg_audit_stock_distribution AFTER INSERT OR UPDATE OR DELETE ON public.stock_distribution
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER trg_audit_stock_return AFTER INSERT OR UPDATE OR DELETE ON public.stock_return
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER trg_audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER trg_audit_supplier_settlements AFTER INSERT OR UPDATE OR DELETE ON public.supplier_settlements
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- ============================================================
-- 20. UPDATED_AT TRIGGER HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_supplier_settlements_updated_at BEFORE UPDATE ON public.supplier_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 21. AUTO-PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 22. RLS POLICIES
-- ============================================================

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ BEGIN RETURN (SELECT role FROM public.profiles WHERE user_id = auth.uid()); END; $$;

-- Helper: get areas assigned to current staff user
CREATE OR REPLACE FUNCTION public.get_my_area_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT area_id FROM public.staff_area_assignments WHERE staff_id = auth.uid() AND ended_date IS NULL; $$;

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- areas
CREATE POLICY "Admins can manage areas" ON public.areas FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view their areas" ON public.areas FOR SELECT
  USING (public.get_current_user_role() = 'staff' AND id IN (SELECT public.get_my_area_ids()));
CREATE POLICY "Admins can view all areas" ON public.areas FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- staff_area_assignments
CREATE POLICY "Admins can manage staff assignments" ON public.staff_area_assignments FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view own assignments" ON public.staff_area_assignments FOR SELECT
  USING (staff_id = auth.uid() OR public.get_current_user_role() = 'admin');

-- customers
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can manage customers in their area" ON public.customers FOR ALL
  USING (area_id IN (SELECT public.get_my_area_ids()))
  WITH CHECK (area_id IN (SELECT public.get_my_area_ids()));
CREATE POLICY "Admins can view all customers" ON public.customers FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- suppliers
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- supplier_price_history
CREATE POLICY "Authenticated users can view price history" ON public.supplier_price_history FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admins can manage price history" ON public.supplier_price_history FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- stock_intake
CREATE POLICY "Admins can manage stock intake" ON public.stock_intake FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view stock intake" ON public.stock_intake FOR SELECT
  TO authenticated USING (true);

-- stock_distribution
CREATE POLICY "Admins can manage distributions" ON public.stock_distribution FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view their area distributions" ON public.stock_distribution FOR SELECT
  USING (area_id IN (SELECT public.get_my_area_ids()) OR public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can insert distributions to their area" ON public.stock_distribution FOR INSERT
  WITH CHECK (area_id IN (SELECT public.get_my_area_ids()) OR public.get_current_user_role() = 'admin');

-- sales
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can manage sales in their area" ON public.sales FOR ALL
  USING (area_id IN (SELECT public.get_my_area_ids()))
  WITH CHECK (area_id IN (SELECT public.get_my_area_ids()));
CREATE POLICY "Staff can view sales in their area" ON public.sales FOR SELECT
  USING (area_id IN (SELECT public.get_my_area_ids()) OR public.get_current_user_role() = 'admin');

-- debt_ledger
CREATE POLICY "Admins can view all debt ledger" ON public.debt_ledger FOR SELECT
  USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view their area debt ledger" ON public.debt_ledger FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE area_id IN (SELECT public.get_my_area_ids())));
CREATE POLICY "Authenticated users can insert debt ledger" ON public.debt_ledger FOR INSERT
  TO authenticated WITH CHECK (true);

-- debt_collection
CREATE POLICY "Admins can manage debt collections" ON public.debt_collection FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can manage collections in their area" ON public.debt_collection FOR ALL
  USING (customer_id IN (SELECT id FROM public.customers WHERE area_id IN (SELECT public.get_my_area_ids())))
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE area_id IN (SELECT public.get_my_area_ids())));

-- stock_return
CREATE POLICY "Admins can manage stock returns" ON public.stock_return FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can manage returns in their area" ON public.stock_return FOR ALL
  USING (area_id IN (SELECT public.get_my_area_ids()))
  WITH CHECK (area_id IN (SELECT public.get_my_area_ids()));

-- supplier_settlements
CREATE POLICY "Admins can manage settlements" ON public.supplier_settlements FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Authenticated users can view settlements" ON public.supplier_settlements FOR SELECT
  TO authenticated USING (true);

-- expenses
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view expenses" ON public.expenses FOR SELECT
  TO authenticated USING (true);

-- daily_closings
CREATE POLICY "Admins can manage daily closings" ON public.daily_closings FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Staff can view their area closings" ON public.daily_closings FOR SELECT
  USING (area_id IN (SELECT public.get_my_area_ids()) OR public.get_current_user_role() = 'admin');

-- audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- ============================================================
-- 22. SEED DATA
-- ============================================================

-- Default areas
INSERT INTO public.areas (name) VALUES
  ('Area A'),
  ('Area B'),
  ('Area C'),
  ('Area D')
ON CONFLICT (name) DO NOTHING;

-- Default supplier
INSERT INTO public.suppliers (name) VALUES
  ('Primary Ice Supplier')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 23. REALTIME PUBLICATION
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.areas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_collection;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_intake;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_distribution;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_return;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_closings;
