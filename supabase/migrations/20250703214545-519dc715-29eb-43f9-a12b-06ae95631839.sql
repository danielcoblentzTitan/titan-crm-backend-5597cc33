-- Create customer documents table
CREATE TABLE public.customer_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  customer_facing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for customer documents
CREATE POLICY "Builders can manage all customer documents" 
ON public.customer_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their customer-facing documents" 
ON public.customer_documents 
FOR SELECT 
USING (
  customer_facing = true AND 
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = customer_documents.customer_id 
    AND customers.user_id = auth.uid()
  )
);

-- Add foreign key constraint
ALTER TABLE public.customer_documents 
ADD CONSTRAINT customer_documents_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Create function to transfer customer documents to project when customer becomes project
CREATE OR REPLACE FUNCTION public.transfer_customer_documents_to_project()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a project is created for a customer, transfer their documents
  IF TG_OP = 'INSERT' AND NEW.customer_id IS NOT NULL THEN
    -- Copy customer documents to project documents
    INSERT INTO public.project_documents (
      project_id,
      file_name,
      file_path,
      file_type,
      file_size,
      customer_facing,
      uploaded_at,
      uploaded_by
    )
    SELECT 
      NEW.id,
      cd.file_name,
      REPLACE(cd.file_path, 'customers/' || NEW.customer_id::text, 'projects/' || NEW.id::text),
      cd.file_type,
      cd.file_size,
      cd.customer_facing,
      cd.uploaded_at,
      cd.uploaded_by
    FROM public.customer_documents cd
    WHERE cd.customer_id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically transfer documents when project is created
CREATE TRIGGER transfer_customer_docs_on_project_creation
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.transfer_customer_documents_to_project();