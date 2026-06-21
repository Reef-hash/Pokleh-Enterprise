-- Pokleh Enterprise Correction Model
-- Architecture Freeze v1 — Accounting-style append-only corrections
-- 
-- Rules:
--   1. Financial records are NEVER physically deleted
--   2. Financial records are NEVER updated in-place
--   3. Corrections create NEW records linked via correction_of
--   4. Original transaction + correction chain = full audit trail

-- ============================================================
-- 1. ADD CORRECTION COLUMNS TO FINANCIAL TABLES
-- ============================================================

-- correction_of: FK to same table — points to the original record being corrected
-- correction_status: 'correction' (supersedes original) or 'reversal' (voids original)

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS correction_of UUID REFERENCES public.sales(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS correction_status TEXT CHECK (correction_status IN ('correction', 'reversal'));

ALTER TABLE public.debt_collection ADD COLUMN IF NOT EXISTS correction_of UUID REFERENCES public.debt_collection(id);
ALTER TABLE public.debt_collection ADD COLUMN IF NOT EXISTS correction_status TEXT CHECK (correction_status IN ('correction', 'reversal'));

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS correction_of UUID REFERENCES public.expenses(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS correction_status TEXT CHECK (correction_status IN ('correction', 'reversal'));

ALTER TABLE public.stock_intake ADD COLUMN IF NOT EXISTS correction_of UUID REFERENCES public.stock_intake(id);
ALTER TABLE public.stock_intake ADD COLUMN IF NOT EXISTS correction_status TEXT CHECK (correction_status IN ('correction', 'reversal'));

ALTER TABLE public.stock_distribution ADD COLUMN IF NOT EXISTS correction_of UUID REFERENCES public.stock_distribution(id);
ALTER TABLE public.stock_distribution ADD COLUMN IF NOT EXISTS correction_status TEXT CHECK (correction_status IN ('correction', 'reversal'));

ALTER TABLE public.stock_return ADD COLUMN IF NOT EXISTS correction_of UUID REFERENCES public.stock_return(id);
ALTER TABLE public.stock_return ADD COLUMN IF NOT EXISTS correction_status TEXT CHECK (correction_status IN ('correction', 'reversal'));

ALTER TABLE public.supplier_settlements ADD COLUMN IF NOT EXISTS correction_of UUID REFERENCES public.supplier_settlements(id);
ALTER TABLE public.supplier_settlements ADD COLUMN IF NOT EXISTS correction_status TEXT CHECK (correction_status IN ('correction', 'reversal'));

-- ============================================================
-- 2. SUPPLIER SETTLEMENTS — ADD MISSING AUDIT FIELD
-- ============================================================

ALTER TABLE public.supplier_settlements ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(user_id);

-- ============================================================
-- 3. UPDATE AUDIT TRIGGER — DETECT CORRECTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_action TEXT;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    v_action := TG_OP;

    -- Detect corrections: INSERT with correction_of set → log as CORRECTION
    IF TG_OP = 'INSERT' AND NEW.correction_of IS NOT NULL THEN
      v_action := 'CORRECTION';
    END IF;

    INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_values, new_values)
    VALUES (
      auth.uid(),
      v_action,
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
-- 4. DEBT BALANCE — MAINTAIN FROM LEDGER (Revision 1)
-- ============================================================

-- Auto-recalculate customer debt_balance whenever a ledger entry is added
-- customers.debt_balance is a CACHED value only; source of truth is debt_ledger

CREATE OR REPLACE FUNCTION public.maintain_debt_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.recalculate_customer_balance(NEW.customer_id);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_debt_ledger_balance ON public.debt_ledger;
CREATE TRIGGER trg_debt_ledger_balance
  AFTER INSERT ON public.debt_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.maintain_debt_balance();

-- ============================================================
-- 5. APPEND-ONLY ENFORCEMENT (Revision 4 + 6)
-- ============================================================

-- Block physical DELETEs on all financial tables

CREATE OR REPLACE FUNCTION public.prevent_financial_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'Financial records cannot be deleted. Use correction workflow instead.';
END;
$function$;

-- Block direct UPDATEs on financial tables except correction metadata

CREATE OR REPLACE FUNCTION public.prevent_financial_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'Financial records cannot be modified directly. Create a correction record instead.';
END;
$function$;

-- Allow supplier_settlements to update status/settlement_date/settled_by only

CREATE OR REPLACE FUNCTION public.restrict_settlement_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF (
    OLD.total_received IS DISTINCT FROM NEW.total_received OR
    OLD.total_sold IS DISTINCT FROM NEW.total_sold OR
    OLD.total_returned IS DISTINCT FROM NEW.total_returned OR
    OLD.payable_quantity IS DISTINCT FROM NEW.payable_quantity OR
    OLD.cost_per_pax IS DISTINCT FROM NEW.cost_per_pax OR
    OLD.payable_amount IS DISTINCT FROM NEW.payable_amount OR
    OLD.intake_id IS DISTINCT FROM NEW.intake_id
  ) THEN
    RAISE EXCEPTION 'Supplier settlement amounts cannot be modified. Recalculate instead.';
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- 6. ATTACH TRIGGERS
-- ============================================================

-- sales
DROP TRIGGER IF EXISTS trg_sales_no_delete ON public.sales;
CREATE TRIGGER trg_sales_no_delete BEFORE DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();
DROP TRIGGER IF EXISTS trg_sales_no_update ON public.sales;
CREATE TRIGGER trg_sales_no_update BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_update();

-- debt_ledger
DROP TRIGGER IF EXISTS trg_debt_ledger_no_delete ON public.debt_ledger;
CREATE TRIGGER trg_debt_ledger_no_delete BEFORE DELETE ON public.debt_ledger
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();
DROP TRIGGER IF EXISTS trg_debt_ledger_no_update ON public.debt_ledger;
CREATE TRIGGER trg_debt_ledger_no_update BEFORE UPDATE ON public.debt_ledger
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_update();

-- debt_collection
DROP TRIGGER IF EXISTS trg_debt_collection_no_delete ON public.debt_collection;
CREATE TRIGGER trg_debt_collection_no_delete BEFORE DELETE ON public.debt_collection
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();
DROP TRIGGER IF EXISTS trg_debt_collection_no_update ON public.debt_collection;
CREATE TRIGGER trg_debt_collection_no_update BEFORE UPDATE ON public.debt_collection
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_update();

-- expenses
DROP TRIGGER IF EXISTS trg_expenses_no_delete ON public.expenses;
CREATE TRIGGER trg_expenses_no_delete BEFORE DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();
DROP TRIGGER IF EXISTS trg_expenses_no_update ON public.expenses;
CREATE TRIGGER trg_expenses_no_update BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_update();

-- stock_intake
DROP TRIGGER IF EXISTS trg_stock_intake_no_delete ON public.stock_intake;
CREATE TRIGGER trg_stock_intake_no_delete BEFORE DELETE ON public.stock_intake
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();
DROP TRIGGER IF EXISTS trg_stock_intake_no_update ON public.stock_intake;
CREATE TRIGGER trg_stock_intake_no_update BEFORE UPDATE ON public.stock_intake
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_update();

-- stock_distribution
DROP TRIGGER IF EXISTS trg_stock_distribution_no_delete ON public.stock_distribution;
CREATE TRIGGER trg_stock_distribution_no_delete BEFORE DELETE ON public.stock_distribution
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();
DROP TRIGGER IF EXISTS trg_stock_distribution_no_update ON public.stock_distribution;
CREATE TRIGGER trg_stock_distribution_no_update BEFORE UPDATE ON public.stock_distribution
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_update();

-- stock_return
DROP TRIGGER IF EXISTS trg_stock_return_no_delete ON public.stock_return;
CREATE TRIGGER trg_stock_return_no_delete BEFORE DELETE ON public.stock_return
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();
DROP TRIGGER IF EXISTS trg_stock_return_no_update ON public.stock_return;
CREATE TRIGGER trg_stock_return_no_update BEFORE UPDATE ON public.stock_return
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_update();

-- supplier_settlements (allow status/settlement_date updates but block amount changes)
DROP TRIGGER IF EXISTS trg_supplier_settlements_no_delete ON public.supplier_settlements;
CREATE TRIGGER trg_supplier_settlements_no_delete BEFORE DELETE ON public.supplier_settlements
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();
DROP TRIGGER IF EXISTS trg_supplier_settlements_restrict_update ON public.supplier_settlements;
CREATE TRIGGER trg_supplier_settlements_restrict_update BEFORE UPDATE ON public.supplier_settlements
  FOR EACH ROW EXECUTE FUNCTION public.restrict_settlement_update();
