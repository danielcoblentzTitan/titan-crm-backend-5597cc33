-- Add Standard Site Plan and Lines and Grades pricing items

-- First, let's create a Site Services category 
INSERT INTO pricing_categories (name, description, sort_order) 
VALUES ('Site Services', 'Site preparation and surveying services', 5);

-- Get the category ID for Site Services
-- Insert Standard Site Plan pricing item
INSERT INTO pricing_items (
    category_id, 
    name, 
    description, 
    unit_type, 
    base_price, 
    is_active, 
    sort_order
) VALUES (
    (SELECT id FROM pricing_categories WHERE name = 'Site Services'),
    'Standard Site Plan',
    'Basic site plan preparation and layout',
    'each',
    199.00,
    true,
    10
);

-- Insert Lines and Grades pricing item
INSERT INTO pricing_items (
    category_id, 
    name, 
    description, 
    unit_type, 
    base_price, 
    is_active, 
    sort_order
) VALUES (
    (SELECT id FROM pricing_categories WHERE name = 'Site Services'),
    'Lines and Grades',
    'Site surveying for lines and grade establishment',
    'each',
    3000.00,
    true,
    20
);