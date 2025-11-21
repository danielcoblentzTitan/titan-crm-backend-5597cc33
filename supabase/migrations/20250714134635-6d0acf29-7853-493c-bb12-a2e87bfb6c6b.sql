-- Apply perimeter insulation formula to metal and stone wainscoting
UPDATE pricing_items 
SET 
  has_formula = true,
  formula_type = 'perimeter_insulation',
  unit_type = 'linear ft'
WHERE 
  category_id IN (
    SELECT id FROM pricing_categories WHERE LOWER(name) LIKE '%building shell addons%' OR LOWER(name) LIKE '%addon%'
  )
  AND (
    LOWER(name) LIKE '%metal wainscoting%' 
    OR LOWER(name) LIKE '%stone wainscoting%'
  );