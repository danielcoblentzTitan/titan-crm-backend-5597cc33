-- Add latitude and longitude columns to legacy projects table if they don't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS latitude NUMERIC;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Create index for efficient location lookups
CREATE INDEX IF NOT EXISTS idx_projects_location ON public.projects(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;