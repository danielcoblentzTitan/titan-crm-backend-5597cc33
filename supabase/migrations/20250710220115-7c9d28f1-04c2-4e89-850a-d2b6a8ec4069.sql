-- Add formula support columns to pricing_items table
ALTER TABLE public.pricing_items 
ADD COLUMN has_formula boolean DEFAULT false,
ADD COLUMN formula_type text,
ADD COLUMN formula_params jsonb DEFAULT '{}';

-- Update existing items to use formulas
UPDATE public.pricing_items 
SET has_formula = true, formula_type = 'lean_to'
WHERE name ILIKE '%lean%' AND name ILIKE '%open%';

UPDATE public.pricing_items 
SET has_formula = true, formula_type = 'scissor_truss'
WHERE name ILIKE '%scissor%' AND name ILIKE '%truss%';

UPDATE public.pricing_items 
SET has_formula = true, formula_type = 'greenpost'
WHERE name ILIKE '%greenpost%';