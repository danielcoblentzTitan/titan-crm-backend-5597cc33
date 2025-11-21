-- Add column to distinguish auto-generated estimates from manual ones
ALTER TABLE public.estimates 
ADD COLUMN is_auto_generated boolean NOT NULL DEFAULT false;

-- Update existing auto-generated estimates based on notes content
UPDATE public.estimates 
SET is_auto_generated = true 
WHERE notes LIKE '%Auto-generated estimate%' OR notes LIKE '%auto-generated%';