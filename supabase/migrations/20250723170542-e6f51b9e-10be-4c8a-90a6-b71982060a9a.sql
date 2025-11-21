-- Add Standard Site Plan and Lines and Grades pricing items

-- First, let's create a Site Services category if it doesn't exist
INSERT INTO pricing_categories (name, description, sort_order) 
VALUES ('Site Services', 'Site preparation and surveying services', 5)
ON CONFLICT (name) DO NOTHING;

-- Get the category ID for Site Services (create variable)
DO $$
DECLARE
    site_services_id uuid;
BEGIN
    -- Get or create Site Services category
    SELECT id INTO site_services_id FROM pricing_categories WHERE name = 'Site Services';
    
    IF site_services_id IS NULL THEN
        INSERT INTO pricing_categories (name, description, sort_order) 
        VALUES ('Site Services', 'Site preparation and surveying services', 5)
        RETURNING id INTO site_services_id;
    END IF;
    
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
        site_services_id,
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
        site_services_id,
        'Lines and Grades',
        'Site surveying for lines and grade establishment',
        'each',
        3000.00,
        true,
        20
    );
END $$;