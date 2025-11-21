-- Fix existing version names to use proper numbering
WITH numbered_estimates AS (
  SELECT 
    id,
    lead_id,
    ROW_NUMBER() OVER (PARTITION BY lead_id ORDER BY created_at) as version_num
  FROM public.estimates
)
UPDATE public.estimates 
SET version_name = 'Version ' || numbered_estimates.version_num
FROM numbered_estimates
WHERE estimates.id = numbered_estimates.id;