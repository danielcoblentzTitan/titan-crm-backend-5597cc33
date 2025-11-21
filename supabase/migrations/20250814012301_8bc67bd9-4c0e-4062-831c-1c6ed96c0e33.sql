-- First, let's check if we need to create auth users for existing team members
-- We'll create a function to help with team member authentication

-- Create or update the team members table to ensure proper structure
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create a function to handle team member sign up
CREATE OR REPLACE FUNCTION public.create_team_member_auth_user(
  member_email TEXT,
  member_password TEXT,
  member_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Create auth user (this would normally be done through Supabase Auth API)
  -- For now, we'll return the team member ID and handle auth creation separately
  RETURN team_member_record.id;
END;
$$;

-- Create RLS policies for team_members if they don't exist
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policy to allow team members to read their own data
CREATE POLICY IF NOT EXISTS "Team members can read own data" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() = auth_user_id);

-- Policy to allow admins to manage team members
CREATE POLICY IF NOT EXISTS "Admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.auth_user_id = auth.uid() 
    AND 'admin' = ANY(tm.roles)
  )
);

-- Create a view for team member authentication
CREATE OR REPLACE VIEW public.team_member_auth AS
SELECT 
  tm.id,
  tm.name,
  tm.email,
  tm.roles,
  tm.is_active,
  tm.auth_user_id,
  CASE 
    WHEN tm.auth_user_id IS NOT NULL THEN 'has_auth'
    ELSE 'needs_auth'
  END as auth_status
FROM public.team_members tm
WHERE tm.is_active = true;