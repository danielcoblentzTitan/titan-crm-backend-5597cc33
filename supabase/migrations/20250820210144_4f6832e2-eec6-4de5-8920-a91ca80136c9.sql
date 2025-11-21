-- Update Draw 4 invoice number to remove extra description
UPDATE invoices 
SET invoice_number = 'Fulford - Draw 4'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number ILIKE '%draw 4%';