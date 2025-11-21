-- Add policy to allow public read access to projects for customer portal
CREATE POLICY "Public can view projects for customer portal" 
ON public.projects 
FOR SELECT 
USING (true);

-- Also add policy for projects_new table if it's being used
CREATE POLICY "Public can view projects_new for customer portal" 
ON public.projects_new 
FOR SELECT 
USING (true);