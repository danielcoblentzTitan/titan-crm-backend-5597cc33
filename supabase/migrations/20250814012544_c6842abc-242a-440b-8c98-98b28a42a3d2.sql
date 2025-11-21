-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.create_team_member_auth_user(
  member_email TEXT,
  member_password TEXT,
  member_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  team_member_record RECORD;
BEGIN
  -- Check if team member exists
  SELECT * INTO team_member_record 
  FROM public.team_members 
  WHERE email = member_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team member with email % not found', member_email;
  END IF;
  
  -- Check if user already has auth account
  IF team_member_record.auth_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Team member already has an auth account';
  END IF;
  
  -- Return the team member ID for now
  RETURN team_member_record.id;
END;
$$;