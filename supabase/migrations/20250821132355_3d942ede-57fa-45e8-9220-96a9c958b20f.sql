-- Insert the real Fulford project into projects_new table
INSERT INTO projects_new (
  id,
  code,
  name,
  status,
  city,
  state,
  zip,
  size_sqft,
  pm_user_id,
  start_target,
  finish_target,
  latitude,
  longitude,
  notes
) VALUES (
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'TB-FULFORD-001',
  'Nick and Rachael Fulford - Barndominium',
  'Active',
  'Georgetown',
  'DE',
  '19947',
  2800,
  '363276b6-efb0-48e1-9542-4f0978307421', -- Using existing PM from mock data
  '2025-08-07',
  '2026-02-27',
  38.6901,
  -75.3855,
  'Real Fulford project - Barndominium construction'
);

-- Create phases for the Fulford project based on the schedule data
INSERT INTO project_phases (
  project_id,
  name,
  start_date,
  end_date,
  duration_days,
  status,
  color,
  publish_to_customer,
  priority,
  completion_percentage
) VALUES 
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Framing Crew', '2025-08-07', '2025-08-29', 17, 'Planned', '#ef4444', true, 'High', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Plumbing Underground', '2025-09-02', '2025-09-08', 5, 'Planned', '#3b82f6', true, 'High', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Concrete Crew', '2025-09-09', '2025-09-19', 9, 'Planned', '#6b7280', true, 'High', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Interior Framing', '2025-09-22', '2025-10-03', 10, 'Planned', '#f59e0b', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Plumbing Rough In', '2025-10-06', '2025-10-10', 5, 'Planned', '#3b82f6', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'HVAC Rough In', '2025-10-13', '2025-10-17', 5, 'Planned', '#10b981', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Electric Rough In', '2025-10-20', '2025-10-24', 5, 'Planned', '#fbbf24', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Insulation', '2025-10-27', '2025-10-31', 5, 'Planned', '#8b5cf6', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Drywall', '2025-11-03', '2025-11-21', 15, 'Planned', '#4b5563', true, 'High', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Paint', '2025-11-24', '2025-11-26', 3, 'Planned', '#ec4899', true, 'Low', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Flooring', '2025-12-01', '2025-12-05', 5, 'Planned', '#92400e', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Kitchen Install', '2025-12-08', '2025-12-12', 5, 'Planned', '#f97316', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Doors and Trim', '2025-12-15', '2025-12-19', 5, 'Planned', '#059669', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Garage Doors and Gutters', '2025-12-22', '2025-12-23', 2, 'Planned', '#dc2626', true, 'Low', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Garage Finish', '2025-12-29', '2025-12-29', 1, 'Planned', '#7c3aed', true, 'Low', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Plumbing Final', '2025-12-30', '2026-01-06', 5, 'Planned', '#3b82f6', true, 'High', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'HVAC Final', '2026-01-07', '2026-01-13', 5, 'Planned', '#10b981', true, 'High', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Electric Final', '2026-01-14', '2026-01-23', 8, 'Planned', '#fbbf24', true, 'High', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Interior Finishes', '2026-01-26', '2026-02-06', 10, 'Planned', '#06b6d4', true, 'Medium', 0),
('c0d89370-cdfa-4cd8-9ecf-2eb2413429ea', 'Final', '2026-02-09', '2026-02-27', 15, 'Planned', '#65a30d', true, 'High', 0);