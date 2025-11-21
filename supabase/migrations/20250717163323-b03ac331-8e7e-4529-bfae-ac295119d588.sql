-- Create project schedules table
CREATE TABLE public.project_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  project_start_date DATE NOT NULL,
  total_duration_days INTEGER NOT NULL DEFAULT 0,
  schedule_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.project_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for project schedules
CREATE POLICY "Builders can manage all project schedules" 
ON public.project_schedules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their project schedules" 
ON public.project_schedules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects p
  JOIN customers c ON c.id = p.customer_id
  WHERE p.id = project_schedules.project_id 
  AND c.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_schedules_updated_at
BEFORE UPDATE ON public.project_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint
ALTER TABLE public.project_schedules 
ADD CONSTRAINT project_schedules_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;