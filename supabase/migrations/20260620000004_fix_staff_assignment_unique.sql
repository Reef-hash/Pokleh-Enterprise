-- Staff assignment: allow reassignment after ended_date is set
ALTER TABLE public.staff_area_assignments DROP CONSTRAINT IF EXISTS uq_active_assignment;
DROP INDEX IF EXISTS uq_active_assignment;
CREATE UNIQUE INDEX uq_active_assignment ON public.staff_area_assignments(staff_id, area_id) WHERE ended_date IS NULL;
