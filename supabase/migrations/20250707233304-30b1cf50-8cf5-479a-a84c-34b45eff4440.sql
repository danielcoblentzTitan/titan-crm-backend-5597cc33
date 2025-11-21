-- Add DELETE policies for leads table
CREATE POLICY "Builders can delete all leads" 
ON public.leads 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'builder'
  )
);

CREATE POLICY "Team members can delete their assigned leads" 
ON public.leads 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM team_members
    WHERE team_members.user_id = auth.uid() 
    AND team_members.id = leads.assigned_to
  )
);