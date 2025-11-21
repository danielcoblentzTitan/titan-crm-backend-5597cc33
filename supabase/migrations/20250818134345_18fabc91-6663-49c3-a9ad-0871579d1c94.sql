-- Create customer onboarding table to track welcome wizard progress
CREATE TABLE public.customer_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  project_id UUID NOT NULL,
  welcome_completed BOOLEAN DEFAULT false,
  timeline_viewed BOOLEAN DEFAULT false,
  communication_setup BOOLEAN DEFAULT false,
  dashboard_configured BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real-time chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'builder', 'team_member'
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file', 'system'
  reply_to_id UUID,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_by JSONB DEFAULT '[]'::jsonb,
  is_priority BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video call scheduling table
CREATE TABLE public.video_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  builder_id UUID,
  call_title TEXT NOT NULL,
  call_description TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_url TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  reminder_sent BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enhanced photo sharing table
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  uploader_type TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'builder', 'team_member'
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category TEXT, -- 'progress', 'issue', 'milestone', 'reference'
  phase_name TEXT,
  description TEXT,
  location_data JSONB, -- GPS coordinates, room/area info
  tags TEXT[] DEFAULT '{}',
  is_before_after BOOLEAN DEFAULT false,
  related_photo_id UUID, -- for before/after pairs
  customer_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

-- Customer onboarding policies
CREATE POLICY "Builders can manage all onboarding records" 
ON public.customer_onboarding 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can manage their own onboarding" 
ON public.customer_onboarding 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM customers 
  WHERE customers.id = customer_onboarding.customer_id 
  AND customers.user_id = auth.uid()
));

-- Chat messages policies
CREATE POLICY "Builders can manage all chat messages" 
ON public.chat_messages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view and create messages for their projects" 
ON public.chat_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects p 
  JOIN customers c ON c.id = p.customer_id 
  WHERE p.id = chat_messages.project_id AND c.user_id = auth.uid()
));

CREATE POLICY "Customers can insert messages for their projects" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects p 
  JOIN customers c ON c.id = p.customer_id 
  WHERE p.id = chat_messages.project_id AND c.user_id = auth.uid()
));

-- Video calls policies
CREATE POLICY "Builders can manage all video calls" 
ON public.video_calls 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can manage their project video calls" 
ON public.video_calls 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM customers 
  WHERE customers.id = video_calls.customer_id 
  AND customers.user_id = auth.uid()
));

-- Project photos policies
CREATE POLICY "Builders can manage all project photos" 
ON public.project_photos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their project photos" 
ON public.project_photos 
FOR SELECT 
USING (customer_visible = true AND EXISTS (
  SELECT 1 FROM projects p 
  JOIN customers c ON c.id = p.customer_id 
  WHERE p.id = project_photos.project_id AND c.user_id = auth.uid()
));

CREATE POLICY "Customers can upload photos to their projects" 
ON public.project_photos 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects p 
  JOIN customers c ON c.id = p.customer_id 
  WHERE p.id = project_photos.project_id AND c.user_id = auth.uid()
));

-- Add update timestamp triggers
CREATE TRIGGER update_customer_onboarding_updated_at
  BEFORE UPDATE ON public.customer_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_calls_updated_at
  BEFORE UPDATE ON public.video_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_photos_updated_at
  BEFORE UPDATE ON public.project_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat functionality
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

ALTER TABLE public.video_calls REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;