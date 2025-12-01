-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all customers" 
ON public.customers FOR SELECT 
USING (public.has_role(auth.uid(), 'builder_admin'));

CREATE POLICY "Admins can manage customers" 
ON public.customers FOR ALL 
USING (public.has_role(auth.uid(), 'builder_admin'));

-- Create titan_projects table
CREATE TABLE IF NOT EXISTS public.titan_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  project_number TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'planning',
  project_type TEXT,
  scope TEXT,
  site_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  building_width NUMERIC,
  building_length NUMERIC,
  building_height NUMERIC,
  roof_pitch TEXT,
  porch_type TEXT,
  garage_door_count INTEGER,
  specs JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.titan_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all titan projects" 
ON public.titan_projects FOR SELECT 
USING (public.has_role(auth.uid(), 'builder_admin'));

CREATE POLICY "Admins can manage titan projects" 
ON public.titan_projects FOR ALL 
USING (public.has_role(auth.uid(), 'builder_admin'));

-- Create project_allowances table
CREATE TABLE IF NOT EXISTS public.project_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.titan_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  allowance_amount NUMERIC DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.project_allowances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage allowances" 
ON public.project_allowances FOR ALL 
USING (public.has_role(auth.uid(), 'builder_admin'));

-- Create project_attachments table
CREATE TABLE IF NOT EXISTS public.project_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.titan_projects(id) ON DELETE CASCADE,
  room_id UUID,
  category TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attachments" 
ON public.project_attachments FOR ALL 
USING (public.has_role(auth.uid(), 'builder_admin'));

-- Create project_approvals table
CREATE TABLE IF NOT EXISTS public.project_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.titan_projects(id) ON DELETE CASCADE,
  approved_by TEXT NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  signature_data TEXT,
  notes TEXT,
  version INTEGER DEFAULT 1
);

ALTER TABLE public.project_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view approvals" 
ON public.project_approvals FOR SELECT 
USING (public.has_role(auth.uid(), 'builder_admin'));

CREATE POLICY "Admins can create approvals" 
ON public.project_approvals FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'builder_admin'));

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_titan_projects_updated_at ON public.titan_projects;
CREATE TRIGGER set_titan_projects_updated_at
BEFORE UPDATE ON public.titan_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_project_allowances_updated_at ON public.project_allowances;
CREATE TRIGGER set_project_allowances_updated_at
BEFORE UPDATE ON public.project_allowances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();