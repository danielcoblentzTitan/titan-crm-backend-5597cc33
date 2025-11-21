-- Add version_name column to estimates table
ALTER TABLE public.estimates 
ADD COLUMN version_name text;

-- Update existing estimates to have default version names
UPDATE public.estimates 
SET version_name = COALESCE('Version ' || ROW_NUMBER() OVER (PARTITION BY lead_id ORDER BY created_at), 'Version 1')
WHERE version_name IS NULL;