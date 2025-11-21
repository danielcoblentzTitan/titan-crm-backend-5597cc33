
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Create storage policies for documents bucket
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Create lead_documents table
CREATE TABLE public.lead_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lead_documents table
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lead_documents
CREATE POLICY "Allow authenticated users to view lead documents" ON public.lead_documents
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert lead documents" ON public.lead_documents
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update lead documents" ON public.lead_documents
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete lead documents" ON public.lead_documents
FOR DELETE USING (auth.role() = 'authenticated');

-- Add indexes for better performance
CREATE INDEX idx_lead_documents_lead_id ON public.lead_documents(lead_id);
CREATE INDEX idx_lead_documents_uploaded_at ON public.lead_documents(uploaded_at);
