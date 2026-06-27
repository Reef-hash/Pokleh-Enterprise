-- Add product_type to stock_intake, stock_distribution, sale
-- Product types: Air Batu Besar, Air Batu Kecil, Air Batu Hancur

ALTER TABLE public.stock_intake
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'Air Batu Besar';

ALTER TABLE public.stock_distribution
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'Air Batu Besar';

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'Air Batu Besar';

ALTER TABLE public.stock_intake
  ADD CONSTRAINT IF NOT EXISTS chk_intake_product_type
  CHECK (product_type IN ('Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur'));

ALTER TABLE public.stock_distribution
  ADD CONSTRAINT IF NOT EXISTS chk_dist_product_type
  CHECK (product_type IN ('Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur'));

ALTER TABLE public.sales
  ADD CONSTRAINT IF NOT EXISTS chk_sale_product_type
  CHECK (product_type IN ('Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur'));
