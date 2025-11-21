-- Update team_members table to support multiple roles (up to 3)
-- Replace single role column with roles array
ALTER TABLE public.team_members 
ADD COLUMN roles TEXT[] DEFAULT '{}';

-- Update existing data to migrate single role to roles array
UPDATE public.team_members 
SET roles = ARRAY[role] 
WHERE role IS NOT NULL;

-- Add constraint to limit maximum 3 roles per team member
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_max_3_roles_check 
CHECK (array_length(roles, 1) <= 3);

-- Add constraint to ensure at least 1 role
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_min_1_role_check 
CHECK (array_length(roles, 1) >= 1);

-- Keep the old role column for backward compatibility temporarily
-- It will be dropped in a future migration after full transition