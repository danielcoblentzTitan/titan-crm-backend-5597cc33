-- Create three main phase templates: Residential, Commercial, and Barndominium
-- Delete existing templates first
DELETE FROM phase_template_items;
DELETE FROM phase_templates;

-- Insert the three main templates
INSERT INTO phase_templates (id, name, description, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Residential', 'Standard residential construction with essential phases only', true),
('22222222-2222-2222-2222-222222222222', 'Commercial', 'Full commercial building construction with all phases', true),
('33333333-3333-3333-3333-333333333333', 'Barndominium', 'Complete barndominium construction with all phases', true);

-- Insert phase template items for RESIDENTIAL (minimal - only required phases)
INSERT INTO phase_template_items (template_id, name, default_duration_days, sort_order, predecessor_item_id, lag_days, default_color) VALUES
('11111111-1111-1111-1111-111111111111', 'Framing Crew', 5, 1, NULL, 0, '#3b82f6'),
('11111111-1111-1111-1111-111111111111', 'Concrete Crew', 3, 2, NULL, 0, '#8b5cf6'),
('11111111-1111-1111-1111-111111111111', 'Garage Doors and Gutters', 2, 3, NULL, 0, '#06b6d4'),
('11111111-1111-1111-1111-111111111111', 'Final', 2, 4, NULL, 0, '#10b981');

-- Insert phase template items for COMMERCIAL (all phases)
INSERT INTO phase_template_items (template_id, name, default_duration_days, sort_order, predecessor_item_id, lag_days, default_color) VALUES
('22222222-2222-2222-2222-222222222222', 'Framing Crew', 5, 1, NULL, 0, '#3b82f6'),
('22222222-2222-2222-2222-222222222222', 'Plumbing Underground', 2, 2, NULL, 0, '#ef4444'),
('22222222-2222-2222-2222-222222222222', 'Concrete Crew', 3, 3, NULL, 0, '#8b5cf6'),
('22222222-2222-2222-2222-222222222222', 'Interior Framing', 4, 4, NULL, 0, '#f59e0b'),
('22222222-2222-2222-2222-222222222222', 'Plumbing Rough In', 3, 5, NULL, 0, '#ef4444'),
('22222222-2222-2222-2222-222222222222', 'HVAC Rough In', 3, 6, NULL, 0, '#14b8a6'),
('22222222-2222-2222-2222-222222222222', 'Electric Rough In', 3, 7, NULL, 0, '#f59e0b'),
('22222222-2222-2222-2222-222222222222', 'Insulation', 2, 8, NULL, 0, '#84cc16'),
('22222222-2222-2222-2222-222222222222', 'Drywall', 5, 9, NULL, 0, '#6366f1'),
('22222222-2222-2222-2222-222222222222', 'Paint', 4, 10, NULL, 0, '#ec4899'),
('22222222-2222-2222-2222-222222222222', 'Flooring', 4, 11, NULL, 0, '#a855f7'),
('22222222-2222-2222-2222-222222222222', 'Doors and Trim', 3, 12, NULL, 0, '#f97316'),
('22222222-2222-2222-2222-222222222222', 'Garage Doors and Gutters', 2, 13, NULL, 0, '#06b6d4'),
('22222222-2222-2222-2222-222222222222', 'Garage Finish', 2, 14, NULL, 0, '#0ea5e9'),
('22222222-2222-2222-2222-222222222222', 'Plumbing Final', 2, 15, NULL, 0, '#ef4444'),
('22222222-2222-2222-2222-222222222222', 'HVAC Final', 2, 16, NULL, 0, '#14b8a6'),
('22222222-2222-2222-2222-222222222222', 'Electric Final', 2, 17, NULL, 0, '#f59e0b'),
('22222222-2222-2222-2222-222222222222', 'Kitchen Install', 3, 18, NULL, 0, '#8b5cf6'),
('22222222-2222-2222-2222-222222222222', 'Interior Finishes', 4, 19, NULL, 0, '#ec4899'),
('22222222-2222-2222-2222-222222222222', 'Final', 2, 20, NULL, 0, '#10b981');

-- Insert phase template items for BARNDOMINIUM (all phases)
INSERT INTO phase_template_items (template_id, name, default_duration_days, sort_order, predecessor_item_id, lag_days, default_color) VALUES
('33333333-3333-3333-3333-333333333333', 'Framing Crew', 5, 1, NULL, 0, '#3b82f6'),
('33333333-3333-3333-3333-333333333333', 'Plumbing Underground', 2, 2, NULL, 0, '#ef4444'),
('33333333-3333-3333-3333-333333333333', 'Concrete Crew', 3, 3, NULL, 0, '#8b5cf6'),
('33333333-3333-3333-3333-333333333333', 'Interior Framing', 4, 4, NULL, 0, '#f59e0b'),
('33333333-3333-3333-3333-333333333333', 'Plumbing Rough In', 3, 5, NULL, 0, '#ef4444'),
('33333333-3333-3333-3333-333333333333', 'HVAC Rough In', 3, 6, NULL, 0, '#14b8a6'),
('33333333-3333-3333-3333-333333333333', 'Electric Rough In', 3, 7, NULL, 0, '#f59e0b'),
('33333333-3333-3333-3333-333333333333', 'Insulation', 2, 8, NULL, 0, '#84cc16'),
('33333333-3333-3333-3333-333333333333', 'Drywall', 5, 9, NULL, 0, '#6366f1'),
('33333333-3333-3333-3333-333333333333', 'Paint', 4, 10, NULL, 0, '#ec4899'),
('33333333-3333-3333-3333-333333333333', 'Flooring', 4, 11, NULL, 0, '#a855f7'),
('33333333-3333-3333-3333-333333333333', 'Doors and Trim', 3, 12, NULL, 0, '#f97316'),
('33333333-3333-3333-3333-333333333333', 'Garage Doors and Gutters', 2, 13, NULL, 0, '#06b6d4'),
('33333333-3333-3333-3333-333333333333', 'Garage Finish', 2, 14, NULL, 0, '#0ea5e9'),
('33333333-3333-3333-3333-333333333333', 'Plumbing Final', 2, 15, NULL, 0, '#ef4444'),
('33333333-3333-3333-3333-333333333333', 'HVAC Final', 2, 16, NULL, 0, '#14b8a6'),
('33333333-3333-3333-3333-333333333333', 'Electric Final', 2, 17, NULL, 0, '#f59e0b'),
('33333333-3333-3333-3333-333333333333', 'Kitchen Install', 3, 18, NULL, 0, '#8b5cf6'),
('33333333-3333-3333-3333-333333333333', 'Interior Finishes', 4, 19, NULL, 0, '#ec4899'),
('33333333-3333-3333-3333-333333333333', 'Final', 2, 20, NULL, 0, '#10b981');