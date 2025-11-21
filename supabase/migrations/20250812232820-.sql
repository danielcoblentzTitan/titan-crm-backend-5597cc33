-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  related_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Builders can manage all notifications
CREATE POLICY "Builders can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- System can insert notifications
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Update the notification functions to use in-app notifications
CREATE OR REPLACE FUNCTION notify_new_price_request()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text := 'https://rviwdobaeyhnwzkinefj.supabase.co';
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aXdkb2JhZXlobnd6a2luZWZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNTYyNSwiZXhwIjoyMDY2NjExNjI1fQ.aHXvWWKOxGxnpHyXXWKsIyXaR8cK0fLgP9pGdCf5Sko';
BEGIN
  -- Only notify if there's an assigned estimator
  IF NEW.assigned_estimator_id IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := supabase_url || '/functions/v1/send-in-app-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'type', 'new_request',
          'price_request_id', NEW.id
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_price_request_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text := 'https://rviwdobaeyhnwzkinefj.supabase.co';
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aXdkb2JhZXlobnd6a2luZWZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNTYyNSwiZXhwIjoyMDY2NjExNjI1fQ.aHXvWWKOxGxnpHyXXWKsIyXaR8cK0fLgP9pGdCf5Sko';
BEGIN
  -- Only notify if status actually changed and there's a requester
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.requested_by_user_id IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := supabase_url || '/functions/v1/send-in-app-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'type', 'status_change',
          'price_request_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$;