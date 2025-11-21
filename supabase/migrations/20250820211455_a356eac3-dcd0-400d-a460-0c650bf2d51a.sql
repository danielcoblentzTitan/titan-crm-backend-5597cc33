-- Safeguard milestone sync to avoid FK violations referencing projects_new
CREATE OR REPLACE FUNCTION public.sync_milestones_from_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- If project does not exist in projects_new (FK target), skip to prevent 409s
  IF NOT EXISTS (SELECT 1 FROM public.projects_new pn WHERE pn.id = NEW.project_id) THEN
    RAISE NOTICE 'Skipping milestone sync for project %, not found in projects_new', NEW.project_id;
    RETURN NEW;
  END IF;

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
$function$;