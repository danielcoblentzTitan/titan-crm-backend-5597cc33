-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to run phase progression check daily at midnight
SELECT cron.schedule(
  'daily-phase-progression',
  '0 0 * * *', -- Run daily at midnight
  $$
  SELECT
    net.http_post(
        url:='https://rviwdobaeyhnwzkinefj.supabase.co/functions/v1/check-phase-progression',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aXdkb2JhZXlobnd6a2luZWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzU2MjUsImV4cCI6MjA2NjYxMTYyNX0.Q8ftNrkzgnDrjxVy4wrYwzTyAM_7B4dKtcDfPB7N4dU"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);