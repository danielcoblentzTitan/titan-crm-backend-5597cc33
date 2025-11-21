-- Standardize Fulford’s invoice naming for 6 and 7
-- Project: Nick and Rachael Fulford - Barndominium Project
-- project_id: c0d89370-cdfa-4cd8-9ecf-2eb2413429ea

BEGIN;

-- Rename Invoice 6 -> Draw 6 (no due date change)
UPDATE public.invoices
SET invoice_number = 'Fulford - Draw 6'
WHERE id = '29dccd92-c7ba-46f3-935e-e28a82db5d1f';

-- Rename Invoice 7 -> Draw 7 (no due date change)
UPDATE public.invoices
SET invoice_number = 'Fulford - Draw 7'
WHERE id = '556c5db3-193a-4165-9dc4-a73ad83b0d22';

COMMIT;
