
-- Add project manager role to the team_members table
-- First, let's see what roles currently exist and add project manager
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Add a check constraint to include the new role
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('salesperson', 'manager', 'admin', 'project_manager'));
