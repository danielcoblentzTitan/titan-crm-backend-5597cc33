-- Remove dangerous public read policies that expose sensitive data
-- Only drop policies that exist and create missing secure ones

-- Drop the dangerous public read policy on users table
DROP POLICY IF EXISTS "Public read access to users" ON public.users;

-- Drop the dangerous public read policy on team_members table  
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;

-- Drop the dangerous public read policy on projects_new table
DROP POLICY IF EXISTS "Public read access for testing projects" ON public.projects_new;

-- Drop the dangerous public read policy on phases_new table (if it exists)
DROP POLICY IF EXISTS "Public read access to phases" ON public.phases_new;

-- Create secure policies for users table (only if they don't exist)
DO $$ 
BEGIN
  -- Check and create builders policy for users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Builders can view all users'
  ) THEN
    EXECUTE 'CREATE POLICY "Builders can view all users" 
    ON public.users FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = ''builder''
    ))';
  END IF;

  -- Check and create self-view policy for users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own profile" 
    ON public.users FOR SELECT 
    USING (id = auth.uid())';
  END IF;

  -- Check and create builders policy for projects_new (only if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects_new' 
    AND policyname = 'Builders can view all projects_new'
  ) THEN
    EXECUTE 'CREATE POLICY "Builders can view all projects_new" 
    ON public.projects_new FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = ''builder''
    ))';
  END IF;
END $$;