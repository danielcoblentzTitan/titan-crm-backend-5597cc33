-- Create auth user for Kyle Coblentz
-- Note: We'll use a different approach since we can't directly insert into auth.users
-- Instead, we'll create the profile and then link it when Kyle signs up

-- First, let's create a profiles entry for Kyle
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid, -- Temporary UUID that will be replaced when Kyle signs up
    'kyle@titanbuildings.com',
    'Kyle Coblentz',
    'builder',
    now(),
    now()
);

-- Update the team_members table to reference this profile
-- We'll set a placeholder user_id that can be updated when Kyle actually signs up
UPDATE team_members 
SET user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
WHERE email = 'kyle@titanbuildings.com' AND name = 'Kyle Coblentz';

-- Create a function to handle Kyle's signup when he first logs in
CREATE OR REPLACE FUNCTION public.handle_kyle_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if this is Kyle's email
  IF NEW.email = 'kyle@titanbuildings.com' THEN
    -- Update the existing profile with the real auth user ID
    UPDATE public.profiles 
    SET id = NEW.id 
    WHERE email = 'kyle@titanbuildings.com';
    
    -- Update the team_members table with the real user ID
    UPDATE public.team_members 
    SET user_id = NEW.id 
    WHERE email = 'kyle@titanbuildings.com';
    
    -- Insert into profiles if it doesn't exist (fallback)
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      'Kyle Coblentz',
      'builder'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  ELSE
    -- For other users, use the standard profile creation
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the existing trigger if it exists and create the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_kyle_signup();