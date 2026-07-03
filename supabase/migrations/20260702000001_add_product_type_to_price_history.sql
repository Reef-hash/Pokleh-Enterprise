-- Add product_type to supplier_price_history so each supplier can have a
-- different cost per product (e.g. Supplier A charges RM 1.50 for Air Batu
-- Besar, RM 1.20 for Air Batu Kecil; Supplier B charges different rates).
-- This enables auto-fill of cost_per_pax in the Stock Intake form: the
-- driver only enters quantity, the system looks up the cost from the
-- supplier's price list for that product.

ALTER TABLE public.supplier_price_history
  ADD COLUMN IF NOT EXISTS product_type TEXT;

-- Backfill existing rows with a default product type so they remain valid.
UPDATE public.supplier_price_history
  SET product_type = 'Air Batu Besar'
  WHERE product_type IS NULL;

ALTER TABLE public.supplier_price_history
  ALTER COLUMN product_type SET NOT NULL;

-- Replace the supplier-only index with a composite index that supports
-- looking up the latest price for a given supplier + product.
DROP INDEX IF EXISTS public.idx_price_history_supplier;
CREATE INDEX IF NOT EXISTS idx_price_history_supplier_product
  ON public.supplier_price_history(supplier_id, product_type, effective_date DESC);

-- Ensure only one price record per supplier + product + effective_date.
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_history_supplier_product_date
  ON public.supplier_price_history(supplier_id, product_type, effective_date);
