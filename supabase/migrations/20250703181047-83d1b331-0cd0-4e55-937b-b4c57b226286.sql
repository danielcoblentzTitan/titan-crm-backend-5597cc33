-- Create design selection documents table
CREATE TABLE public.design_selection_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Design Selections',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  current_version_number INTEGER NOT NULL DEFAULT 1
);

-- Create design selection versions table
CREATE TABLE public.design_selection_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.design_selection_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  selections_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(document_id, version_number)
);

-- Enable RLS
ALTER TABLE public.design_selection_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_selection_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for design_selection_documents
CREATE POLICY "Builders can manage all design selection documents" 
ON public.design_selection_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their own design selection documents" 
ON public.design_selection_documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM customers 
  WHERE customers.id = design_selection_documents.customer_id 
  AND customers.user_id = auth.uid()
));

CREATE POLICY "Customers can update their own design selection documents" 
ON public.design_selection_documents 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM customers 
  WHERE customers.id = design_selection_documents.customer_id 
  AND customers.user_id = auth.uid()
));

-- RLS policies for design_selection_versions
CREATE POLICY "Builders can manage all design selection versions" 
ON public.design_selection_versions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their own design selection versions" 
ON public.design_selection_versions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM design_selection_documents d
  JOIN customers c ON c.id = d.customer_id
  WHERE d.id = design_selection_versions.document_id 
  AND c.user_id = auth.uid()
));

CREATE POLICY "Customers can insert their own design selection versions" 
ON public.design_selection_versions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM design_selection_documents d
  JOIN customers c ON c.id = d.customer_id
  WHERE d.id = design_selection_versions.document_id 
  AND c.user_id = auth.uid()
));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_design_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_design_documents_updated_at
BEFORE UPDATE ON public.design_selection_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_design_document_timestamp();