-- Insert sample project phases for testing the sophisticated Gantt chart
INSERT INTO project_phases (
    project_id, 
    name, 
    status, 
    start_date, 
    end_date, 
    duration_days,
    completion_percentage,
    actual_start_date,
    baseline_start_date,
    baseline_end_date,
    baseline_duration_days,
    is_critical_path,
    priority,
    effort_hours
) VALUES 
-- Harper Barndo phases
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Site Preparation', 'Completed', '2025-08-15', '2025-08-25', 10, 100, '2025-08-15', '2025-08-15', '2025-08-25', 10, true, 'High', 80),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Foundation Work', 'In Progress', '2025-08-26', '2025-09-15', 20, 60, '2025-08-26', '2025-08-26', '2025-09-15', 20, true, 'Critical', 160),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Frame Construction', 'Planned', '2025-09-16', '2025-10-15', 30, 0, null, '2025-09-16', '2025-10-15', 30, true, 'High', 240),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Roofing & Siding', 'Planned', '2025-10-16', '2025-11-15', 30, 0, null, '2025-10-16', '2025-11-15', 30, true, 'High', 200),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Electrical Rough-In', 'Planned', '2025-11-01', '2025-11-20', 20, 0, null, '2025-11-01', '2025-11-20', 20, false, 'Medium', 120),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Plumbing Rough-In', 'Planned', '2025-11-01', '2025-11-20', 20, 0, null, '2025-11-01', '2025-11-20', 20, false, 'Medium', 100),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Insulation & Drywall', 'Planned', '2025-11-21', '2025-12-15', 24, 0, null, '2025-11-21', '2025-12-15', 24, false, 'Medium', 180),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Interior Finishing', 'Planned', '2025-12-16', '2026-01-20', 35, 0, null, '2025-12-16', '2026-01-20', 35, false, 'Low', 280),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Final Inspection', 'Planned', '2026-01-21', '2026-01-30', 9, 0, null, '2026-01-21', '2026-01-30', 9, true, 'Critical', 40),

-- Ramsey Shop+Home phases
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Site Preparation', 'Completed', '2025-08-05', '2025-08-18', 13, 100, '2025-08-05', '2025-08-05', '2025-08-18', 13, true, 'High', 104),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Foundation Work', 'In Progress', '2025-08-19', '2025-09-10', 22, 45, '2025-08-19', '2025-08-19', '2025-09-10', 22, true, 'Critical', 176),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Shop Frame Construction', 'Planned', '2025-09-11', '2025-10-05', 24, 0, null, '2025-09-11', '2025-10-05', 24, true, 'High', 192),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Home Frame Construction', 'Planned', '2025-10-06', '2025-11-10', 35, 0, null, '2025-10-06', '2025-11-10', 35, true, 'High', 280),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Roofing - Shop', 'Planned', '2025-10-20', '2025-11-05', 16, 0, null, '2025-10-20', '2025-11-05', 16, false, 'Medium', 128),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Roofing - Home', 'Planned', '2025-11-11', '2025-11-30', 19, 0, null, '2025-11-11', '2025-11-30', 19, true, 'High', 152),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'MEP Rough-In', 'Planned', '2025-12-01', '2025-12-25', 24, 0, null, '2025-12-01', '2025-12-25', 24, false, 'Medium', 200),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Interior Build-Out', 'Planned', '2025-12-26', '2026-02-15', 51, 0, null, '2025-12-26', '2026-02-15', 51, false, 'Medium', 408),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Final Walkthrough', 'Planned', '2026-02-16', '2026-02-28', 12, 0, null, '2026-02-16', '2026-02-28', 12, true, 'Critical', 48),

-- Bennett Farmhouse Barndo phases  
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Site Preparation', 'Completed', '2025-07-20', '2025-08-02', 13, 100, '2025-07-20', '2025-07-20', '2025-08-02', 13, true, 'High', 104),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Foundation Work', 'Completed', '2025-08-03', '2025-08-25', 22, 100, '2025-08-03', '2025-08-03', '2025-08-25', 22, true, 'Critical', 176),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Frame Construction', 'In Progress', '2025-08-26', '2025-09-20', 25, 75, '2025-08-26', '2025-08-26', '2025-09-20', 25, true, 'High', 200),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Roofing & Siding', 'Planned', '2025-09-21', '2025-10-18', 27, 0, null, '2025-09-21', '2025-10-18', 27, true, 'High', 216),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Windows & Doors', 'Planned', '2025-10-19', '2025-11-05', 17, 0, null, '2025-10-19', '2025-11-05', 17, false, 'Medium', 136),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'MEP Installation', 'Planned', '2025-11-06', '2025-11-28', 22, 0, null, '2025-11-06', '2025-11-28', 22, false, 'Medium', 176),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Interior Finishing', 'Planned', '2025-11-29', '2025-12-30', 31, 0, null, '2025-11-29', '2025-12-30', 31, false, 'Low', 248),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Final Inspection', 'Planned', '2025-12-31', '2026-01-05', 5, 0, null, '2025-12-31', '2026-01-05', 5, true, 'Critical', 20),

-- Patel Modern Barndo phases
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Site Preparation', 'Planned', '2025-08-22', '2025-09-05', 14, 0, null, '2025-08-22', '2025-09-05', 14, true, 'High', 112),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Foundation Work', 'Planned', '2025-09-06', '2025-09-28', 22, 0, null, '2025-09-06', '2025-09-28', 22, true, 'Critical', 176),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Steel Frame Assembly', 'Planned', '2025-09-29', '2025-10-25', 26, 0, null, '2025-09-29', '2025-10-25', 26, true, 'High', 208),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Modern Roofing System', 'Planned', '2025-10-26', '2025-11-20', 25, 0, null, '2025-10-26', '2025-11-20', 25, true, 'High', 200),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Exterior Cladding', 'Planned', '2025-11-21', '2025-12-15', 24, 0, null, '2025-11-21', '2025-12-15', 24, false, 'Medium', 192),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Smart Home Systems', 'Planned', '2025-12-16', '2026-01-10', 25, 0, null, '2025-12-16', '2026-01-10', 25, false, 'Medium', 200),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Interior Design Build', 'Planned', '2026-01-11', '2026-02-20', 40, 0, null, '2026-01-11', '2026-02-20', 40, false, 'Low', 320),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Final Systems Testing', 'Planned', '2026-02-21', '2026-02-28', 7, 0, null, '2026-02-21', '2026-02-28', 7, true, 'Critical', 28),

-- Wright Lake Barndo phases
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Lakefront Site Prep', 'Completed', '2025-07-28', '2025-08-12', 15, 100, '2025-07-28', '2025-07-28', '2025-08-12', 15, true, 'High', 120),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Foundation & Waterproofing', 'Completed', '2025-08-13', '2025-09-05', 23, 100, '2025-08-13', '2025-08-13', '2025-09-05', 23, true, 'Critical', 184),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Frame Construction', 'In Progress', '2025-09-06', '2025-10-05', 29, 80, '2025-09-06', '2025-09-06', '2025-10-05', 29, true, 'High', 232),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Roofing & Weather Barrier', 'In Progress', '2025-10-06', '2025-10-28', 22, 20, '2025-10-06', '2025-10-06', '2025-10-28', 22, true, 'High', 176),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Lakeside Windows Install', 'Planned', '2025-10-29', '2025-11-15', 17, 0, null, '2025-10-29', '2025-11-15', 17, false, 'Medium', 136),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'MEP Rough-In', 'Planned', '2025-11-16', '2025-12-10', 24, 0, null, '2025-11-16', '2025-12-10', 24, false, 'Medium', 192),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Interior & Lake Views', 'Planned', '2025-12-11', '2026-01-25', 45, 0, null, '2025-12-11', '2026-01-25', 45, false, 'Low', 360),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Final & Landscape', 'Planned', '2026-01-26', '2026-02-15', 20, 0, null, '2026-01-26', '2026-02-15', 20, true, 'Critical', 80);

-- Insert some project milestones for better visualization
INSERT INTO project_milestones (
    project_id,
    milestone_name,
    milestone_type,
    target_date,
    is_critical,
    color,
    completion_percentage
) VALUES
-- Harper Barndo milestones
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Foundation Complete', 'delivery', '2025-09-15', true, '#22c55e', 60),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Framing Complete', 'delivery', '2025-10-15', true, '#3b82f6', 0),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Dried-In Complete', 'delivery', '2025-11-15', true, '#f59e0b', 0),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Project Handover', 'delivery', '2026-01-30', true, '#ef4444', 0),

-- Ramsey Shop+Home milestones
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Foundation Complete', 'delivery', '2025-09-10', true, '#22c55e', 45),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Shop Frame Complete', 'delivery', '2025-10-05', true, '#3b82f6', 0),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Home Frame Complete', 'delivery', '2025-11-10', true, '#3b82f6', 0),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Project Completion', 'delivery', '2026-02-28', true, '#ef4444', 0),

-- Bennett Farmhouse milestones
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Foundation Complete', 'delivery', '2025-08-25', true, '#22c55e', 100),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Framing Complete', 'delivery', '2025-09-20', true, '#3b82f6', 75),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Weather Tight', 'delivery', '2025-10-18', true, '#f59e0b', 0),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Final Delivery', 'delivery', '2026-01-05', true, '#ef4444', 0),

-- Wright Lake milestones
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Foundation Complete', 'delivery', '2025-09-05', true, '#22c55e', 100),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Framing Complete', 'delivery', '2025-10-05', true, '#3b82f6', 80),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Weather Protection', 'delivery', '2025-10-28', true, '#f59e0b', 20),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Project Handover', 'delivery', '2026-02-15', true, '#ef4444', 0);

-- Insert some phase dependencies to show relationships
INSERT INTO phase_dependencies (
    project_id,
    predecessor_phase_id,
    successor_phase_id,
    type,
    lag_days
) 
SELECT 
    p1.project_id,
    p1.id as predecessor_phase_id,
    p2.id as successor_phase_id,
    'FS' as type,
    0 as lag_days
FROM project_phases p1
JOIN project_phases p2 ON p1.project_id = p2.project_id 
WHERE p1.name = 'Site Preparation' AND p2.name = 'Foundation Work'

UNION ALL

SELECT 
    p1.project_id,
    p1.id as predecessor_phase_id,
    p2.id as successor_phase_id,
    'FS' as type,
    0 as lag_days
FROM project_phases p1
JOIN project_phases p2 ON p1.project_id = p2.project_id 
WHERE p1.name = 'Foundation Work' AND p2.name LIKE '%Frame%'

UNION ALL

SELECT 
    p1.project_id,
    p1.id as predecessor_phase_id,
    p2.id as successor_phase_id,
    'FS' as type,
    -14 as lag_days  -- MEP can start 2 weeks before frame completion
FROM project_phases p1
JOIN project_phases p2 ON p1.project_id = p2.project_id 
WHERE p1.name LIKE '%Frame%' AND p2.name LIKE '%MEP%';