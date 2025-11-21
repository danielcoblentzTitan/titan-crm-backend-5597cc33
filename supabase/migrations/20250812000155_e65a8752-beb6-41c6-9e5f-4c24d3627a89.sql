-- Insert sample project phases for testing the sophisticated Gantt chart
-- Using the correct project IDs from projects_new table

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
-- Harper Barndo phases (TB-2508-001)
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Site Preparation', 'Completed', '2025-08-15', '2025-08-25', 10, 100, '2025-08-15', '2025-08-15', '2025-08-25', 10, true, 'High', 80),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Foundation Work', 'In Progress', '2025-08-26', '2025-09-15', 20, 60, '2025-08-26', '2025-08-26', '2025-09-15', 20, true, 'Critical', 160),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Frame Construction', 'Planned', '2025-09-16', '2025-10-15', 30, 0, null, '2025-09-16', '2025-10-15', 30, true, 'High', 240),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Roofing & Siding', 'Planned', '2025-10-16', '2025-11-15', 30, 0, null, '2025-10-16', '2025-11-15', 30, true, 'High', 200),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Electrical Rough-In', 'Planned', '2025-11-01', '2025-11-20', 20, 0, null, '2025-11-01', '2025-11-20', 20, false, 'Medium', 120),
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Interior Finishing', 'Planned', '2025-12-16', '2026-01-20', 35, 0, null, '2025-12-16', '2026-01-20', 35, false, 'Low', 280),

-- Ramsey Shop+Home phases (TB-2507-014)
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Site Preparation', 'Completed', '2025-08-05', '2025-08-18', 13, 100, '2025-08-05', '2025-08-05', '2025-08-18', 13, true, 'High', 104),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Foundation Work', 'In Progress', '2025-08-19', '2025-09-10', 22, 45, '2025-08-19', '2025-08-19', '2025-09-10', 22, true, 'Critical', 176),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Shop Frame Construction', 'Planned', '2025-09-11', '2025-10-05', 24, 0, null, '2025-09-11', '2025-10-05', 24, true, 'High', 192),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'MEP Rough-In', 'Planned', '2025-12-01', '2025-12-25', 24, 0, null, '2025-12-01', '2025-12-25', 24, false, 'Medium', 200),

-- Bennett Farmhouse Barndo phases (TB-2505-021)  
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Site Preparation', 'Completed', '2025-07-20', '2025-08-02', 13, 100, '2025-07-20', '2025-07-20', '2025-08-02', 13, true, 'High', 104),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Foundation Work', 'Completed', '2025-08-03', '2025-08-25', 22, 100, '2025-08-03', '2025-08-03', '2025-08-25', 22, true, 'Critical', 176),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Frame Construction', 'In Progress', '2025-08-26', '2025-09-20', 25, 75, '2025-08-26', '2025-08-26', '2025-09-20', 25, true, 'High', 200),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Roofing & Siding', 'Planned', '2025-09-21', '2025-10-18', 27, 0, null, '2025-09-21', '2025-10-18', 27, true, 'High', 216),

-- Patel Modern Barndo phases (TB-2508-004)
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Site Preparation', 'Planned', '2025-08-22', '2025-09-05', 14, 0, null, '2025-08-22', '2025-09-05', 14, true, 'High', 112),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Foundation Work', 'Planned', '2025-09-06', '2025-09-28', 22, 0, null, '2025-09-06', '2025-09-28', 22, true, 'Critical', 176),
('c1160460-713d-40ab-a3e1-c5a4dd9395b8', 'Steel Frame Assembly', 'Planned', '2025-09-29', '2025-10-25', 26, 0, null, '2025-09-29', '2025-10-25', 26, true, 'High', 208),

-- Wright Lake Barndo phases (TB-2507-006)
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Lakefront Site Prep', 'Completed', '2025-07-28', '2025-08-12', 15, 100, '2025-07-28', '2025-07-28', '2025-08-12', 15, true, 'High', 120),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Foundation & Waterproofing', 'Completed', '2025-08-13', '2025-09-05', 23, 100, '2025-08-13', '2025-08-13', '2025-09-05', 23, true, 'Critical', 184),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Frame Construction', 'In Progress', '2025-09-06', '2025-10-05', 29, 80, '2025-09-06', '2025-09-06', '2025-10-05', 29, true, 'High', 232),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Roofing & Weather Barrier', 'In Progress', '2025-10-06', '2025-10-28', 22, 20, '2025-10-06', '2025-10-06', '2025-10-28', 22, true, 'High', 176);

-- Insert matching milestones
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
('8df50e69-3135-4f69-8391-a61bb4ac6bf7', 'Project Handover', 'delivery', '2026-01-30', true, '#ef4444', 0),

-- Ramsey Shop+Home milestones
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Foundation Complete', 'delivery', '2025-09-10', true, '#22c55e', 45),
('cc837a95-48ed-4577-a708-97f4a6349d91', 'Shop Frame Complete', 'delivery', '2025-10-05', true, '#3b82f6', 0),

-- Bennett Farmhouse milestones
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Foundation Complete', 'delivery', '2025-08-25', true, '#22c55e', 100),
('64b2249b-44a2-4ecb-b2d1-1a69ca55b3c7', 'Framing Complete', 'delivery', '2025-09-20', true, '#3b82f6', 75),

-- Wright Lake milestones
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Foundation Complete', 'delivery', '2025-09-05', true, '#22c55e', 100),
('b0f9e5f9-c961-413e-812e-2b12a3c7dc6e', 'Framing Complete', 'delivery', '2025-10-05', true, '#3b82f6', 80);