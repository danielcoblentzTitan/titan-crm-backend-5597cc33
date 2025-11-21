-- Create table for statement versions
CREATE TABLE public.statement_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  statement_name TEXT NOT NULL,
  statement_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  file_path TEXT,
  UNIQUE(project_id, version_number)
);

-- Enable Row Level Security
ALTER TABLE public.statement_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for statement versions
CREATE POLICY "Builders can manage all statement versions" 
ON public.statement_versions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- Add foreign key constraint
ALTER TABLE public.statement_versions 
ADD CONSTRAINT statement_versions_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;