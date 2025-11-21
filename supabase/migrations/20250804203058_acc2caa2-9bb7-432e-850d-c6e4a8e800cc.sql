-- Add contract signing invoice for $3,000
-- First, find the correct customer_id for this project
UPDATE invoices 
SET notes = 'Draw 0: Contract Signing - $3,000 payment for all buildings', 
    total = 3000.00,
    invoice_number = 'INV-000-2025'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'INV-001-2025';

-- Insert the new contract signing invoice as the first invoice
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
) VALUES (
  (SELECT customer_id FROM projects WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'),
  'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea',
  'INV-001-2025',
  'Nick and Rachael Fulford',
  'Nick and Rachael Fulford - Barndominium Project',
  '2025-07-24',
  '2025-07-24',
  113360.00,
  'Draft',
  'Draw 1 (20%): Due 7 days before project start (lumber delivery)'
);