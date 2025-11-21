-- Update deposit invoice to show as paid and remove due date
-- Since deposit is paid prior to generating other invoices

UPDATE invoices 
SET status = 'Paid',
    due_date = NULL
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Deposit';