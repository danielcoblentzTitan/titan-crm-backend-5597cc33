-- Apply Length x 2 formula to Snow guards and Gutter Guards
UPDATE pricing_items 
SET 
  has_formula = true,
  formula_type = 'length_times_two',
  unit_type = 'linear ft'
WHERE 
  LOWER(name) LIKE '%snow guard%' 
  OR LOWER(name) LIKE '%gutter guard%';