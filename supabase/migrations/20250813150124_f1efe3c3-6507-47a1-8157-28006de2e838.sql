-- Add lean-to concrete formula type to existing concrete items and create lean-to specific items

-- First, let's create a new formula type for lean-to concrete
-- Update existing concrete items to have formulas for main building area
UPDATE pricing_items 
SET 
  has_formula = true,
  formula_type = 'wall_sq_ft',
  description = 'Main building concrete - calculated by building footprint'
WHERE id IN (
  'a24b9ac6-42a5-4e6d-ad3e-216061d415c8', -- 4" Concrete
  '2fc7ec83-33b6-42a7-9e8d-44359e670697', -- 5" Concrete  
  '60f9b21d-1afc-46b8-a56c-d0122496cbc8'  -- 6" Concrete
);

-- Create lean-to specific concrete items
INSERT INTO pricing_items (id, name, description, base_price, unit_type, has_formula, formula_type, category_id, is_active, sort_order)
VALUES 
  (
    gen_random_uuid(),
    '4" Concrete (Lean-To)',
    'Lean-to concrete - calculated by lean-to width × height',
    4.50,
    'sq ft',
    true,
    'lean_to',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    10
  ),
  (
    gen_random_uuid(),
    '5" Concrete (Lean-To)', 
    'Lean-to concrete - calculated by lean-to width × height',
    5.00,
    'sq ft',
    true,
    'lean_to',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    11
  ),
  (
    gen_random_uuid(),
    '6" Concrete (Lean-To)',
    'Lean-to concrete - calculated by lean-to width × height', 
    5.50,
    'sq ft',
    true,
    'lean_to',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    12
  );