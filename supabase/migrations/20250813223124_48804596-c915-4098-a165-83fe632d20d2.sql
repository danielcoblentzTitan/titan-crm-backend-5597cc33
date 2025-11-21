-- Phase 1: Add bulk operations and due date management fields
-- Add columns for due date notifications and bulk operations
ALTER TABLE punchlist_items 
ADD COLUMN IF NOT EXISTS overdue_notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id);

-- Create simple index for better performance on due date queries
CREATE INDEX IF NOT EXISTS idx_punchlist_items_due_date ON punchlist_items(due_date);
CREATE INDEX IF NOT EXISTS idx_punchlist_items_status ON punchlist_items(status);

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