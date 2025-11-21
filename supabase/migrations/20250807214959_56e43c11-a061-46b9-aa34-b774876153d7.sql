
-- 1) Add the permit_approved_at column to projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS permit_approved_at TIMESTAMPTZ NULL;

-- 2) Create a function to set permit_approved_at when phase flips to 'Pre Construction'
CREATE OR REPLACE FUNCTION public.set_permit_approved_at_on_phase()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- If the phase changed and is now 'Pre Construction', capture the first time it happens
  IF NEW.phase IS DISTINCT FROM OLD.phase
     AND NEW.phase = 'Pre Construction'
     AND NEW.permit_approved_at IS NULL THEN
    NEW.permit_approved_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Attach the trigger to projects (before update so we can set NEW.*)
DROP TRIGGER IF EXISTS trg_set_permit_approved_at_on_phase ON public.projects;
CREATE TRIGGER trg_set_permit_approved_at_on_phase
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_permit_approved_at_on_phase();

-- 4) Backfill for any existing projects already in 'Pre Construction' without a timestamp
UPDATE public.projects
SET permit_approved_at = COALESCE(updated_at, now())
WHERE phase = 'Pre Construction'
  AND permit_approved_at IS NULL;
