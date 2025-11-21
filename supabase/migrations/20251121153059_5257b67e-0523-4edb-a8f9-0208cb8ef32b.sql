-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('builder_admin', 'client', 'subcontractor');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  project_number TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  site_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'locked', 'under_construction', 'complete')),
  total_allowance_flooring DECIMAL(10,2) DEFAULT 0,
  total_allowance_cabinets DECIMAL(10,2) DEFAULT 0,
  total_allowance_countertops DECIMAL(10,2) DEFAULT 0,
  total_allowance_plumbing DECIMAL(10,2) DEFAULT 0,
  total_allowance_electrical DECIMAL(10,2) DEFAULT 0,
  total_allowance_lighting DECIMAL(10,2) DEFAULT 0,
  total_allowance_paint DECIMAL(10,2) DEFAULT 0,
  total_allowance_windows_doors DECIMAL(10,2) DEFAULT 0,
  total_allowance_misc DECIMAL(10,2) DEFAULT 0,
  running_total_estimate DECIMAL(10,2) DEFAULT 0,
  total_square_footage DECIMAL(10,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  room_name TEXT NOT NULL,
  room_type TEXT CHECK (room_type IN ('kitchen', 'bedroom', 'bathroom', 'living', 'exterior', 'utility', 'hall', 'garage', 'office', 'other')),
  length_ft DECIMAL(6,2),
  width_ft DECIMAL(6,2),
  ceiling_height_ft DECIMAL(5,2),
  ceiling_type TEXT CHECK (ceiling_type IN ('flat', 'vaulted', 'tray', 'beams')),
  notes_general TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create selection_categories table
CREATE TABLE public.selection_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  trade TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create selection_items table
CREATE TABLE public.selection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.selection_categories(id) NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  material_type TEXT,
  brand TEXT,
  model_or_sku TEXT,
  color_name TEXT,
  finish TEXT,
  quantity DECIMAL(10,2),
  unit TEXT,
  unit_cost_allowance DECIMAL(10,2),
  total_cost_allowance DECIMAL(10,2),
  is_standard_option BOOLEAN DEFAULT true,
  is_upgrade BOOLEAN DEFAULT false,
  upgrade_cost DECIMAL(10,2),
  notes_for_sub TEXT,
  image_url TEXT,
  trade TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create allowance_summary table
CREATE TABLE public.allowance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  category_name TEXT NOT NULL,
  allowance_amount DECIMAL(10,2) DEFAULT 0,
  selected_amount DECIMAL(10,2) DEFAULT 0,
  over_under_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, category_name)
);

-- Create selection_versions table
CREATE TABLE public.selection_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  label TEXT,
  created_by UUID REFERENCES auth.users(id),
  locked BOOLEAN DEFAULT false,
  snapshot_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, version_number)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

-- RLS Policies for projects
CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

CREATE POLICY "Admins can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'builder_admin'));

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

-- RLS Policies for rooms
CREATE POLICY "Admins can manage all rooms"
  ON public.rooms FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

-- RLS Policies for selection_categories (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view categories"
  ON public.selection_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.selection_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

-- RLS Policies for selection_items
CREATE POLICY "Admins can manage all selection items"
  ON public.selection_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

-- RLS Policies for allowance_summary
CREATE POLICY "Admins can manage allowance summaries"
  ON public.allowance_summary FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

-- RLS Policies for selection_versions
CREATE POLICY "Admins can manage versions"
  ON public.selection_versions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'builder_admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_selection_items_updated_at
  BEFORE UPDATE ON public.selection_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_allowance_summary_updated_at
  BEFORE UPDATE ON public.allowance_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed selection_categories with all 14 categories
INSERT INTO public.selection_categories (name, trade, sort_order) VALUES
  ('Flooring', 'flooring', 1),
  ('Walls', 'paint', 2),
  ('Ceiling', 'paint', 3),
  ('Cabinets', 'cabinets', 4),
  ('Countertops', 'countertops', 5),
  ('Plumbing', 'plumbing', 6),
  ('Electrical', 'electrical', 7),
  ('Windows_Doors', 'trim', 8),
  ('HVAC', 'hvac', 9),
  ('Misc', 'general', 10),
  ('Exterior', 'site_exterior', 11),
  ('Concrete', 'site_exterior', 12),
  ('Trim', 'trim', 13),
  ('Paint', 'paint', 14);