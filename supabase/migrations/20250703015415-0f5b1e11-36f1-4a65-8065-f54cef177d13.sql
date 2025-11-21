-- Insert mock customers for completed projects
INSERT INTO public.customers (name, email, phone, address, city, state, zip, notes, created_at, updated_at) VALUES
(
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

-- Get the customer IDs and insert completed projects
DO $$
DECLARE
    wilson_id uuid;
    martinez_id uuid;
BEGIN
    -- Get customer IDs
    SELECT id INTO wilson_id FROM customers WHERE name = 'Robert Wilson' AND email = 'robert.wilson@email.com';
    SELECT id INTO martinez_id FROM customers WHERE name = 'Jennifer Martinez' AND email = 'jennifer.martinez@email.com';
    
    -- Insert completed projects
    INSERT INTO public.projects (
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
      'Wilson Family Barndominium',
      wilson_id,
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
      'Martinez Workshop & Residence',
      martinez_id,
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
END $$;