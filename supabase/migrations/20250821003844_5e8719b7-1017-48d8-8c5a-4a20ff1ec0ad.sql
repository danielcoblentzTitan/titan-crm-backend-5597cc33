-- Remove dangerous public read policies that expose sensitive data

-- Drop the public read policy on users table
DROP POLICY IF EXISTS "Public read access to users" ON public.users;

-- Drop the public read policy on team_members table  
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;

-- Drop the public read policy on projects_new table
DROP POLICY IF EXISTS "Public read access for testing projects" ON public.projects_new;

-- Drop the public read policy on phases_new table (if it exists)
DROP POLICY IF EXISTS "Public read access to phases" ON public.phases_new;

-- Create proper role-based policies for users table
CREATE POLICY "Builders can view all users" 
ON public.users FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'builder'
));

CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (id = auth.uid());

-- Create proper role-based policies for team_members table
CREATE POLICY "Builders can view all team members" 
ON public.team_members FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'builder'
));

-- Create proper role-based policies for projects_new table
CREATE POLICY "Builders can view all projects_new" 
ON public.projects_new FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'builder'
));

CREATE POLICY "PM can view assigned projects_new" 
ON public.projects_new FOR SELECT 
USING (pm_user_id = auth.uid());

-- Create proper role-based policies for phases_new table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'phases_new') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public read access to phases" ON public.phases_new';
    
    EXECUTE 'CREATE POLICY "Builders can view all phases_new" 
    ON public.phases_new FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = ''builder''
    ))';
  END IF;
END $$;