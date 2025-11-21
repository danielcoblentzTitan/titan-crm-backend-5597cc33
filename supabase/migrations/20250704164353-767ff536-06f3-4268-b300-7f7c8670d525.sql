-- Fix statement_versions RLS policies to allow saving and editing estimates
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Builders can manage all statement versions" ON public.statement_versions;

-- Create new policies that allow users to save and manage their own estimates
CREATE POLICY "Users can manage their own statement versions" 
ON public.statement_versions 
FOR ALL 
USING (auth.uid() = created_by OR created_by IS NULL);

-- Allow users to create versions for any project/estimate
CREATE POLICY "Users can create statement versions" 
ON public.statement_versions 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view all versions they created
CREATE POLICY "Users can view their statement versions" 
ON public.statement_versions 
FOR SELECT 
USING (auth.uid() = created_by OR created_by IS NULL);

-- Allow users to update their own versions
CREATE POLICY "Users can update their statement versions" 
ON public.statement_versions 
FOR UPDATE 
USING (auth.uid() = created_by OR created_by IS NULL);

-- Make created_by default to current user
ALTER TABLE public.statement_versions 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Remove the foreign key constraint that's preventing saves for customer/lead estimates
ALTER TABLE public.statement_versions 
DROP CONSTRAINT IF EXISTS statement_versions_project_id_fkey;