-- Create punchlist_items table
CREATE TABLE public.punchlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  photo_url TEXT,
  assigned_to_user_id UUID REFERENCES public.profiles(id),
  assigned_to_vendor TEXT,
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Completed')) DEFAULT 'Open',
  source TEXT NOT NULL CHECK (source IN ('customer', 'internal')) DEFAULT 'internal',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.punchlist_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Builders can manage all punchlist items"
ON public.punchlist_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
  )
);

CREATE POLICY "Customers can view their project punchlist items"
ON public.punchlist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = punchlist_items.project_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update assigned items"
ON public.punchlist_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.id = punchlist_items.assigned_to_user_id
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_punchlist_items_updated_at
  BEFORE UPDATE ON public.punchlist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_punchlist_items_project_id ON public.punchlist_items(project_id);
CREATE INDEX idx_punchlist_items_status ON public.punchlist_items(status);
CREATE INDEX idx_punchlist_items_assigned_to ON public.punchlist_items(assigned_to_user_id);
CREATE INDEX idx_punchlist_items_due_date ON public.punchlist_items(due_date);