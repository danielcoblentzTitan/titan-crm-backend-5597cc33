-- Drop the remaining overly permissive policy that wasn't properly removed
DROP POLICY IF EXISTS "Public can view projects for customer portal" ON public.projects;