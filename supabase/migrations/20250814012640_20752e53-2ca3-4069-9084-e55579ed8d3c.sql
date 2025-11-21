-- Fix the infinite recursion issue in team_members RLS policies
-- First, let's create a security definer function to check admin role

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.auth_user_id = auth.uid() 
    AND 'admin' = ANY(tm.roles)
  );
END;
$$;

-- Drop and recreate the policies to fix recursion
DROP POLICY IF EXISTS "Team members can read own data" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

-- Create safe RLS policies
CREATE POLICY "Team members can read own data" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() = auth_user_id);

-- Policy for admin users - using security definer function
CREATE POLICY "Admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (public.is_admin());

-- Allow public read access for team member auth during signup
CREATE POLICY "Public can read team members for auth setup" 
ON public.team_members 
FOR SELECT 
USING (true);