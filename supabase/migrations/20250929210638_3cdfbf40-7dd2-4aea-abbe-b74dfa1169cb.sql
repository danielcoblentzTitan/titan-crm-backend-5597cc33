-- Clean up duplicate project type configs and add more options
-- First, delete all existing configs
DELETE FROM project_type_configs;

-- Insert comprehensive project type configurations
INSERT INTO project_type_configs (id, name, description, is_active) VALUES
-- Basic Options
(gen_random_uuid(), 'Shell Only - No Interior', 'Weatherproof shell only, customer completes all interior finishes', true),
(gen_random_uuid(), 'Standard Building Shell', 'Complete building shell with basic finishes', true),

-- Barndominium Options
(gen_random_uuid(), 'Barndominium - Basic', 'Shell with basic interior package for living space', true),
(gen_random_uuid(), 'Barndominium - Standard', 'Complete living quarters with standard finishes', true),
(gen_random_uuid(), 'Barndominium - Premium', 'High-end finishes throughout living and garage areas', true),

-- Residential Options
(gen_random_uuid(), 'Residential - Spec Home', 'Production home with builder-grade finishes', true),
(gen_random_uuid(), 'Residential - Custom Home', 'Custom home with client-selected finishes', true),
(gen_random_uuid(), 'Residential - Luxury Home', 'High-end custom home with premium finishes', true),

-- Commercial Options
(gen_random_uuid(), 'Commercial - Warehouse', 'Basic warehouse structure with office space', true),
(gen_random_uuid(), 'Commercial - Retail', 'Retail space with storefront and customer areas', true),
(gen_random_uuid(), 'Commercial - Office Building', 'Multi-tenant office building', true),

-- Agricultural Options
(gen_random_uuid(), 'Agricultural - Barn', 'Basic barn structure for livestock or storage', true),
(gen_random_uuid(), 'Agricultural - Equipment Storage', 'Large equipment storage facility', true),

-- Specialty Options
(gen_random_uuid(), 'Addition/Renovation', 'Addition or major renovation to existing structure', true),
(gen_random_uuid(), 'Garage/Shop', 'Detached garage or workshop building', true);