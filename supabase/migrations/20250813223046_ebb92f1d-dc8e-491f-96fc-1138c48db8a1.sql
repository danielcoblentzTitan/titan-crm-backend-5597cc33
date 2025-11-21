-- Phase 1: Add bulk operations and due date management fields
-- Add columns for due date notifications and bulk operations
ALTER TABLE punchlist_items 
ADD COLUMN IF NOT EXISTS overdue_notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id);

-- Create index for better performance on due date queries
CREATE INDEX IF NOT EXISTS idx_punchlist_items_due_date ON punchlist_items(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_punchlist_items_overdue ON punchlist_items(due_date, status) WHERE due_date < CURRENT_DATE AND status != 'Completed';

-- Create a function to check for overdue items
CREATE OR REPLACE FUNCTION get_overdue_punchlist_items(p_project_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  location TEXT,
  description TEXT,
  priority TEXT,
  due_date DATE,
  status TEXT,
  assigned_to_vendor TEXT,
  days_overdue INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id,
    pi.project_id,
    pi.location,
    pi.description,
    pi.priority,
    pi.due_date,
    pi.status,
    pi.assigned_to_vendor,
    (CURRENT_DATE - pi.due_date)::INTEGER as days_overdue
  FROM punchlist_items pi
  WHERE pi.due_date < CURRENT_DATE 
    AND pi.status != 'Completed'
    AND (p_project_id IS NULL OR pi.project_id = p_project_id)
  ORDER BY pi.due_date ASC;
END;
$$;

-- Create notification preferences table for future email notifications
CREATE TABLE IF NOT EXISTS punchlist_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'overdue', 'due_soon', 'completed'
  recipient_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE punchlist_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for builders to manage notifications
CREATE POLICY "Builders can manage punchlist notifications" ON punchlist_notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'builder'
  )
);

-- Add updated_at trigger for notifications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_punchlist_notifications_updated_at
    BEFORE UPDATE ON punchlist_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();