-- Insert mock customers for completed projects
INSERT INTO public.customers (id, name, email, phone, address, city, state, zip, notes, created_at, updated_at) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'Robert Wilson',
  'robert.wilson@email.com',
  '(555) 234-5678',
  '987 Oak Valley Road',
  'Houston',
  'TX',
  '77001',
  'Completed barndominium project - excellent customer',
  NOW() - INTERVAL '6 months',
  NOW() - INTERVAL '6 months'
),
(
  'b2c3d4e5-f6g7-8901-bcde-f23456789012'::uuid,
  'Jennifer Martinez',
  'jennifer.martinez@email.com',
  '(555) 345-6789',
  '456 Pine Creek Drive',
  'Dallas',
  'TX',
  '75201',
  'Completed workshop and residence project - very satisfied',
  NOW() - INTERVAL '8 months',
  NOW() - INTERVAL '8 months'
);

-- Insert 2 completed projects
INSERT INTO public.projects (
  id,
  name,
  customer_id,
  customer_name,
  status,
  progress,
  start_date,
  estimated_completion,
  end_date,
  budget,
  description,
  address,
  city,
  state,
  zip,
  phase,
  created_at,
  updated_at
) VALUES
(
  'c3d4e5f6-g7h8-9012-cdef-345678901234'::uuid,
  'Wilson Family Barndominium',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'Robert Wilson',
  'Completed',
  100,
  (CURRENT_DATE - INTERVAL '5 months')::date,
  (CURRENT_DATE - INTERVAL '1 month')::date,
  (CURRENT_DATE - INTERVAL '2 weeks')::date,
  195000,
  'Custom 50x80 barndominium with living quarters, workshop space, and attached garage. Featured modern amenities and energy-efficient design.',
  '987 Oak Valley Road',
  'Houston',
  'TX',
  '77001',
  'Project Complete',
  NOW() - INTERVAL '5 months',
  NOW() - INTERVAL '2 weeks'
),
(
  'd4e5f6g7-h8i9-0123-defg-456789012345'::uuid,
  'Martinez Workshop & Residence',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012'::uuid,
  'Jennifer Martinez',
  'Completed',
  100,
  (CURRENT_DATE - INTERVAL '7 months')::date,
  (CURRENT_DATE - INTERVAL '2 months')::date,
  (CURRENT_DATE - INTERVAL '3 weeks')::date,
  165000,
  'Multi-purpose 40x60 barndominium combining workshop space for business operations with comfortable living quarters.',
  '456 Pine Creek Drive',
  'Dallas',
  'TX',
  '75201',
  'Project Complete',
  NOW() - INTERVAL '7 months',
  NOW() - INTERVAL '3 weeks'
);

-- Add some recent activities for the completed projects
INSERT INTO public.activities (
  project_id,
  project_name,
  title,
  description,
  type,
  status,
  time,
  created_at
) VALUES
(
  'c3d4e5f6-g7h8-9012-cdef-345678901234'::uuid,
  'Wilson Family Barndominium',
  'Project Completion',
  'Final walkthrough completed and keys handed over to customer',
  'milestone',
  'completed',
  (NOW() - INTERVAL '2 weeks')::text,
  NOW() - INTERVAL '2 weeks'
),
(
  'c3d4e5f6-g7h8-9012-cdef-345678901234'::uuid,
  'Wilson Family Barndominium',
  'Final Inspection Passed',
  'All final inspections completed successfully',
  'inspection',
  'completed',
  (NOW() - INTERVAL '3 weeks')::text,
  NOW() - INTERVAL '3 weeks'
),
(
  'd4e5f6g7-h8i9-0123-defg-456789012345'::uuid,
  'Martinez Workshop & Residence',
  'Project Completion',
  'Customer satisfaction survey completed - 5 stars rating',
  'milestone',
  'completed',
  (NOW() - INTERVAL '3 weeks')::text,
  NOW() - INTERVAL '3 weeks'
),
(
  'd4e5f6g7-h8i9-0123-defg-456789012345'::uuid,
  'Martinez Workshop & Residence',
  'Final Payment Received',
  'All payments completed and project officially closed',
  'financial',
  'completed',
  (NOW() - INTERVAL '4 weeks')::text,
  NOW() - INTERVAL '4 weeks'
);