-- Enhance document system for leads and projects
-- Add customer_facing flag to lead_documents
ALTER TABLE public.lead_documents 
ADD COLUMN IF NOT EXISTS customer_facing BOOLEAN DEFAULT false;

-- Create project_documents table for project-level documents
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    customer_facing BOOLEAN DEFAULT false,
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on project_documents
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_documents
CREATE POLICY "Builders can manage all project documents" 
ON public.project_documents 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
));

CREATE POLICY "Customers can view their customer-facing project documents" 
ON public.project_documents 
FOR SELECT 
USING (
    customer_facing = true AND 
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.customers c ON c.id = p.customer_id
        WHERE p.id = project_documents.project_id AND c.user_id = auth.uid()
    )
);

-- Create customer_portal_access table for tracking portal access
CREATE TABLE IF NOT EXISTS public.customer_portal_access (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE UNIQUE,
    portal_enabled BOOLEAN DEFAULT true,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customer_portal_access
ALTER TABLE public.customer_portal_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_portal_access
CREATE POLICY "Builders can manage customer portal access" 
ON public.customer_portal_access 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
));

CREATE POLICY "Customers can view their own portal access" 
ON public.customer_portal_access 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = customer_portal_access.customer_id AND user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_customer_facing ON public.project_documents(customer_facing);
CREATE INDEX IF NOT EXISTS idx_lead_documents_customer_facing ON public.lead_documents(customer_facing);

-- Update lead_documents RLS policies to handle customer_facing documents
DROP POLICY IF EXISTS "Allow authenticated users to view lead documents" ON public.lead_documents;
CREATE POLICY "Builders can manage all lead documents" 
ON public.lead_documents 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
));

-- Function to automatically create portal access when customer is created
CREATE OR REPLACE FUNCTION public.create_customer_portal_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.customer_portal_access (customer_id)
    VALUES (NEW.id)
    ON CONFLICT (customer_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create portal access for new customers
DROP TRIGGER IF EXISTS trigger_create_customer_portal_access ON public.customers;
CREATE TRIGGER trigger_create_customer_portal_access
    AFTER INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.create_customer_portal_access();