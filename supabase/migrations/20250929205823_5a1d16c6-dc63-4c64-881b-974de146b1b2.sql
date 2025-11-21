-- Clean up duplicate addon packages
-- First, delete all phase addon items (to avoid FK issues)
DELETE FROM phase_addon_items;

-- Delete all project addon selections
DELETE FROM project_addon_selections;

-- Delete all addon packages
DELETE FROM phase_addon_packages;

-- Re-insert unique addon packages (only once!)
INSERT INTO phase_addon_packages (id, name, description, category, sort_order, is_active) VALUES
-- Systems
(gen_random_uuid(), 'Electrical Package', 'Complete electrical installation and wiring', 'Systems', 10, true),
(gen_random_uuid(), 'Plumbing Package', 'Full plumbing system installation', 'Systems', 20, true),
(gen_random_uuid(), 'HVAC Package', 'Heating and cooling system installation', 'Systems', 30, true),

-- Foundation
(gen_random_uuid(), 'Site Work', 'Grading, drainage, and site preparation', 'Foundation', 5, true),

-- Interior
(gen_random_uuid(), 'Insulation & Drywall', 'Complete insulation and drywall installation', 'Interior', 40, true),
(gen_random_uuid(), 'Interior Finishes', 'Paint, trim, and finishing work', 'Interior', 50, true),
(gen_random_uuid(), 'Flooring Package', 'Complete flooring installation', 'Interior', 60, true),
(gen_random_uuid(), 'Kitchen Package', 'Kitchen cabinets, countertops, and appliances', 'Interior', 70, true),
(gen_random_uuid(), 'Bathroom Finishes', 'Bathroom fixtures, tile, and finishes', 'Interior', 80, true),

-- Exterior
(gen_random_uuid(), 'Garage Doors & Openers', 'Overhead doors and automatic openers', 'Exterior', 90, true);

-- Re-insert phase addon items for each package
-- Electrical Package phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Electrical Rough-In', 5, 1, 'Install wiring and electrical boxes'
FROM phase_addon_packages WHERE name = 'Electrical Package' AND category = 'Systems';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Electrical Final', 3, 2, 'Install fixtures and complete electrical'
FROM phase_addon_packages WHERE name = 'Electrical Package' AND category = 'Systems';

-- Plumbing Package phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Plumbing Rough-In', 4, 1, 'Install pipes and drains'
FROM phase_addon_packages WHERE name = 'Plumbing Package' AND category = 'Systems';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Plumbing Final', 3, 2, 'Install fixtures and complete plumbing'
FROM phase_addon_packages WHERE name = 'Plumbing Package' AND category = 'Systems';

-- HVAC Package phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'HVAC Rough-In', 3, 1, 'Install ductwork and equipment'
FROM phase_addon_packages WHERE name = 'HVAC Package' AND category = 'Systems';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'HVAC Final', 2, 2, 'Complete HVAC installation and testing'
FROM phase_addon_packages WHERE name = 'HVAC Package' AND category = 'Systems';

-- Site Work phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Site Preparation', 3, 1, 'Clear and grade building site'
FROM phase_addon_packages WHERE name = 'Site Work' AND category = 'Foundation';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Drainage Installation', 2, 2, 'Install drainage systems'
FROM phase_addon_packages WHERE name = 'Site Work' AND category = 'Foundation';

-- Insulation & Drywall phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Insulation', 3, 1, 'Install wall and ceiling insulation'
FROM phase_addon_packages WHERE name = 'Insulation & Drywall' AND category = 'Interior';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Drywall', 5, 2, 'Hang and finish drywall'
FROM phase_addon_packages WHERE name = 'Insulation & Drywall' AND category = 'Interior';

-- Interior Finishes phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Painting', 4, 1, 'Prime and paint interior'
FROM phase_addon_packages WHERE name = 'Interior Finishes' AND category = 'Interior';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Trim Installation', 3, 2, 'Install baseboards, doors, and trim'
FROM phase_addon_packages WHERE name = 'Interior Finishes' AND category = 'Interior';

-- Flooring Package phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Flooring Installation', 5, 1, 'Install flooring throughout'
FROM phase_addon_packages WHERE name = 'Flooring Package' AND category = 'Interior';

-- Kitchen Package phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Kitchen Cabinets', 3, 1, 'Install kitchen cabinets'
FROM phase_addon_packages WHERE name = 'Kitchen Package' AND category = 'Interior';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Countertops & Appliances', 2, 2, 'Install countertops and appliances'
FROM phase_addon_packages WHERE name = 'Kitchen Package' AND category = 'Interior';

-- Bathroom Finishes phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Bathroom Tile', 3, 1, 'Install bathroom tile'
FROM phase_addon_packages WHERE name = 'Bathroom Finishes' AND category = 'Interior';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Bathroom Fixtures', 2, 2, 'Install vanities, toilets, and fixtures'
FROM phase_addon_packages WHERE name = 'Bathroom Finishes' AND category = 'Interior';

-- Garage Doors & Openers phases
INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Garage Door Installation', 1, 1, 'Install overhead doors'
FROM phase_addon_packages WHERE name = 'Garage Doors & Openers' AND category = 'Exterior';

INSERT INTO phase_addon_items (addon_package_id, name, duration_days, sort_order, description)
SELECT id, 'Opener Installation', 1, 2, 'Install automatic door openers'
FROM phase_addon_packages WHERE name = 'Garage Doors & Openers' AND category = 'Exterior';