-- Create a test customer record linked to the authenticated user
INSERT INTO public.customers (
  id,
  user_id,
  name,
  email,
  phone,
  address,
  city,
  state,
  zip,
  notes
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'dcoblentz@gmail.com' LIMIT 1),
  'David Coblentz',
  'dcoblentz@gmail.com',
  '(555) 123-4567',
  '123 Test Street',
  'Test City',
  'TX',
  '12345',
  'Test customer account for development'
) ON CONFLICT (email) DO NOTHING;

-- Create a test project for the customer
INSERT INTO public.projects (
  id,
  customer_id,
  customer_name,
  name,
  description,
  start_date,
  estimated_completion,
  status,
  phase,
  progress,
  budget,
  address,
  city,
  state,
  zip
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.customers WHERE email = 'dcoblentz@gmail.com' LIMIT 1),
  'David Coblentz',
  'Test Barndominium Project',
  'A test project for design selections and customer portal testing',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '120 days',
  'In Progress',
  'Design Phase',
  25,
  450000.00,
  '123 Test Street',
  'Test City',
  'TX',
  '12345'
) ON CONFLICT DO NOTHING;

-- Create a design selection document for the test project
INSERT INTO public.design_selection_documents (
  id,
  project_id,
  customer_id,
  title,
  current_version_number
) VALUES (
  gen_random_uuid(),
  (SELECT p.id FROM public.projects p 
   JOIN public.customers c ON c.id = p.customer_id 
   WHERE c.email = 'dcoblentz@gmail.com' LIMIT 1),
  (SELECT id FROM public.customers WHERE email = 'dcoblentz@gmail.com' LIMIT 1),
  'Design Selections',
  1
) ON CONFLICT DO NOTHING;