-- Create siding formula for siding category items and R21 Insulation
UPDATE pricing_items 
SET 
  has_formula = true,
  formula_type = 'siding',
  unit_type = 'sq ft'
WHERE 
  category_id IN (
    SELECT id FROM pricing_categories WHERE LOWER(name) LIKE '%siding%'
  )
  OR (
    category_id IN (
      SELECT id FROM pricing_categories WHERE LOWER(name) LIKE '%insulation%'
    )
    AND LOWER(name) LIKE '%r21%'
  );