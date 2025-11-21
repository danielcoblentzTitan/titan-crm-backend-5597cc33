-- Add the current user to the users table
INSERT INTO public.users (name, email, role) 
VALUES ('Daniel Coblentz', 'daniel@buildatitan.com', 'Admin')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;