-- Selling price list: default prices per product + customer-specific overrides
CREATE TABLE IF NOT EXISTS public.selling_price_list (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type TEXT        NOT NULL CHECK (product_type IN ('Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur')),
  customer_id  UUID        REFERENCES public.customers(id) ON DELETE CASCADE,
  price_per_pax NUMERIC(10,2) NOT NULL CHECK (price_per_pax >= 0),
  notes        TEXT,
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one default price per product (WHERE customer_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_selling_price_default
  ON public.selling_price_list (product_type)
  WHERE customer_id IS NULL;

-- Unique: one override per customer per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_selling_price_customer
  ON public.selling_price_list (customer_id, product_type)
  WHERE customer_id IS NOT NULL;

ALTER TABLE public.selling_price_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read selling prices"
  ON public.selling_price_list FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage selling prices"
  ON public.selling_price_list FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Seed default prices
INSERT INTO public.selling_price_list (product_type, price_per_pax) VALUES
  ('Air Batu Besar',  0.00),
  ('Air Batu Kecil',  0.00),
  ('Air Batu Hancur', 0.00)
ON CONFLICT DO NOTHING;
