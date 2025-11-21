-- Create global exceptions table for master schedule events like rain days
CREATE TABLE public.global_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL DEFAULT 'weather',
  reason TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project exceptions table to track how global exceptions affect individual projects
CREATE TABLE public.project_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  global_exception_id UUID NOT NULL,
  phases_affected JSONB NOT NULL DEFAULT '[]',
  delay_applied_days INTEGER NOT NULL DEFAULT 0,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_exceptions ENABLE ROW LEVEL SECURITY;

-- Policies for global_exceptions
CREATE POLICY "Builders can manage global exceptions" 
ON public.global_exceptions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- Policies for project_exceptions  
CREATE POLICY "Builders can manage project exceptions"
ON public.project_exceptions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their project exceptions"
ON public.project_exceptions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects p 
  JOIN customers c ON c.id = p.customer_id 
  WHERE p.id = project_exceptions.project_id AND c.user_id = auth.uid()
));

-- Add foreign key constraints
ALTER TABLE public.project_exceptions 
ADD CONSTRAINT fk_project_exceptions_project 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_exceptions 
ADD CONSTRAINT fk_project_exceptions_global 
FOREIGN KEY (global_exception_id) REFERENCES public.global_exceptions(id) ON DELETE CASCADE;

-- Add trigger for updated_at
CREATE TRIGGER update_global_exceptions_updated_at
BEFORE UPDATE ON public.global_exceptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();