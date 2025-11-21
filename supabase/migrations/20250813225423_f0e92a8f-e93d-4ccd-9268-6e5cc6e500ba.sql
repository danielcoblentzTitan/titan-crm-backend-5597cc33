-- Phase 4: Analytics & Insights
-- Create punchlist analytics table
CREATE TABLE public.punchlist_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  overdue_items INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_completion_time_hours NUMERIC(10,2),
  items_by_priority JSONB NOT NULL DEFAULT '{}',
  items_by_status JSONB NOT NULL DEFAULT '{}',
  trend_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create punchlist time tracking table
CREATE TABLE public.punchlist_time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  punchlist_item_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 5: Integration & Customer Experience
-- Create punchlist notifications table (enhanced)
CREATE TABLE public.punchlist_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  customer_email TEXT,
  vendor_emails JSONB DEFAULT '[]',
  notification_types JSONB NOT NULL DEFAULT '["item_created", "item_completed", "overdue_items"]',
  email_frequency TEXT NOT NULL DEFAULT 'immediate', -- immediate, daily, weekly
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create punchlist exports table
CREATE TABLE public.punchlist_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  export_type TEXT NOT NULL DEFAULT 'pdf', -- pdf, excel, print
  filters_applied JSONB,
  file_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_punchlist_analytics_project_date ON punchlist_analytics(project_id, analytics_date);
CREATE INDEX idx_punchlist_time_tracking_item ON punchlist_time_tracking(punchlist_item_id);
CREATE INDEX idx_punchlist_notification_settings_project ON punchlist_notification_settings(project_id);
CREATE INDEX idx_punchlist_exports_project ON punchlist_exports(project_id);

-- Enable RLS
ALTER TABLE punchlist_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE punchlist_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE punchlist_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE punchlist_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Analytics
CREATE POLICY "Builders can manage punchlist analytics" ON punchlist_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Customers can view their project analytics" ON punchlist_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN customers c ON c.id = p.customer_id
      WHERE p.id = punchlist_analytics.project_id 
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for Time Tracking
CREATE POLICY "Builders can manage time tracking" ON punchlist_time_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

-- RLS Policies for Notification Settings
CREATE POLICY "Builders can manage notification settings" ON punchlist_notification_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Customers can view their project notification settings" ON punchlist_notification_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN customers c ON c.id = p.customer_id
      WHERE p.id = punchlist_notification_settings.project_id 
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for Exports
CREATE POLICY "Builders can manage exports" ON punchlist_exports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Customers can view their project exports" ON punchlist_exports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN customers c ON c.id = p.customer_id
      WHERE p.id = punchlist_exports.project_id 
      AND c.user_id = auth.uid()
    )
  );

-- Create function to update analytics daily
CREATE OR REPLACE FUNCTION update_punchlist_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics for the project
  INSERT INTO punchlist_analytics (
    project_id,
    analytics_date,
    total_items,
    completed_items,
    overdue_items,
    completion_rate,
    items_by_priority,
    items_by_status
  )
  SELECT 
    NEW.project_id,
    CURRENT_DATE,
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE status = 'Completed') as completed_items,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'Completed') as overdue_items,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'Completed')::NUMERIC / COUNT(*)) * 100, 
      2
    ) as completion_rate,
    jsonb_build_object(
      'High', COUNT(*) FILTER (WHERE priority = 'High'),
      'Medium', COUNT(*) FILTER (WHERE priority = 'Medium'),
      'Low', COUNT(*) FILTER (WHERE priority = 'Low')
    ) as items_by_priority,
    jsonb_build_object(
      'Open', COUNT(*) FILTER (WHERE status = 'Open'),
      'In Progress', COUNT(*) FILTER (WHERE status = 'In Progress'),
      'Completed', COUNT(*) FILTER (WHERE status = 'Completed')
    ) as items_by_status
  FROM punchlist_items 
  WHERE project_id = NEW.project_id
  ON CONFLICT (project_id, analytics_date) 
  DO UPDATE SET
    total_items = EXCLUDED.total_items,
    completed_items = EXCLUDED.completed_items,
    overdue_items = EXCLUDED.overdue_items,
    completion_rate = EXCLUDED.completion_rate,
    items_by_priority = EXCLUDED.items_by_priority,
    items_by_status = EXCLUDED.items_by_status,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analytics updates
CREATE TRIGGER update_analytics_on_punchlist_change
  AFTER INSERT OR UPDATE OR DELETE ON punchlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_punchlist_analytics();

-- Add triggers for timestamps
CREATE TRIGGER update_punchlist_analytics_timestamp
  BEFORE UPDATE ON punchlist_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_punchlist_notification_settings_timestamp
  BEFORE UPDATE ON punchlist_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();