-- Create Mechanicals category if it doesn't exist
INSERT INTO pricing_categories (name, description, sort_order)
SELECT 'Mechanicals', 'Plumbing, HVAC, and electrical systems', 50
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_categories WHERE LOWER(name) = 'mechanicals'
);