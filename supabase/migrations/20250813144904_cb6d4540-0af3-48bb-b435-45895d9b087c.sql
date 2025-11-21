-- Fix insulation items to use correct formulas and unit types

-- Fix R21 Insulation (Walls) - should use wall area formula
UPDATE pricing_items 
SET 
  unit_type = 'wall sq ft',
  has_formula = true,
  formula_type = 'wall_sq_ft'
WHERE id = 'db15a8b1-d51f-430d-b61c-049b07db6fca';

-- Fix 8" BIB Insulation Walls - should use wall area formula  
UPDATE pricing_items 
SET 
  unit_type = 'wall sq ft',
  has_formula = true,
  formula_type = 'wall_sq_ft'
WHERE id = '4ad919c8-3eb8-4c24-8690-be214c0d5ffe';

-- R49 Blown Insulation (Ceiling) should use ceiling/roof area
-- Check if it should use roof area formula for ceiling insulation
UPDATE pricing_items 
SET 
  has_formula = true,
  formula_type = 'roofing_material'
WHERE id = '1366757c-b940-43dd-8f71-50b258c1cc16';