-- Add building_type column to projects_new table
ALTER TABLE public.projects_new 
ADD COLUMN IF NOT EXISTS building_type TEXT DEFAULT 'Barndominium';

-- Add a check constraint for valid building types
ALTER TABLE public.projects_new 
DROP CONSTRAINT IF EXISTS projects_new_building_type_check;

ALTER TABLE public.projects_new 
ADD CONSTRAINT projects_new_building_type_check 
CHECK (building_type IN ('Residential', 'Barndominium', 'Commercial'));