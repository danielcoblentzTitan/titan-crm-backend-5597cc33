-- Update RLS policies to restrict updates to only assigned estimator and original requester

-- Drop existing update policy
DROP POLICY IF EXISTS "Estimators can update assigned requests" ON price_requests;

-- Create new update policy that allows only assigned estimator and original requester
CREATE POLICY "Only estimator and requester can update" 
ON price_requests FOR UPDATE 
USING (
  -- Allow assigned estimator (via team_members)
  (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.id = price_requests.assigned_estimator_id 
    AND team_members.user_id = auth.uid()
  )) OR 
  -- Allow original requester
  (requested_by_user_id = auth.uid()) OR
  -- Allow builders and admins (for administrative purposes)
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('builder', 'admin')
  ))
) WITH CHECK (
  -- Same conditions for WITH CHECK
  (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.id = price_requests.assigned_estimator_id 
    AND team_members.user_id = auth.uid()
  )) OR 
  (requested_by_user_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('builder', 'admin')
  ))
);