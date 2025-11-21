-- Create auth user for customer portal testing
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'dcoblentz@gmail.com',
  crypt('Password', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Nick Fulford"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the user ID and update the customer record
WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'dcoblentz@gmail.com'
)
UPDATE customers 
SET user_id = (SELECT id FROM new_user),
    signed_up_at = NOW()
WHERE id = '78cb01c4-9f07-4443-b03f-63e8f7783e21';