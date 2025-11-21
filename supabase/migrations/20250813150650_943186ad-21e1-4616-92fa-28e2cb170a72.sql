-- Create separate concrete pricing items for Lean-To 1 and Lean-To 2

-- Create Lean-To 1 concrete items
INSERT INTO pricing_items (id, name, description, base_price, unit_type, has_formula, formula_type, category_id, is_active, sort_order)
VALUES 
  (
    gen_random_uuid(),
    '4" Concrete (Lean-To 1)',
    'Lean-to 1 concrete - calculated by lean-to 1 width × height',
    4.50,
    'sq ft',
    true,
    'lean_to_1',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    20
  ),
  (
    gen_random_uuid(),
    '5" Concrete (Lean-To 1)', 
    'Lean-to 1 concrete - calculated by lean-to 1 width × height',
    5.00,
    'sq ft',
    true,
    'lean_to_1',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    21
  ),
  (
    gen_random_uuid(),
    '6" Concrete (Lean-To 1)',
    'Lean-to 1 concrete - calculated by lean-to 1 width × height', 
    5.50,
    'sq ft',
    true,
    'lean_to_1',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    22
  );

-- Create Lean-To 2 concrete items
INSERT INTO pricing_items (id, name, description, base_price, unit_type, has_formula, formula_type, category_id, is_active, sort_order)
VALUES 
  (
    gen_random_uuid(),
    '4" Concrete (Lean-To 2)',
    'Lean-to 2 concrete - calculated by lean-to 2 width × height',
    4.50,
    'sq ft',
    true,
    'lean_to_2',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    30
  ),
  (
    gen_random_uuid(),
    '5" Concrete (Lean-To 2)', 
    'Lean-to 2 concrete - calculated by lean-to 2 width × height',
    5.00,
    'sq ft',
    true,
    'lean_to_2',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    31
  ),
  (
    gen_random_uuid(),
    '6" Concrete (Lean-To 2)',
    'Lean-to 2 concrete - calculated by lean-to 2 width × height', 
    5.50,
    'sq ft',
    true,
    'lean_to_2',
    (SELECT id FROM pricing_categories WHERE name = 'Concrete' LIMIT 1),
    true,
    32
  );