
-- Update the leads table to add assignment notifications and better tracking
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create an index for better performance on status filtering
CREATE INDEX IF NOT EXISTS idx_leads_status_priority ON public.leads(status, priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_status ON public.leads(assigned_to, status);

-- Create a function to automatically convert won leads to customers
CREATE OR REPLACE FUNCTION convert_lead_to_customer()
RETURNS TRIGGER AS $$
DECLARE
    customer_id UUID;
BEGIN
    -- Only proceed if status changed to 'Won' and not already converted
    IF NEW.status = 'Won' AND OLD.status != 'Won' AND NEW.converted_to_customer_id IS NULL THEN
        -- Insert new customer
        INSERT INTO public.customers (
            name, 
            email, 
            phone, 
            address, 
            city, 
            state, 
            zip,
            notes
        ) VALUES (
            NEW.first_name || ' ' || NEW.last_name,
            NEW.email,
            NEW.phone,
            NEW.address,
            NEW.city,
            NEW.state,
            NEW.zip,
            'Converted from lead on ' || NOW()::date || '. Original estimated value: $' || NEW.estimated_value
        )
        RETURNING id INTO customer_id;
        
        -- Update the lead with the customer reference
        UPDATE public.leads 
        SET converted_to_customer_id = customer_id
        WHERE id = NEW.id;
        
        -- Set the NEW record for the trigger return
        NEW.converted_to_customer_id = customer_id;
    END IF;
    
    -- Archive lost leads
    IF NEW.status = 'Lost' AND OLD.status != 'Lost' AND NEW.archived_at IS NULL THEN
        NEW.archived_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS lead_status_change_trigger ON public.leads;
CREATE TRIGGER lead_status_change_trigger
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION convert_lead_to_customer();

-- Create a notification table for lead assignments
CREATE TABLE IF NOT EXISTS public.lead_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL DEFAULT 'assignment', -- assignment, status_change, follow_up
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.lead_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Builders can view all notifications" 
  ON public.lead_notifications 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

CREATE POLICY "Team members can view their notifications" 
  ON public.lead_notifications 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() AND id = lead_notifications.team_member_id
  ));

CREATE POLICY "Builders can insert notifications" 
  ON public.lead_notifications 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

-- Function to create notification when lead is assigned
CREATE OR REPLACE FUNCTION create_lead_assignment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if assigned_to changed and is not null
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
        INSERT INTO public.lead_notifications (
            lead_id,
            team_member_id,
            notification_type,
            message
        ) VALUES (
            NEW.id,
            NEW.assigned_to,
            'assignment',
            'New lead assigned: ' || NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.company || ')'
        );
        
        -- Update the assigned date
        NEW.assigned_date = NOW();
        NEW.notification_sent = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the assignment notification trigger
DROP TRIGGER IF EXISTS lead_assignment_notification_trigger ON public.leads;
CREATE TRIGGER lead_assignment_notification_trigger
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION create_lead_assignment_notification();

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_lead_notifications_team_member ON public.lead_notifications(team_member_id);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_read ON public.lead_notifications(team_member_id, read_at);
