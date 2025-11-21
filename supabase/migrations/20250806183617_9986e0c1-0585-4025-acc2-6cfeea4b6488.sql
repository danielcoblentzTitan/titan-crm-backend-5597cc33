-- Add pipeline probability field to leads table for forecasting
ALTER TABLE public.leads 
ADD COLUMN pipeline_probability integer DEFAULT 50 CHECK (pipeline_probability >= 0 AND pipeline_probability <= 100);

-- Add comment for clarity
COMMENT ON COLUMN public.leads.pipeline_probability IS 'Probability percentage (0-100) that this lead will convert to a sale';