
-- Standardize Fulford’s invoice numbering and due dates
-- Project: Nick and Rachael Fulford - Barndominium Project
-- project_id: c0d89370-cdfa-4cd8-9ecf-2eb2413429ea

BEGIN;

-- 1) Invoice 2 -> Draw 1 (Permit Approved), due on permit approval date
-- id: 63505c54-f485-4579-9c62-40c3162cb1c0
UPDATE public.invoices
SET
  invoice_number = 'Fulford - Draw 1 (Permit Approved)',
  due_date = (
    SELECT permit_approved_at::date
    FROM public.projects
    WHERE id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'
  )
WHERE id = '63505c54-f485-4579-9c62-40c3162cb1c0';

-- 2) Invoice 1 -> Draw 2 (Lumber Delivery) [keep its existing due date]
-- id: 02269651-7208-42a3-a305-a0df4d25a3b3
UPDATE public.invoices
SET invoice_number = 'Fulford - Draw 2 (Lumber Delivery)'
WHERE id = '02269651-7208-42a3-a305-a0df4d25a3b3';

-- 3) Optional: Rename the next draws for clarity (no due date changes here)
-- Invoice 3 -> Draw 3
-- id: 06046ece-f849-439a-8acc-d08afd332a6e
UPDATE public.invoices
SET invoice_number = 'Fulford - Draw 3'
WHERE id = '06046ece-f849-439a-8acc-d08afd332a6e';

-- 4) Optional: Draw 4 (Electric Rough In) with due date from schedule end date
-- id: 0568e43f-4afc-43c2-a3b1-258dbc07e679
UPDATE public.invoices
SET
  invoice_number = 'Fulford - Draw 4 (Electric Rough In)',
  due_date = (
    SELECT (elem->>'endDate')::date
    FROM (
      SELECT schedule_data
      FROM public.project_schedules
      WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'
      ORDER BY created_at DESC
      LIMIT 1
    ) ps,
    LATERAL jsonb_array_elements(ps.schedule_data) elem
    WHERE elem->>'name' = 'Electric Rough In'
    LIMIT 1
  )
WHERE id = '0568e43f-4afc-43c2-a3b1-258dbc07e679';

-- 5) Optional: Draw 5 (Drywall) with due date from schedule end date
-- id: b44b8f2d-4479-4c33-901f-3ba5cfaec8eb
UPDATE public.invoices
SET
  invoice_number = 'Fulford - Draw 5 (Drywall)',
  due_date = (
    SELECT (elem->>'endDate')::date
    FROM (
      SELECT schedule_data
      FROM public.project_schedules
      WHERE project_id = 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea'
      ORDER BY created_at DESC
      LIMIT 1
    ) ps,
    LATERAL jsonb_array_elements(ps.schedule_data) elem
    WHERE elem->>'name' = 'Drywall'
    LIMIT 1
  )
WHERE id = 'b44b8f2d-4479-4c33-901f-3ba5cfaec8eb';

COMMIT;
