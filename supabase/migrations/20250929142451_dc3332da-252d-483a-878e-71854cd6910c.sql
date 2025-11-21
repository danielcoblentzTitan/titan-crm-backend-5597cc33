-- Create project tab settings table
CREATE TABLE public.project_tab_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  tab_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  tab_type TEXT NOT NULL DEFAULT 'main', -- 'main' or 'sub'
  parent_tab TEXT NULL, -- for sub-tabs, reference to parent tab
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, tab_name, parent_tab)
);

-- Enable RLS
ALTER TABLE public.project_tab_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Builders can manage project tab settings" 
ON public.project_tab_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'builder'
  )
);

CREATE POLICY "Customers can view their project tab settings" 
ON public.project_tab_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = project_tab_settings.project_id 
    AND c.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_project_tab_settings_updated_at
BEFORE UPDATE ON public.project_tab_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tab settings for existing projects
INSERT INTO public.project_tab_settings (project_id, tab_name, tab_type, sort_order)
SELECT DISTINCT p.id, 'overview', 'main', 1 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'schedule', 'main', 2 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'documents', 'main', 3 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'financial', 'main', 4 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'messages', 'main', 5 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'design', 'main', 6 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'punchlist', 'main', 7 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'exterior', 'sub', 1 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'garage', 'sub', 2 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'entry', 'sub', 3 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'interior', 'sub', 4 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'kitchen', 'sub', 5 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'bathrooms', 'sub', 6 FROM projects p
UNION ALL
SELECT DISTINCT p.id, 'mudroom', 'sub', 7 FROM projects p;

-- Update sub-tabs to have design as parent
UPDATE public.project_tab_settings 
SET parent_tab = 'design' 
WHERE tab_type = 'sub' AND tab_name IN ('exterior', 'garage', 'entry', 'interior', 'kitchen', 'bathrooms', 'mudroom');