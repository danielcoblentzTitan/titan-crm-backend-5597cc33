-- Update invoice naming to avoid confusion
-- Rename contract signing to "Deposit" and shift invoice numbers to match draw schedule

-- Update the contract signing invoice to be "Deposit"
UPDATE invoices 
SET invoice_number = 'Fulford - Deposit'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 1';

-- Update all other invoices to shift numbers down to match draw schedule
UPDATE invoices 
SET invoice_number = 'Fulford - Invoice 1'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 2';

UPDATE invoices 
SET invoice_number = 'Fulford - Invoice 2'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 3';

UPDATE invoices 
SET invoice_number = 'Fulford - Invoice 3'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 4';

UPDATE invoices 
SET invoice_number = 'Fulford - Invoice 4'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 5';

UPDATE invoices 
SET invoice_number = 'Fulford - Invoice 5'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 6';

UPDATE invoices 
SET invoice_number = 'Fulford - Invoice 6'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 7';

UPDATE invoices 
SET invoice_number = 'Fulford - Invoice 7'
WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' 
AND invoice_number = 'Fulford - Invoice 8';