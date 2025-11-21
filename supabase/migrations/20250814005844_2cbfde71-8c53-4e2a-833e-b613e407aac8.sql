-- Create a function to handle Kyle's signup and any other user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if this is Kyle's email and update team_members
  IF NEW.email = 'kyle@titanbuildings.com' THEN
    -- Update the team_members table with the real user ID
    UPDATE public.team_members 
    SET user_id = NEW.id 
    WHERE email = 'kyle@titanbuildings.com' AND name = 'Kyle Coblentz';
    
    -- Insert Kyle's profile with builder role
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      'Kyle Coblentz',
      'builder'
    );
  ELSE
    -- For other users, use the standard profile creation
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the existing trigger if it exists and create the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();