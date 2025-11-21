-- Phase 1: Database Schema Enhancements

-- 1.1 Enhance projects table with missing fields
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS lot_size numeric,
ADD COLUMN IF NOT EXISTS house_sq_ft numeric,
ADD COLUMN IF NOT EXISTS garage_sq_ft numeric,
ADD COLUMN IF NOT EXISTS bedrooms integer,
ADD COLUMN IF NOT EXISTS bathrooms numeric,
ADD COLUMN IF NOT EXISTS stories integer,
ADD COLUMN IF NOT EXISTS wall_height numeric,
ADD COLUMN IF NOT EXISTS build_type text;

-- 1.2 Create function to auto-generate project numbers
CREATE OR REPLACE FUNCTION public.generate_project_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_number integer;
  next_number integer;
BEGIN
  -- Extract the highest number from existing project_number values
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN project_number ~ '^TITAN-[0-9]+$' 
        THEN CAST(SUBSTRING(project_number FROM 7) AS integer)
        ELSE 0
      END
    ), 0
  ) INTO max_number
  FROM public.projects;
  
  next_number := max_number + 1;
  
  RETURN 'TITAN-' || LPAD(next_number::text, 4, '0');
END;
$$;

-- 1.3 Create trigger to auto-generate project_number on insert if not provided
CREATE OR REPLACE FUNCTION public.set_project_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.project_number IS NULL OR NEW.project_number = '' THEN
    NEW.project_number := public.generate_project_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_project_number_trigger ON public.projects;
CREATE TRIGGER set_project_number_trigger
BEFORE INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_project_number();

-- 1.4 Seed initial admin user role
-- First, we need to ensure there's a user in auth.users
-- This will be done manually by the user logging in for the first time
-- But we'll create a helper function to assign the admin role

CREATE OR REPLACE FUNCTION public.ensure_admin_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NOT NULL THEN
    -- Insert admin role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'builder_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;