-- Update invoice notes and dates to match draw schedule
-- Remove issued dates for all, update due dates to match project schedule, simplify notes

-- Update Deposit invoice
UPDATE invoices 
SET notes = 'Contract Signing - $3,000',
    issue_date = NULL,
    due_date = NULL
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Deposit';

-- Update Invoice 1 (Draw 1 - 20%)
UPDATE invoices 
SET notes = 'Draw 1 (20%) - Lumber Delivery',
    issue_date = NULL,
    due_date = '2025-07-31'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 1';

-- Update Invoice 2 (Draw 2 - 20%)
UPDATE invoices 
SET notes = 'Draw 2 (20%) - Permit Approved',
    issue_date = NULL,
    due_date = '2025-08-07'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 2';

-- Update Invoice 3 (Draw 3 - 15%)
UPDATE invoices 
SET notes = 'Draw 3 (15%) - Trusses Set',
    issue_date = NULL,
    due_date = '2025-08-11'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 3';

-- Update Invoice 4 (Draw 4 - 15%)
UPDATE invoices 
SET notes = 'Draw 4 (15%) - Dried-In',
    issue_date = NULL,
    due_date = '2025-08-21'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 4';

-- Update Invoice 5 (Draw 5 - 15%)
UPDATE invoices 
SET notes = 'Draw 5 (15%) - Rough-Ins Complete',
    issue_date = NULL,
    due_date = '2025-10-09'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 5';

-- Update Invoice 6 (Draw 6 - 10%)
UPDATE invoices 
SET notes = 'Draw 6 (10%) - Drywall Installed',
    issue_date = NULL,
    due_date = '2025-10-23'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 6';

-- Update Invoice 7 (Draw 7 - 5%)
UPDATE invoices 
SET notes = 'Draw 7 (5%) - Certificate of Occupancy',
    issue_date = NULL,
    due_date = '2026-01-14'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 7';