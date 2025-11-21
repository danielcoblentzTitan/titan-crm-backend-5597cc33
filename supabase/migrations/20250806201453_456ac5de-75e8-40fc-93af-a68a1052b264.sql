-- Add fields to projects table for better analytics tracking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS building_type text DEFAULT 'Residential',
ADD COLUMN IF NOT EXISTS county text,
ADD COLUMN IF NOT EXISTS square_footage integer,
ADD COLUMN IF NOT EXISTS estimated_profit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_profit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_cancelled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_date date,
ADD COLUMN IF NOT EXISTS completion_date date;

-- Update existing projects to have proper building types based on project names
UPDATE public.projects 
SET building_type = CASE 
  WHEN LOWER(name) LIKE '%barndo%' OR LOWER(description) LIKE '%barndo%' THEN 'Barndominium'
  WHEN LOWER(name) LIKE '%commercial%' OR LOWER(description) LIKE '%commercial%' THEN 'Commercial' 
  WHEN status = 'Cancelled' THEN 'Cancelled'
  ELSE 'Residential'
END
WHERE building_type = 'Residential';

-- Create an index for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_projects_analytics 
ON public.projects (building_type, start_date, is_cancelled, status);