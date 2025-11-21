-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('builder', 'customer')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_path TEXT,
  file_name TEXT,
  is_customer_facing BOOLEAN NOT NULL DEFAULT false,
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_by JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Builders can manage all messages" 
ON public.messages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their customer-facing messages" 
ON public.messages 
FOR SELECT 
USING (
  is_customer_facing = true AND 
  EXISTS (
    SELECT 1 FROM projects p 
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = messages.project_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can create messages for their projects" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  is_customer_facing = true AND 
  sender_type = 'customer' AND
  EXISTS (
    SELECT 1 FROM projects p 
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = messages.project_id AND c.user_id = auth.uid()
  )
);

-- Add foreign key constraint
ALTER TABLE public.messages 
ADD CONSTRAINT messages_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_messages_project_id ON public.messages(project_id);
CREATE INDEX idx_messages_parent_id ON public.messages(parent_message_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_message_timestamp();