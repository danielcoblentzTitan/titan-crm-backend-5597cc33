-- Enable real-time updates for mission control tables
-- This ensures that new projects and phases immediately appear in the master schedule

-- Set up replica identity for real-time on projects_new
ALTER TABLE public.projects_new REPLICA IDENTITY FULL;

-- Set up replica identity for real-time on project_phases
ALTER TABLE public.project_phases REPLICA IDENTITY FULL;

-- Set up replica identity for real-time on project_schedules
ALTER TABLE public.project_schedules REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already added
DO $$
BEGIN
  -- Add projects_new to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'projects_new'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects_new;
  END IF;

  -- Add project_phases to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'project_phases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_phases;
  END IF;

  -- Add project_schedules to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'project_schedules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_schedules;
  END IF;
END $$;