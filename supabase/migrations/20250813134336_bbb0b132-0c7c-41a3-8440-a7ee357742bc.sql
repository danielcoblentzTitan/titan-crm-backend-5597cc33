-- Add version_name column to estimates table
ALTER TABLE public.estimates 
ADD COLUMN version_name text;

-- Set default version names for existing estimates
UPDATE public.estimates 
SET version_name = 'Version ' || EXTRACT(EPOCH FROM created_at)::text
WHERE version_name IS NULL;