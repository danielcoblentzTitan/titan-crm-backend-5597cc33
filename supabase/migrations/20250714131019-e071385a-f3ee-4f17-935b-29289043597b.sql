-- Update all items in the Roofing category to use the roofing_material formula
UPDATE pricing_items 
SET 
  has_formula = true,
  formula_type = 'roofing_material',
  unit_type = 'sq ft'
WHERE category_id = (
  SELECT id FROM pricing_categories WHERE name = 'Roofing'
);