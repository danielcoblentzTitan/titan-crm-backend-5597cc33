-- Create the actual triggers (they were missing from the previous migration)
CREATE TRIGGER trigger_notify_new_price_request
  AFTER INSERT ON price_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_price_request();

CREATE TRIGGER trigger_notify_price_request_status_change
  AFTER UPDATE ON price_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_price_request_status_change();