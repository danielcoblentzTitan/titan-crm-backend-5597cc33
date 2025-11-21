-- Create payment schedule templates table
CREATE TABLE IF NOT EXISTS public.payment_schedule_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  schedule_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phase addon packages table
CREATE TABLE IF NOT EXISTS public.phase_addon_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phase addon items table (individual phases in an addon package)
CREATE TABLE IF NOT EXISTS public.phase_addon_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  addon_package_id UUID NOT NULL REFERENCES public.phase_addon_packages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  internal_notes TEXT,
  customer_notes TEXT,
  color TEXT,
  priority TEXT DEFAULT 'Medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project type configs table
CREATE TABLE IF NOT EXISTS public.project_type_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_template_id UUID REFERENCES public.phase_templates(id) ON DELETE SET NULL,
  payment_schedule_template_id UUID REFERENCES public.payment_schedule_templates(id) ON DELETE SET NULL,
  default_addon_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add project_type_config_id to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_type_config_id UUID REFERENCES public.project_type_configs(id) ON DELETE SET NULL;

-- Create project addon selections table (tracks which addons are selected for each project)
CREATE TABLE IF NOT EXISTS public.project_addon_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  addon_package_id UUID NOT NULL REFERENCES public.phase_addon_packages(id) ON DELETE CASCADE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, addon_package_id)
);

-- Enable RLS
ALTER TABLE public.payment_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_addon_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_addon_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_type_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_addon_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Builders can manage, everyone can view active ones
CREATE POLICY "Builders can manage payment schedules" ON public.payment_schedule_templates
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder'));

CREATE POLICY "Everyone can view active payment schedules" ON public.payment_schedule_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Builders can manage addon packages" ON public.phase_addon_packages
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder'));

CREATE POLICY "Everyone can view active addon packages" ON public.phase_addon_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Builders can manage addon items" ON public.phase_addon_items
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder'));

CREATE POLICY "Everyone can view addon items" ON public.phase_addon_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM phase_addon_packages WHERE phase_addon_packages.id = phase_addon_items.addon_package_id AND phase_addon_packages.is_active = true));

CREATE POLICY "Builders can manage project type configs" ON public.project_type_configs
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder'));

CREATE POLICY "Everyone can view active project type configs" ON public.project_type_configs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Builders can manage project addon selections" ON public.project_addon_selections
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder'));

CREATE POLICY "Users can view project addon selections" ON public.project_addon_selections
  FOR SELECT USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_phase_addon_items_package ON public.phase_addon_items(addon_package_id);
CREATE INDEX IF NOT EXISTS idx_project_addon_selections_project ON public.project_addon_selections(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_type_config ON public.projects(project_type_config_id);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_schedule_templates_updated_at
  BEFORE UPDATE ON public.payment_schedule_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phase_addon_packages_updated_at
  BEFORE UPDATE ON public.phase_addon_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_type_configs_updated_at
  BEFORE UPDATE ON public.project_type_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();