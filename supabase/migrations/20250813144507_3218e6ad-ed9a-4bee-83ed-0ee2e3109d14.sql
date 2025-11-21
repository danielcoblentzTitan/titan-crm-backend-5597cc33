-- Fix siding items to use correct wall area formula
UPDATE pricing_items 
SET formula_type = 'wall_sq_ft'
WHERE category_id = 'e5ce8d90-3d0b-4222-a2ca-bfd9d08f250e';