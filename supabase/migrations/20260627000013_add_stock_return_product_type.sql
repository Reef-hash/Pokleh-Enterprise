-- stock_return never received the product_type column added to stock_intake,
-- stock_distribution, and sales in 20260620000008. get_truck_available_stock()
-- filters stock_return by product_type, so trg_validate_sale_balance fails with
-- "column product_type does not exist" on every sale insert until this is added.

ALTER TABLE public.stock_return
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'Air Batu Besar';

ALTER TABLE public.stock_return
  DROP CONSTRAINT IF EXISTS chk_return_product_type;

ALTER TABLE public.stock_return
  ADD CONSTRAINT chk_return_product_type
  CHECK (product_type IN ('Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur'));
