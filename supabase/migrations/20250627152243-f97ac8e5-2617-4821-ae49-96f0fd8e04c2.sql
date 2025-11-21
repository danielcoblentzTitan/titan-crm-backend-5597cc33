
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('builder', 'customer')) DEFAULT 'customer',
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('Planning', 'In Progress', 'Completed', 'On Hold')) DEFAULT 'Planning',
  progress INTEGER DEFAULT 0,
  phase TEXT,
  start_date DATE NOT NULL,
  estimated_completion DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create project_costs table
CREATE TABLE public.project_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metal DECIMAL(10,2) DEFAULT 0,
  lumber DECIMAL(10,2) DEFAULT 0,
  doors_windows DECIMAL(10,2) DEFAULT 0,
  garage_doors DECIMAL(10,2) DEFAULT 0,
  flooring DECIMAL(10,2) DEFAULT 0,
  drywall DECIMAL(10,2) DEFAULT 0,
  paint DECIMAL(10,2) DEFAULT 0,
  fixtures DECIMAL(10,2) DEFAULT 0,
  trim DECIMAL(10,2) DEFAULT 0,
  building_crew DECIMAL(10,2) DEFAULT 0,
  concrete DECIMAL(10,2) DEFAULT 0,
  electric DECIMAL(10,2) DEFAULT 0,
  plumbing DECIMAL(10,2) DEFAULT 0,
  hvac DECIMAL(10,2) DEFAULT 0,
  drywall_sub DECIMAL(10,2) DEFAULT 0,
  painter DECIMAL(10,2) DEFAULT 0,
  additional_cogs DECIMAL(10,2) DEFAULT 0,
  miscellaneous DECIMAL(10,2) DEFAULT 0,
  materials DECIMAL(10,2) DEFAULT 0,
  permits DECIMAL(10,2) DEFAULT 0,
  equipment DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name TEXT,
  job_type TEXT CHECK (job_type IN ('Residential', 'Barndominium', 'Commercial')) DEFAULT 'Residential',
  status TEXT CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue')) DEFAULT 'Draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('milestone', 'task', 'note', 'invoice', 'payment')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT,
  status TEXT CHECK (status IN ('new', 'in-progress', 'completed', 'overdue')) DEFAULT 'new',
  time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for customers (builders only)
CREATE POLICY "Builders can manage customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

-- Create RLS policies for projects (builders only)
CREATE POLICY "Builders can manage projects" ON public.projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

-- Create RLS policies for project_costs (builders only)
CREATE POLICY "Builders can manage project costs" ON public.project_costs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

-- Create RLS policies for invoices (builders only)
CREATE POLICY "Builders can manage invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

-- Create RLS policies for invoice_items (builders only)
CREATE POLICY "Builders can manage invoice items" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

-- Create RLS policies for activities (builders only)
CREATE POLICY "Builders can manage activities" ON public.activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
