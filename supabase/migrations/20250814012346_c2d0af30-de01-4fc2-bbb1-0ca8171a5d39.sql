-- Create or update the team members table to ensure proper structure
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'team_members_auth_user_id_fkey'
    ) THEN
        ALTER TABLE public.team_members 
        ADD CONSTRAINT team_members_auth_user_id_fkey 
        FOREIGN KEY (auth_user_id) REFERENCES auth.users(id);
    END IF;
END $$;

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
  
  -- Return the team member ID for now
  RETURN team_member_record.id;
END;
$$;

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members can read own data" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

-- Create RLS policies for team_members
CREATE POLICY "Team members can read own data" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() = auth_user_id);

-- Policy to allow admins to manage team members
CREATE POLICY "Admins can manage team members" 
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
DROP VIEW IF EXISTS public.team_member_auth;
CREATE VIEW public.team_member_auth AS
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