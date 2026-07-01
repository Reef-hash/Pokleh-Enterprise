-- Sync Debt Sales to Debt Ledger
-- Bug fix: sales with payment_type = 'debt' never created a debt_ledger entry,
-- so customers.debt_balance (a cached value recalculated from debt_ledger) was
-- never updated when a debt sale was recorded. This trigger closes that gap.
--
-- Behaviour:
--   * Normal debt sale  -> INSERT ledger entry (entry_type='sale', +amount)
--   * Correction         -> reverse the superseded sale's debt (entry_type='payment'),
--                           then add the new sale's debt if it is also 'debt'
--   * Reversal           -> reverse the superseded sale's debt only
--   * Cash sale          -> no ledger entry (unchanged)
--
-- The existing trg_debt_ledger_balance trigger fires on each debt_ledger INSERT
-- and calls recalculate_customer_balance(), so customers.debt_balance stays in
-- sync automatically. SECURITY DEFINER bypasses RLS so the ledger insert works
-- regardless of the calling user's role (e.g. staff recording a sale).

-- ============================================================
-- 1. TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_sale_to_debt_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance_before  DECIMAL(10,2);
  v_original_price  DECIMAL(10,2);
  v_original_pay    TEXT;
  v_has_orig_ledger BOOLEAN;
BEGIN
  -- ----------------------------------------------------------
  -- Corrections / reversals: undo the superseded sale's debt
  -- ----------------------------------------------------------
  IF NEW.correction_of IS NOT NULL THEN
    SELECT selling_price, payment_type
      INTO v_original_price, v_original_pay
      FROM public.sales
      WHERE id = NEW.correction_of;

    -- Only reverse if the superseded sale was a debt sale AND it has a
    -- matching 'sale' ledger entry (guards against historical gaps).
    IF v_original_pay = 'debt' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.debt_ledger
         WHERE reference_id   = NEW.correction_of
           AND reference_type = 'sale'
           AND entry_type     = 'sale'
      ) INTO v_has_orig_ledger;

      IF v_has_orig_ledger THEN
        SELECT debt_balance INTO v_balance_before
          FROM public.customers WHERE id = NEW.customer_id;

        INSERT INTO public.debt_ledger (
          customer_id, entry_type, amount,
          reference_type, reference_id,
          balance_before, balance_after, created_by
        ) VALUES (
          NEW.customer_id, 'payment', v_original_price,
          'sale_correction', NEW.correction_of,
          COALESCE(v_balance_before, 0),
          COALESCE(v_balance_before, 0) - v_original_price,
          NEW.staff_id
        );
      END IF;
    END IF;

    -- A 'correction' supersedes the original with a new transaction, so the
    -- new sale's debt takes effect. A 'reversal' only voids the original.
    IF NEW.correction_status = 'correction' AND NEW.payment_type = 'debt' THEN
      SELECT debt_balance INTO v_balance_before
        FROM public.customers WHERE id = NEW.customer_id;

      INSERT INTO public.debt_ledger (
        customer_id, entry_type, amount,
        reference_type, reference_id,
        balance_before, balance_after, created_by
      ) VALUES (
        NEW.customer_id, 'sale', NEW.selling_price,
        'sale', NEW.id,
        COALESCE(v_balance_before, 0),
        COALESCE(v_balance_before, 0) + NEW.selling_price,
        NEW.staff_id
      );
    END IF;

    RETURN NEW;
  END IF;

  -- ----------------------------------------------------------
  -- Normal sale (not a correction)
  -- ----------------------------------------------------------
  IF NEW.payment_type = 'debt' THEN
    SELECT debt_balance INTO v_balance_before
      FROM public.customers WHERE id = NEW.customer_id;

    INSERT INTO public.debt_ledger (
      customer_id, entry_type, amount,
      reference_type, reference_id,
      balance_before, balance_after, created_by
    ) VALUES (
      NEW.customer_id, 'sale', NEW.selling_price,
      'sale', NEW.id,
      COALESCE(v_balance_before, 0),
      COALESCE(v_balance_before, 0) + NEW.selling_price,
      NEW.staff_id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 2. ATTACH TRIGGER (AFTER INSERT so NEW columns are populated)
-- ============================================================
DROP TRIGGER IF EXISTS trg_sales_debt_ledger ON public.sales;
CREATE TRIGGER trg_sales_debt_ledger
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_sale_to_debt_ledger();

-- ============================================================
-- 3. HELPER: backfill ledger entries for any pre-existing debt sales
--    that lack one (idempotent — safe to re-run). The database was
--    reset on 2026-06-29 so this is usually a no-op, but it protects
--    against partial-data environments. balance_before/after are
--    computed as a running total per customer; the authoritative
--    debt_balance is recalculated by recalculate_customer_balance()
--    in step 4 regardless.
-- ============================================================
INSERT INTO public.debt_ledger (
  customer_id, entry_type, amount,
  reference_type, reference_id,
  balance_before, balance_after,
  created_by, created_at
)
SELECT
  s.customer_id,
  'sale',
  s.selling_price,
  'sale',
  s.id,
  COALESCE(
    SUM(s.selling_price) OVER (
      PARTITION BY s.customer_id
      ORDER BY s.created_at
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ), 0
  ),
  COALESCE(
    SUM(s.selling_price) OVER (
      PARTITION BY s.customer_id
      ORDER BY s.created_at
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ), 0
  ),
  s.staff_id,
  s.created_at
FROM public.sales s
WHERE s.payment_type = 'debt'
  AND s.correction_of IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.debt_ledger dl
     WHERE dl.reference_id   = s.id
       AND dl.reference_type = 'sale'
  );

-- ============================================================
-- 4. RECALCULATE EVERY CUSTOMER'S CACHED BALANCE
--    Ensures debt_balance matches the ledger after backfill.
-- ============================================================
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN SELECT id FROM public.customers LOOP
    PERFORM public.recalculate_customer_balance(c.id);
  END LOOP;
END;
$$;

-- ============================================================
-- 5. GRANT + REALTIME
-- ============================================================
-- The function runs as SECURITY DEFINER (owner), so no extra grants
-- are needed for callers. debt_ledger is already in the realtime
-- publication from the base schema; no change required.
