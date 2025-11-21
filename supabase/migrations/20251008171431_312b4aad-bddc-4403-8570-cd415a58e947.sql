-- Add stories column to quick_estimates table
ALTER TABLE public.quick_estimates
ADD COLUMN IF NOT EXISTS stories TEXT DEFAULT 'Single Story';