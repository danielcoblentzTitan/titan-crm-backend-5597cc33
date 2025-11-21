-- Add building_type column to leads table
ALTER TABLE public.leads 
ADD COLUMN building_type text DEFAULT 'Residential';

-- Add a comment to describe the column
COMMENT ON COLUMN public.leads.building_type IS 'Type of building project: Residential, Commercial, or Barndominium';