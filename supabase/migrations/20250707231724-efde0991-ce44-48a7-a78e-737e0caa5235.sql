-- Enable RLS on estimates table
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

-- Create policy for builders to manage all estimates
CREATE POLICY "Builders can manage all estimates" 
ON public.estimates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'builder'
  )
);

-- Create policy for team members to view estimates for their assigned leads
CREATE POLICY "Team members can view estimates for their assigned leads" 
ON public.estimates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM leads l
    JOIN team_members tm ON tm.id = l.assigned_to
    WHERE l.id = estimates.lead_id 
    AND tm.user_id = auth.uid()
  )
);