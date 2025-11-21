-- Add voice_note field to all document tables
ALTER TABLE public.lead_documents ADD COLUMN voice_note TEXT DEFAULT '';
ALTER TABLE public.project_documents ADD COLUMN voice_note TEXT DEFAULT '';
ALTER TABLE public.customer_documents ADD COLUMN voice_note TEXT DEFAULT '';