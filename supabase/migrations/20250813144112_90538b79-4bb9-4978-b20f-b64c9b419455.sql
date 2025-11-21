-- Update siding items to use proper wall area formula
UPDATE pricing_items 
SET 
  has_formula = true,
  formula_type = 'siding'
WHERE category_id = 'e5ce8d90-3d0b-4222-a2ca-bfd9d08f250e';