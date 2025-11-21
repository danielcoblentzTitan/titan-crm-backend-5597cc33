UPDATE pricing_items 
SET unit_type = 'sq ft' 
WHERE LOWER(name) LIKE '%concrete%';