-- Change project_id from uuid to text to support customer/lead estimate IDs
ALTER TABLE public.statement_versions 
ALTER COLUMN project_id TYPE text USING project_id::text;