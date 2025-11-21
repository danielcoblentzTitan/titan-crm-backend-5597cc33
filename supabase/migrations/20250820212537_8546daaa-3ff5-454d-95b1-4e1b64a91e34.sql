-- Allow customers to view activities for their own projects
DO $$ BEGIN
  -- Create policy only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activities' AND policyname = 'Customers can view their project activities'
  ) THEN
    CREATE POLICY "Customers can view their project activities"
    ON public.activities
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.customers c ON c.id = p.customer_id
        WHERE p.id = activities.project_id AND c.user_id = auth.uid()
      )
    );
  END IF;
END $$;