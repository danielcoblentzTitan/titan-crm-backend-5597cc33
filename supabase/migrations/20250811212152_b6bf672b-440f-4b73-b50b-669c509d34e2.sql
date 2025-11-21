-- Create users table with role-based access
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'PM', 'Viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Admin can manage all users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Users can view their own record" ON public.users FOR SELECT USING (
  id = auth.uid()
);

-- Create phase templates table
CREATE TABLE public.phase_templates_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phase template items
CREATE TABLE public.phase_template_items_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.phase_templates_new(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  default_duration_days INTEGER NOT NULL DEFAULT 1,
  predecessor_item_id UUID REFERENCES public.phase_template_items_new(id) ON DELETE SET NULL,
  lag_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on templates
ALTER TABLE public.phase_templates_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_template_items_new ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Admin can manage templates" ON public.phase_templates_new FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'PM'))
);

CREATE POLICY "Users can view active templates" ON public.phase_templates_new FOR SELECT USING (
  is_active = true
);

CREATE POLICY "Admin can manage template items" ON public.phase_template_items_new FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'PM'))
);

CREATE POLICY "Users can view template items" ON public.phase_template_items_new FOR SELECT USING (true);

-- Create enhanced projects table
CREATE TABLE public.projects_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Lead', 'Active', 'On Hold', 'Closed')) DEFAULT 'Lead',
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  size_sqft INTEGER,
  pm_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  start_target DATE,
  finish_target DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects_new ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Admin can manage all projects" ON public.projects_new FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "PM can manage assigned projects" ON public.projects_new FOR ALL USING (
  pm_user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Viewer can view all projects" ON public.projects_new FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'PM', 'Viewer'))
);

-- Create enhanced phases table
CREATE TABLE public.phases_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects_new(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  planned_start DATE,
  planned_finish DATE,
  actual_start DATE,
  actual_finish DATE,
  status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Done')) DEFAULT 'Not Started',
  dependency_phase_id UUID REFERENCES public.phases_new(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on phases
ALTER TABLE public.phases_new ENABLE ROW LEVEL SECURITY;

-- Create policies for phases
CREATE POLICY "Admin can manage all phases" ON public.phases_new FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "PM can manage assigned project phases" ON public.phases_new FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects_new p WHERE p.id = phases_new.project_id AND p.pm_user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Viewer can view all phases" ON public.phases_new FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'PM', 'Viewer'))
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects_new(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.phases_new(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  assignee_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  status TEXT NOT NULL CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Admin can manage all tasks" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "PM can manage assigned project tasks" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects_new p WHERE p.id = tasks.project_id AND p.pm_user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Users can view assigned tasks" ON public.tasks FOR SELECT USING (
  assignee_user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'PM', 'Viewer'))
);

-- Create weather snapshots table
CREATE TABLE public.weather_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects_new(id) ON DELETE CASCADE,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  forecast_json JSONB NOT NULL,
  risk_flag TEXT NOT NULL CHECK (risk_flag IN ('None', 'Rain', 'High Wind', 'Storm')) DEFAULT 'None',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on weather snapshots
ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for weather snapshots
CREATE POLICY "Admin can manage weather snapshots" ON public.weather_snapshots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "PM can manage assigned project weather" ON public.weather_snapshots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects_new p WHERE p.id = weather_snapshots.project_id AND p.pm_user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Users can view weather snapshots" ON public.weather_snapshots FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'PM', 'Viewer'))
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs
CREATE POLICY "Admin can view audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON public.projects_new
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

CREATE TRIGGER update_phases_timestamp
  BEFORE UPDATE ON public.phases_new
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

CREATE TRIGGER update_tasks_timestamp
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

CREATE TRIGGER update_templates_timestamp
  BEFORE UPDATE ON public.phase_templates_new
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

CREATE TRIGGER update_template_items_timestamp
  BEFORE UPDATE ON public.phase_template_items_new
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

-- Insert seed users
INSERT INTO public.users (name, email, role) VALUES
  ('Daniel Coblentz', 'admin@titanbuildings.com', 'Admin'),
  ('Avery Cole', 'avery@titanbuildings.com', 'PM'),
  ('Jordan Pike', 'jordan@titanbuildings.com', 'PM');

-- Insert Standard Barndo template
INSERT INTO public.phase_templates_new (name, description) VALUES
  ('Template A (Standard Barndo)', 'Standard barndominium construction phases with dependencies');

-- Get template ID for inserting items
DO $$
DECLARE
    template_uuid UUID;
    presales_id UUID;
    site_id UUID;
    permitting_id UUID;
    foundation_id UUID;
    framing_id UUID;
    mep_id UUID;
    insulation_id UUID;
    interior_id UUID;
BEGIN
    SELECT id INTO template_uuid FROM public.phase_templates_new WHERE name = 'Template A (Standard Barndo)';
    
    -- Insert template items with dependencies
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days) 
    VALUES (template_uuid, 'Pre-Sales', 1, 7) RETURNING id INTO presales_id;
    
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days, predecessor_item_id) 
    VALUES (template_uuid, 'Site/Survey/Septic', 2, 15, presales_id) RETURNING id INTO site_id;
    
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days, predecessor_item_id) 
    VALUES (template_uuid, 'Permitting', 3, 20, site_id) RETURNING id INTO permitting_id;
    
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days, predecessor_item_id) 
    VALUES (template_uuid, 'Foundation', 4, 10, permitting_id) RETURNING id INTO foundation_id;
    
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days, predecessor_item_id) 
    VALUES (template_uuid, 'Framing/Building Shell', 5, 25, foundation_id) RETURNING id INTO framing_id;
    
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days, predecessor_item_id) 
    VALUES (template_uuid, 'MEP Rough-Ins', 6, 20, framing_id) RETURNING id INTO mep_id;
    
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days, predecessor_item_id) 
    VALUES (template_uuid, 'Insulation/Drywall', 7, 10, mep_id) RETURNING id INTO insulation_id;
    
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days, predecessor_item_id) 
    VALUES (template_uuid, 'Interior Finishes', 8, 20, insulation_id) RETURNING id INTO interior_id;
    
    INSERT INTO public.phase_template_items_new (template_id, name, sort_order, default_duration_days, predecessor_item_id) 
    VALUES (template_uuid, 'Final/CO', 9, 5, interior_id);
END $$;

-- Insert seed projects with PM references
INSERT INTO public.projects_new (code, name, status, city, state, zip, latitude, longitude, size_sqft, pm_user_id, start_target, finish_target) 
SELECT 
  'TB-2508-001', 'Harper Barndo', 'Active', 'Dover', 'DE', '19901', 39.1582, -75.5244, 2400, 
  u.id, '2025-08-15'::date, '2026-01-30'::date
FROM public.users u WHERE u.email = 'avery@titanbuildings.com';

INSERT INTO public.projects_new (code, name, status, city, state, zip, latitude, longitude, size_sqft, pm_user_id, start_target, finish_target) 
SELECT 
  'TB-2507-014', 'Ramsey Shop+Home', 'Active', 'Milford', 'DE', '19963', 38.9126, -75.4274, 3000, 
  u.id, '2025-08-05'::date, '2026-02-28'::date
FROM public.users u WHERE u.email = 'jordan@titanbuildings.com';

INSERT INTO public.projects_new (code, name, status, city, state, zip, latitude, longitude, size_sqft, pm_user_id, start_target, finish_target) 
SELECT 
  'TB-2506-008', 'Nguyen Barndo', 'Lead', 'Smyrna', 'DE', '19977', 39.2998, -75.6047, 2000, 
  u.id, '2025-09-01'::date, '2026-02-01'::date
FROM public.users u WHERE u.email = 'avery@titanbuildings.com';

INSERT INTO public.projects_new (code, name, status, city, state, zip, latitude, longitude, size_sqft, pm_user_id, start_target, finish_target) 
SELECT 
  'TB-2505-021', 'Bennett Farmhouse Barndo', 'Active', 'Harrington', 'DE', '19952', 38.9229, -75.5777, 2800, 
  u.id, '2025-07-20'::date, '2026-01-05'::date
FROM public.users u WHERE u.email = 'avery@titanbuildings.com';

INSERT INTO public.projects_new (code, name, status, city, state, zip, latitude, longitude, size_sqft, pm_user_id, start_target, finish_target) 
SELECT 
  'TB-2504-003', 'Lopez Barndo Addition', 'On Hold', 'Georgetown', 'DE', '19947', 38.6901, -75.3855, 1200, 
  u.id, '2025-09-10'::date, '2026-01-25'::date
FROM public.users u WHERE u.email = 'jordan@titanbuildings.com';

INSERT INTO public.projects_new (code, name, status, city, state, zip, latitude, longitude, size_sqft, pm_user_id, start_target, finish_target) 
SELECT 
  'TB-2508-004', 'Patel Modern Barndo', 'Active', 'Middletown', 'DE', '19709', 39.4496, -75.7163, 2600, 
  u.id, '2025-08-22'::date, '2026-02-28'::date
FROM public.users u WHERE u.email = 'avery@titanbuildings.com';

INSERT INTO public.projects_new (code, name, status, city, state, zip, latitude, longitude, size_sqft, pm_user_id, start_target, finish_target) 
SELECT 
  'TB-2507-006', 'Wright Lake Barndo', 'Active', 'Felton', 'DE', '19943', 39.0096, -75.5777, 3400, 
  u.id, '2025-07-28'::date, '2026-02-15'::date
FROM public.users u WHERE u.email = 'jordan@titanbuildings.com';

INSERT INTO public.projects_new (code, name, status, city, state, zip, latitude, longitude, size_sqft, pm_user_id, start_target, finish_target) 
SELECT 
  'TB-2503-017', 'Carter Coastal Retreat', 'Closed', 'Lewes', 'DE', '19958', 38.7746, -75.1393, 2300, 
  u.id, '2025-03-15'::date, '2025-08-01'::date
FROM public.users u WHERE u.email = 'avery@titanbuildings.com';

-- Insert seed phases for projects
DO $$
DECLARE
    harper_id UUID;
    ramsey_id UUID;
    nguyen_id UUID;
    bennett_id UUID;
    lopez_id UUID;
    patel_id UUID;
    wright_id UUID;
    carter_id UUID;
BEGIN
    -- Get project IDs
    SELECT id INTO harper_id FROM public.projects_new WHERE code = 'TB-2508-001';
    SELECT id INTO ramsey_id FROM public.projects_new WHERE code = 'TB-2507-014';
    SELECT id INTO nguyen_id FROM public.projects_new WHERE code = 'TB-2506-008';
    SELECT id INTO bennett_id FROM public.projects_new WHERE code = 'TB-2505-021';
    SELECT id INTO lopez_id FROM public.projects_new WHERE code = 'TB-2504-003';
    SELECT id INTO patel_id FROM public.projects_new WHERE code = 'TB-2508-004';
    SELECT id INTO wright_id FROM public.projects_new WHERE code = 'TB-2507-006';
    SELECT id INTO carter_id FROM public.projects_new WHERE code = 'TB-2503-017';
    
    -- Harper Barndo phases
    INSERT INTO public.phases_new (project_id, name, sort_order, status) VALUES
      (harper_id, 'Pre-Sales', 1, 'Done'),
      (harper_id, 'Site/Survey/Septic', 2, 'In Progress'),
      (harper_id, 'Permitting', 3, 'Not Started');
    
    -- Ramsey Shop+Home phases
    INSERT INTO public.phases_new (project_id, name, sort_order, status) VALUES
      (ramsey_id, 'Pre-Sales', 1, 'Done'),
      (ramsey_id, 'Site/Survey/Septic', 2, 'Done'),
      (ramsey_id, 'Permitting', 3, 'Blocked');
    
    -- Nguyen Barndo phases
    INSERT INTO public.phases_new (project_id, name, sort_order, status) VALUES
      (nguyen_id, 'Pre-Sales', 1, 'In Progress'),
      (nguyen_id, 'Permitting', 2, 'Not Started');
    
    -- Bennett Farmhouse phases
    INSERT INTO public.phases_new (project_id, name, sort_order, status) VALUES
      (bennett_id, 'Pre-Sales', 1, 'Done'),
      (bennett_id, 'Site/Survey/Septic', 2, 'Done'),
      (bennett_id, 'Permitting', 3, 'Done'),
      (bennett_id, 'Foundation', 4, 'In Progress');
    
    -- Lopez Barndo phases
    INSERT INTO public.phases_new (project_id, name, sort_order, status) VALUES
      (lopez_id, 'Pre-Sales', 1, 'Done'),
      (lopez_id, 'All Phases', 2, 'Not Started');
    
    -- Patel Modern Barndo phases
    INSERT INTO public.phases_new (project_id, name, sort_order, status) VALUES
      (patel_id, 'Pre-Sales', 1, 'Done'),
      (patel_id, 'Framing/Building Shell', 3, 'Not Started');
    
    -- Wright Lake Barndo phases
    INSERT INTO public.phases_new (project_id, name, sort_order, status) VALUES
      (wright_id, 'Pre-Sales', 1, 'Done'),
      (wright_id, 'Site/Survey/Septic', 2, 'Done'),
      (wright_id, 'Permitting', 3, 'Done'),
      (wright_id, 'MEP Rough-Ins', 6, 'In Progress'),
      (wright_id, 'Insulation/Drywall', 7, 'Not Started');
    
    -- Carter Coastal Retreat phases
    INSERT INTO public.phases_new (project_id, name, sort_order, status) VALUES
      (carter_id, 'Final/CO', 9, 'Done');
END $$;