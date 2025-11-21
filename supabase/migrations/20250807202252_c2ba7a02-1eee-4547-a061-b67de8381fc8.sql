-- Function: Sync project_milestones with schedule_data on project_schedules changes
CREATE OR REPLACE FUNCTION public.sync_milestones_from_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove existing automated milestones for this project to prevent duplicates
  DELETE FROM public.project_milestones
  WHERE project_id = NEW.project_id AND is_automated = true;

  -- Insert milestones based on schedule_data end dates
  IF NEW.schedule_data IS NOT NULL THEN
    INSERT INTO public.project_milestones (
      project_id,
      milestone_name,
      target_date,
      trigger_phase,
      is_automated,
      created_at,
      updated_at
    )
    SELECT 
      NEW.project_id,
      (elem->>'name')::text AS milestone_name,
      NULLIF(elem->>'endDate','')::date AS target_date,
      (elem->>'name')::text AS trigger_phase,
      true AS is_automated,
      now(),
      now()
    FROM jsonb_array_elements(NEW.schedule_data) AS elem
    WHERE (elem->>'endDate') IS NOT NULL AND (elem->>'endDate') <> '';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Run after insert/update on project_schedules
DROP TRIGGER IF EXISTS trg_sync_milestones_from_schedule ON public.project_schedules;
CREATE TRIGGER trg_sync_milestones_from_schedule
AFTER INSERT OR UPDATE ON public.project_schedules
FOR EACH ROW
EXECUTE FUNCTION public.sync_milestones_from_schedule();