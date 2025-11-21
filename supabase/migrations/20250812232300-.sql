-- Create function to send new price request notification using environment variables
CREATE OR REPLACE FUNCTION notify_new_price_request()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url text := 'https://rviwdobaeyhnwzkinefj.supabase.co';
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aXdkb2JhZXlobnd6a2luZWZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNTYyNSwiZXhwIjoyMDY2NjExNjI1fQ.aHXvWWKOxGxnpHyXXWKsIyXaR8cK0fLgP9pGdCf5Sko';
BEGIN
  -- Only notify if there's an assigned estimator
  IF NEW.assigned_estimator_id IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := supabase_url || '/functions/v1/send-price-request-notifications',
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send status change notification using environment variables
CREATE OR REPLACE FUNCTION notify_price_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url text := 'https://rviwdobaeyhnwzkinefj.supabase.co';
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aXdkb2JhZXlobnd6a2luZWZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNTYyNSwiZXhwIjoyMDY2NjExNjI1fQ.aHXvWWKOxGxnpHyXXWKsIyXaR8cK0fLgP9pGdCf5Sko';
BEGIN
  -- Only notify if status actually changed and there's a requester
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.requested_by_user_id IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := supabase_url || '/functions/v1/send-price-request-notifications',
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
$$ LANGUAGE plpgsql SECURITY DEFINER;