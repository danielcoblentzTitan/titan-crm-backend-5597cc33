-- Create a function to handle new user role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get the role from user metadata, default to 'client' if not specified
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::text,
    'client'
  );
  
  -- Map 'builder' to 'builder_admin'
  IF user_role = 'builder' THEN
    user_role := 'builder_admin';
  ELSIF user_role = 'customer' THEN
    user_role := 'client';
  END IF;
  
  -- Insert the role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();