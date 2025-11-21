-- Fix insulation items to use the correct inside wall formula
UPDATE pricing_items 
SET formula_type = 'inside_wall_sq_ft'
WHERE id IN ('db15a8b1-d51f-430d-b61c-049b07db6fca', '4ad919c8-3eb8-4c24-8690-be214c0d5ffe');