-- Add building_specifications JSONB column to leads table
ALTER TABLE public.leads 
ADD COLUMN building_specifications JSONB DEFAULT '{}'::jsonb;