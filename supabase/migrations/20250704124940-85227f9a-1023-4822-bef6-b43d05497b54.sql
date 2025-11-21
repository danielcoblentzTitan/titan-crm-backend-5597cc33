-- Create sticky notes table for bulletin board
CREATE TABLE public.sticky_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'yellow',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  attached_to_type TEXT CHECK (attached_to_type IN ('customer', 'team_member')),
  attached_to_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for sticky notes
CREATE POLICY "Builders can manage all sticky notes" 
ON public.sticky_notes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Team members can manage their own sticky notes" 
ON public.sticky_notes 
FOR ALL 
USING (
  created_by = auth.uid() OR 
  (attached_to_type = 'team_member' AND attached_to_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
  ))
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_sticky_note_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sticky_notes_updated_at
  BEFORE UPDATE ON public.sticky_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sticky_note_timestamp();