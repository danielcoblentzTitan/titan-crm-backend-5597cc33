-- First, drop the triggers that depend on the functions
DROP TRIGGER IF EXISTS trigger_notify_price_request_status_change ON price_requests;
DROP TRIGGER IF EXISTS trigger_notify_new_price_request ON price_requests;

-- Now drop the functions
DROP FUNCTION IF EXISTS notify_price_request_status_change();
DROP FUNCTION IF EXISTS notify_new_price_request();

-- Create a simple notification log table instead
CREATE TABLE IF NOT EXISTS price_request_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_request_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  recipient_user_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE price_request_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON price_request_notifications 
FOR SELECT 
USING (recipient_user_id = auth.uid());

-- Create a simple function to log notifications instead of sending HTTP requests
CREATE OR REPLACE FUNCTION public.log_price_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log status change notifications
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.requested_by_user_id IS NOT NULL THEN
    INSERT INTO price_request_notifications (
      price_request_id,
      notification_type,
      recipient_user_id,
      message
    ) VALUES (
      NEW.id,
      'status_change',
      NEW.requested_by_user_id,
      'Price request status changed from ' || COALESCE(OLD.status, 'New') || ' to ' || NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for status changes
CREATE TRIGGER price_request_status_notification
  AFTER UPDATE ON price_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_price_request_notification();