-- Update price_requests table to reference team_members instead of auth.users for assigned_estimator_id

-- Drop the existing foreign key constraint
ALTER TABLE price_requests DROP CONSTRAINT price_requests_assigned_estimator_id_fkey;

-- Add new foreign key constraint to team_members table
ALTER TABLE price_requests 
ADD CONSTRAINT price_requests_assigned_estimator_id_fkey 
FOREIGN KEY (assigned_estimator_id) REFERENCES team_members(id);