-- Update Draw 4 due date to align with framing end date (Dried-In milestone)
UPDATE invoices 
SET due_date = '2025-08-20' 
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number ILIKE '%draw 4%';