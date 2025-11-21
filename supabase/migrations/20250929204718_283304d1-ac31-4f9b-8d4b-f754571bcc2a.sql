-- Insert payment schedule templates
INSERT INTO public.payment_schedule_templates (name, description, schedule_data) VALUES
('7-Draw Barndominium', 'Standard 7-draw payment schedule for full turnkey barndominium projects', 
  '[
    {"title": "Contract Signing", "percentage": 20, "description": "Initial deposit upon contract execution", "milestone_event": "contract_signed"},
    {"title": "Concrete Foundation", "percentage": 20, "description": "After foundation is poured and cured", "milestone_event": "foundation_complete"},
    {"title": "Building Dried-In", "percentage": 15, "description": "When building is weatherproof", "milestone_event": "dried_in"},
    {"title": "Rough-In Complete", "percentage": 15, "description": "Electrical, plumbing, HVAC rough-in done", "milestone_event": "rough_in_complete"},
    {"title": "Insulation & Drywall", "percentage": 15, "description": "After insulation and drywall installation", "milestone_event": "drywall_complete"},
    {"title": "Final Finishes", "percentage": 10, "description": "When all interior finishes are complete", "milestone_event": "finishes_complete"},
    {"title": "Project Completion", "percentage": 5, "description": "Final walkthrough and project handoff", "milestone_event": "project_complete"}
  ]'::jsonb),
('5-Draw Standard Building', 'Simplified 5-draw schedule for standard building shell projects',
  '[
    {"title": "Contract Signing", "percentage": 30, "description": "Initial deposit", "milestone_event": "contract_signed"},
    {"title": "Foundation Complete", "percentage": 25, "description": "Foundation poured and inspected", "milestone_event": "foundation_complete"},
    {"title": "Building Erected", "percentage": 20, "description": "Structure standing and dried-in", "milestone_event": "structure_complete"},
    {"title": "Final Finishes", "percentage": 15, "description": "All finishes and details complete", "milestone_event": "finishes_complete"},
    {"title": "Final Completion", "percentage": 10, "description": "Final walkthrough", "milestone_event": "project_complete"}
  ]'::jsonb),
('4-Draw Shell Only', 'Basic 4-draw schedule for shell-only projects',
  '[
    {"title": "Down Payment", "percentage": 35, "description": "Initial contract payment", "milestone_event": "contract_signed"},
    {"title": "Foundation", "percentage": 30, "description": "Foundation complete", "milestone_event": "foundation_complete"},
    {"title": "Structure Erected", "percentage": 25, "description": "Building standing", "milestone_event": "structure_complete"},
    {"title": "Final Payment", "percentage": 10, "description": "Project completion", "milestone_event": "project_complete"}
  ]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert phase addon packages
INSERT INTO public.phase_addon_packages (name, description, category, sort_order) VALUES
('Electrical Package', 'Complete electrical rough-in and finish work', 'Systems', 10),
('Plumbing Package', 'Full plumbing rough-in and fixture installation', 'Systems', 20),
('HVAC Package', 'Heating, ventilation, and air conditioning installation', 'Systems', 30),
('Insulation & Drywall', 'Wall insulation and drywall installation with finishing', 'Interior', 40),
('Interior Finishes', 'Paint, trim, doors, and interior hardware', 'Interior', 50),
('Flooring Package', 'Complete flooring installation', 'Interior', 60),
('Kitchen Package', 'Kitchen cabinets, countertops, and appliances', 'Interior', 70),
('Bathroom Finishes', 'Bathroom fixtures, tile, and finishes', 'Interior', 80),
('Garage Doors & Openers', 'Overhead doors and automatic openers', 'Exterior', 90),
('Site Work', 'Grading, drainage, and site preparation', 'Foundation', 5)
ON CONFLICT DO NOTHING;

-- Insert phase addon items for each package
INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority) 
SELECT 
  p.id,
  'Electrical Rough-In',
  5,
  1,
  'Install electrical boxes, wiring, and panels',
  'High'
FROM public.phase_addon_packages p WHERE p.name = 'Electrical Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Electrical Finish',
  3,
  2,
  'Install fixtures, outlets, switches, and test',
  'High'
FROM public.phase_addon_packages p WHERE p.name = 'Electrical Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Plumbing Rough-In',
  5,
  1,
  'Install water lines, drain pipes, and vents',
  'High'
FROM public.phase_addon_packages p WHERE p.name = 'Plumbing Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Plumbing Fixtures',
  3,
  2,
  'Install sinks, toilets, faucets, and test',
  'High'
FROM public.phase_addon_packages p WHERE p.name = 'Plumbing Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'HVAC Installation',
  7,
  1,
  'Install heating and cooling systems',
  'High'
FROM public.phase_addon_packages p WHERE p.name = 'HVAC Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Insulation Install',
  3,
  1,
  'Install wall and ceiling insulation',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Insulation & Drywall';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Drywall Hanging',
  4,
  2,
  'Hang and secure drywall sheets',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Insulation & Drywall';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Drywall Finishing',
  5,
  3,
  'Tape, mud, sand, and texture',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Insulation & Drywall';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Interior Painting',
  5,
  1,
  'Prime and paint all interior surfaces',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Interior Finishes';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Trim & Doors',
  4,
  2,
  'Install baseboard, casing, and interior doors',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Interior Finishes';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Flooring Installation',
  6,
  1,
  'Install flooring throughout',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Flooring Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Cabinet Installation',
  3,
  1,
  'Install kitchen cabinets',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Kitchen Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Countertop Install',
  2,
  2,
  'Install kitchen countertops',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Kitchen Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Appliance Install',
  1,
  3,
  'Install kitchen appliances',
  'Low'
FROM public.phase_addon_packages p WHERE p.name = 'Kitchen Package';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Bathroom Tile',
  4,
  1,
  'Install bathroom tile work',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Bathroom Finishes';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Bathroom Fixtures',
  2,
  2,
  'Install vanities, mirrors, accessories',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Bathroom Finishes';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Garage Door Install',
  2,
  1,
  'Install overhead garage doors and openers',
  'Medium'
FROM public.phase_addon_packages p WHERE p.name = 'Garage Doors & Openers';

INSERT INTO public.phase_addon_items (addon_package_id, name, duration_days, sort_order, description, priority)
SELECT 
  p.id,
  'Site Preparation',
  5,
  1,
  'Clear, grade, and prepare building site',
  'High'
FROM public.phase_addon_packages p WHERE p.name = 'Site Work';

-- Get the existing "Barndo Standard" template ID
DO $$
DECLARE
  barndo_template_id UUID;
  standard_template_id UUID;
  payment_7draw_id UUID;
  payment_5draw_id UUID;
  payment_4draw_id UUID;
  electrical_id UUID;
  plumbing_id UUID;
  hvac_id UUID;
  insulation_id UUID;
  interior_id UUID;
BEGIN
  -- Get template IDs
  SELECT id INTO barndo_template_id FROM public.phase_templates WHERE name = 'Barndo Standard' LIMIT 1;
  
  -- Get payment schedule IDs
  SELECT id INTO payment_7draw_id FROM public.payment_schedule_templates WHERE name = '7-Draw Barndominium' LIMIT 1;
  SELECT id INTO payment_5draw_id FROM public.payment_schedule_templates WHERE name = '5-Draw Standard Building' LIMIT 1;
  SELECT id INTO payment_4draw_id FROM public.payment_schedule_templates WHERE name = '4-Draw Shell Only' LIMIT 1;
  
  -- Get addon package IDs for defaults
  SELECT id INTO electrical_id FROM public.phase_addon_packages WHERE name = 'Electrical Package' LIMIT 1;
  SELECT id INTO plumbing_id FROM public.phase_addon_packages WHERE name = 'Plumbing Package' LIMIT 1;
  SELECT id INTO hvac_id FROM public.phase_addon_packages WHERE name = 'HVAC Package' LIMIT 1;
  SELECT id INTO insulation_id FROM public.phase_addon_packages WHERE name = 'Insulation & Drywall' LIMIT 1;
  SELECT id INTO interior_id FROM public.phase_addon_packages WHERE name = 'Interior Finishes' LIMIT 1;

  -- Create Full Turnkey Barndominium config
  IF barndo_template_id IS NOT NULL AND payment_7draw_id IS NOT NULL THEN
    INSERT INTO public.project_type_configs (name, description, base_template_id, payment_schedule_template_id, default_addon_ids)
    VALUES (
      'Full Turnkey Barndominium',
      'Complete barndominium with all systems and finishes included',
      barndo_template_id,
      payment_7draw_id,
      ARRAY[electrical_id, plumbing_id, hvac_id, insulation_id, interior_id]::UUID[]
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create Standard Building Shell config
  IF payment_5draw_id IS NOT NULL THEN
    INSERT INTO public.project_type_configs (name, description, base_template_id, payment_schedule_template_id, default_addon_ids)
    VALUES (
      'Standard Building Shell',
      'Basic building shell without interior finishes',
      barndo_template_id,
      payment_5draw_id,
      ARRAY[]::UUID[]
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create Shell Only config
  IF payment_4draw_id IS NOT NULL THEN
    INSERT INTO public.project_type_configs (name, description, base_template_id, payment_schedule_template_id, default_addon_ids)
    VALUES (
      'Shell Only - No Interior',
      'Weatherproof shell only, customer finishes interior',
      barndo_template_id,
      payment_4draw_id,
      ARRAY[]::UUID[]
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;