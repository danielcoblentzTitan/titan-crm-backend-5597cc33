-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own record" ON public.users;

-- Create a security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Direct query without RLS to avoid recursion
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new safe policies using the function
CREATE POLICY "Admin can manage all users" ON public.users FOR ALL USING (
  public.get_current_user_role() = 'Admin'
);

CREATE POLICY "Users can view their own record" ON public.users FOR SELECT USING (
  id = auth.uid()
);

-- Also fix similar potential issues in other tables
DROP POLICY IF EXISTS "Admin can manage all projects" ON public.projects_new;
DROP POLICY IF EXISTS "Admin can manage all phases" ON public.phases_new;
DROP POLICY IF EXISTS "Admin can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can manage weather snapshots" ON public.weather_snapshots;

CREATE POLICY "Admin can manage all projects" ON public.projects_new FOR ALL USING (
  public.get_current_user_role() = 'Admin'
);

CREATE POLICY "Admin can manage all phases" ON public.phases_new FOR ALL USING (
  public.get_current_user_role() = 'Admin'
);

CREATE POLICY "Admin can manage all tasks" ON public.tasks FOR ALL USING (
  public.get_current_user_role() = 'Admin'
);

CREATE POLICY "Admin can manage weather snapshots" ON public.weather_snapshots FOR ALL USING (
  public.get_current_user_role() = 'Admin'
);