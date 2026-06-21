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

    IF TG_OP = 'INSERT' AND to_jsonb(NEW) ? 'correction_of' AND NEW.correction_of IS NOT NULL THEN
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
