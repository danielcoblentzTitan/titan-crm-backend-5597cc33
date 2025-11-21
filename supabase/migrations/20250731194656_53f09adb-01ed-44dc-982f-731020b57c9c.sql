-- Add username and password fields to team_members table
ALTER TABLE public.team_members 
ADD COLUMN username text UNIQUE,
ADD COLUMN password_hash text;

-- Add index on username for faster lookups
CREATE INDEX idx_team_members_username ON public.team_members(username);