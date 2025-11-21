-- First, add the customer_portal_enabled column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS customer_portal_enabled BOOLEAN DEFAULT true;

-- Enable customer portal for all existing projects
UPDATE public.projects SET customer_portal_enabled = true WHERE customer_portal_enabled IS NULL;

-- Now create the secure customer portal access policy
CREATE POLICY "Customer portal public access" 
ON public.projects 
FOR SELECT 
USING (
  -- Allow if customer portal is enabled for this project
  COALESCE(customer_portal_enabled, false) = true
  OR 
  -- Or if user is authenticated and has proper access
  (auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder') OR
    EXISTS (SELECT 1 FROM customers WHERE customers.id = projects.customer_id AND customers.user_id = auth.uid())
  ))
);