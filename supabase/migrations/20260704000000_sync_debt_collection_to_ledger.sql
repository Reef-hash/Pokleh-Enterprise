-- Sync Debt Collection to Debt Ledger
-- Bug fix: recording a debt payment inserted a debt_collection row from the
-- client, then made a *separate* client-side call to insert the matching
-- debt_ledger entry. If that second call was skipped (e.g. the payment was
-- recorded while offline — the offline sync queue only replays the
-- debt_collection insert, never the follow-up ledger insert) or failed, the
-- debt_collection stayed recorded but customers.debt_balance (cached from
-- debt_ledger) was never reduced, so "hutang" appeared unpaid.
--
-- This moves the ledger write into a trigger, mirroring
-- sync_sale_to_debt_ledger, so it always fires together with the actual
-- debt_collection insert — however that insert happens (direct client call,
-- or the offline sync queue replaying it later).

-- ============================================================
-- 1. TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_debt_collection_to_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance_before DECIMAL(10,2);
BEGIN
  IF NEW.correction_of IS NULL THEN
    SELECT debt_balance INTO v_balance_before
      FROM public.customers WHERE id = NEW.customer_id;

    INSERT INTO public.debt_ledger (
      customer_id, entry_type, amount,
      reference_type, reference_id,
      balance_before, balance_after, created_by
    ) VALUES (
      NEW.customer_id, 'payment', NEW.amount,
      'debt_collection', NEW.id,
      COALESCE(v_balance_before, 0),
      COALESCE(v_balance_before, 0) - NEW.amount,
      NEW.staff_id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- AFTER INSERT so NEW columns are populated
DROP TRIGGER IF EXISTS trg_debt_collection_ledger ON public.debt_collection;
CREATE TRIGGER trg_debt_collection_ledger
  AFTER INSERT ON public.debt_collection
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_debt_collection_to_ledger();

-- ============================================================
-- 2. BACKFILL: any pre-existing debt_collection rows that lack a matching
--    ledger entry (idempotent — safe to re-run). balance_before/after are
--    placeholders; recalculate_customer_balance() in step 3 fixes the
--    authoritative cached balance regardless.
-- ============================================================
INSERT INTO public.debt_ledger (
  customer_id, entry_type, amount,
  reference_type, reference_id,
  balance_before, balance_after,
  created_by, created_at
)
SELECT
  dc.customer_id,
  'payment',
  dc.amount,
  'debt_collection',
  dc.id,
  0,
  -dc.amount,
  dc.staff_id,
  dc.created_at
FROM public.debt_collection dc
WHERE dc.correction_of IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.debt_ledger dl
     WHERE dl.reference_id = dc.id
       AND dl.reference_type = 'debt_collection'
  );

-- ============================================================
-- 3. RECALCULATE EVERY CUSTOMER'S CACHED BALANCE
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
