-- Add lead_id column to price_requests table to support pricing requests for leads
ALTER TABLE public.price_requests 
ADD COLUMN lead_id UUID REFERENCES public.leads(id);

-- Update the constraint to allow either project_id or lead_id (but not both)
ALTER TABLE public.price_requests 
ADD CONSTRAINT price_requests_project_or_lead_check 
CHECK (
  (project_id IS NOT NULL AND lead_id IS NULL) OR 
  (project_id IS NULL AND lead_id IS NOT NULL)
);