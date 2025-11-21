-- Update Draw 5 invoice number to remove extra description and set correct due date
-- Draw 5 should be due 1 day before insulation starts (2025-10-14), so 2025-10-13
UPDATE invoices 
SET invoice_number = 'Fulford - Draw 5',
    due_date = '2025-10-13'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number ILIKE '%draw 5%';