-- Fix invoice numbering to match chronological order
-- Update the invoices so Draw 1 is first chronologically

-- First, delete the existing invoices
DELETE FROM invoices WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea';

-- Create invoices in correct chronological order
INSERT INTO invoices (
  customer_id, 
  project_id, 
  invoice_number, 
  customer_name, 
  project_name, 
  issue_date, 
  due_date, 
  total, 
  status,
  notes
) VALUES 
-- Draw 1 (20%): Due 7 days before project start (lumber delivery) - EARLIEST
(
  (SELECT customer_id FROM projects WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'),
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'INV-001-2025',
  'Nick and Rachael Fulford',
  'Nick and Rachael Fulford - Barndominium Project',
  '2025-07-31',
  '2025-07-31',
  113360.00,
  'Draft',
  'Draw 1 (20%): Due 7 days before project start (lumber delivery)'
),
-- Draw 2 (20%): Due on project start date (permit approved)
(
  (SELECT customer_id FROM projects WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'),
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'INV-002-2025',
  'Nick and Rachael Fulford',
  'Nick and Rachael Fulford - Barndominium Project',
  '2025-08-07',
  '2025-08-07',
  113360.00,
  'Draft',
  'Draw 2 (20%): Due on project start date (permit approved)'
),
-- Draw 3 (15%): Due 4th day of Framing Crew Schedule (trusses set)
(
  (SELECT customer_id FROM projects WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'),
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'INV-003-2025',
  'Nick and Rachael Fulford',
  'Nick and Rachael Fulford - Barndominium Project',
  '2025-08-11',
  '2025-08-11',
  85020.00,
  'Draft',
  'Draw 3 (15%): Due 4th day of Framing Crew Schedule (trusses set)'
),
-- Draw 4 (15%): Due First day of Plumbing Underground (dried-in)
(
  (SELECT customer_id FROM projects WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'),
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'INV-004-2025',
  'Nick and Rachael Fulford',
  'Nick and Rachael Fulford - Barndominium Project',
  '2025-08-21',
  '2025-08-21',
  85020.00,
  'Draft',
  'Draw 4 (15%): Due First day of Plumbing Underground (dried-in)'
),
-- Draw 5 (15%): Due First Day of Insulation (rough-ins complete)
(
  (SELECT customer_id FROM projects WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'),
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'INV-005-2025',
  'Nick and Rachael Fulford',
  'Nick and Rachael Fulford - Barndominium Project',
  '2025-10-09',
  '2025-10-09',
  85020.00,
  'Draft',
  'Draw 5 (15%): Due First Day of Insulation (rough-ins complete)'
),
-- Draw 6 (10%): Due 1 day after drywall schedule completed (drywall installed)
(
  (SELECT customer_id FROM projects WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'),
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'INV-006-2025',
  'Nick and Rachael Fulford',
  'Nick and Rachael Fulford - Barndominium Project',
  '2025-10-23',
  '2025-10-23',
  56680.00,
  'Draft',
  'Draw 6 (10%): Due 1 day after drywall schedule completed (drywall installed)'
),
-- Draw 7 (5%): Due on completion date (certificate of occupancy)
(
  (SELECT customer_id FROM projects WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'),
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'INV-007-2025',
  'Nick and Rachael Fulford',
  'Nick and Rachael Fulford - Barndominium Project',
  '2026-01-14',
  '2026-01-14',
  28340.00,
  'Draft',
  'Draw 7 (5%): Due on completion date (certificate of occupancy)'
);