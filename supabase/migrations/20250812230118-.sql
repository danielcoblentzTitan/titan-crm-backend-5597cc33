-- Update RLS policies for price_requests to work with new team_members structure and admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Builders can manage all price requests" ON price_requests;
DROP POLICY IF EXISTS "Estimators can update assigned requests" ON price_requests;
DROP POLICY IF EXISTS "Users can create price requests" ON price_requests;
DROP POLICY IF EXISTS "Users can view their own requests or assigned requests" ON price_requests;

-- Create new policies that work with profiles.role and team_members
CREATE POLICY "Builders and admins can manage all price requests" 
ON price_requests FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('builder', 'admin')
  )
);

CREATE POLICY "Estimators can update assigned requests" 
ON price_requests FOR UPDATE 
USING (
  (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.id = price_requests.assigned_estimator_id 
    AND team_members.user_id = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('builder', 'admin')
  ))
);

CREATE POLICY "Users can create price requests" 
ON price_requests FOR INSERT 
WITH CHECK (requested_by_user_id = auth.uid());

CREATE POLICY "Users can view relevant requests" 
ON price_requests FOR SELECT 
USING (
  (requested_by_user_id = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.id = price_requests.assigned_estimator_id 
    AND team_members.user_id = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('builder', 'admin')
  ))
);