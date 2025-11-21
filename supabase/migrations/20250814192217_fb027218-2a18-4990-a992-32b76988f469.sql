-- Phase 1: Enhanced Lead Management Schema

-- First, let's add the new enums
CREATE TYPE lead_stage AS ENUM ('New', 'Working', 'Quoted', 'Negotiating', 'Committed', 'Won', 'Lost');
CREATE TYPE lead_sub_status AS ENUM ('Recently Quoted', 'Follow Up', 'In Decision Making', 'Pending Land/Budget', 'Current Customer', 'Move to Lost', 'Not Qualified');
CREATE TYPE timeline_enum AS ENUM ('0-3 Months', '3-6 Months', '6-12 Months', '12+ Months');
CREATE TYPE lost_reason_enum AS ENUM ('Budget', 'Timeline', 'Location', 'DIY', 'Competitor', 'No Response', 'Other');
CREATE TYPE cadence_name_enum AS ENUM ('Quoted-3-touch', 'Follow-up-2-3-days', 'Decision-weekly', 'Budget-monthly', 'Customer-quarterly');

-- Add new columns to leads table
ALTER TABLE public.leads 
ADD COLUMN stage lead_stage DEFAULT 'New',
ADD COLUMN sub_status lead_sub_status,
ADD COLUMN quote_date DATE,
ADD COLUMN stage_entered_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN first_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN quote_valid_until DATE,
ADD COLUMN customer_decision_by DATE,
ADD COLUMN next_action_due_date DATE,
ADD COLUMN cadence_name cadence_name_enum,
ADD COLUMN county TEXT,
ADD COLUMN timeline timeline_enum,
ADD COLUMN lost_reason lost_reason_enum,
ADD COLUMN lost_notes TEXT,
ADD COLUMN deals_active BOOLEAN DEFAULT true;

-- Create lead_cadences table for follow-up automation rules
CREATE TABLE public.lead_cadences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name cadence_name_enum NOT NULL UNIQUE,
    description TEXT,
    intervals_days INTEGER[] NOT NULL, -- Array of day intervals
    max_touches INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lead_follow_up_tasks table for scheduled actions
CREATE TABLE public.lead_follow_up_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL, -- 'call', 'email', 'quote_follow_up'
    due_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES public.team_members(id),
    notes TEXT,
    is_automated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lead_stage_history table for tracking stage transitions
CREATE TABLE public.lead_stage_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    from_stage lead_stage,
    to_stage lead_stage NOT NULL,
    changed_by UUID REFERENCES public.team_members(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT
);

-- Create email_templates table for automated communications
CREATE TABLE public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    template_type TEXT NOT NULL, -- 'estimate_sent', '3_day_nudge', 'decision_helper', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.lead_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_cadences
CREATE POLICY "Builders can manage lead cadences" ON public.lead_cadences
FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- RLS Policies for lead_follow_up_tasks
CREATE POLICY "Builders can manage all follow-up tasks" ON public.lead_follow_up_tasks
FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Team members can manage their assigned tasks" ON public.lead_follow_up_tasks
FOR ALL USING (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.user_id = auth.uid() AND team_members.id = lead_follow_up_tasks.assigned_to
));

-- RLS Policies for lead_stage_history
CREATE POLICY "Builders can view all stage history" ON public.lead_stage_history
FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- RLS Policies for email_templates
CREATE POLICY "Builders can manage email templates" ON public.email_templates
FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- Insert default cadences
INSERT INTO public.lead_cadences (name, description, intervals_days, max_touches) VALUES
('Quoted-3-touch', 'Follow-up sequence for recently quoted leads', ARRAY[3, 7, 14], 3),
('Follow-up-2-3-days', 'Standard follow-up for working leads', ARRAY[2, 5, 10], 3),
('Decision-weekly', 'Weekly check-ins for decision making stage', ARRAY[7, 14, 21], 3),
('Budget-monthly', 'Monthly follow-up for budget pending leads', ARRAY[30, 60, 90], 3),
('Customer-quarterly', 'Quarterly check-in for current customers', ARRAY[90, 180, 270], 3);

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, body_html, template_type) VALUES
('estimate_sent', 'Your Building Estimate from Titan Buildings', 
'<p>Hi {{first_name}},</p><p>Thank you for your interest in Titan Buildings. Please find your detailed estimate attached.</p><p>This estimate is valid until {{quote_valid_until}}. Please let me know if you have any questions!</p><p>Best regards,<br>{{rep_name}}</p>', 
'estimate_sent'),
('3_day_nudge', 'Following up on your Titan Buildings estimate', 
'<p>Hi {{first_name}},</p><p>I wanted to follow up on the estimate I sent a few days ago. Do you have any questions about the proposal?</p><p>I''m here to help make your building project a reality!</p><p>Best regards,<br>{{rep_name}}</p>', 
'3_day_nudge'),
('decision_helper', 'Ready to move forward with your building project?', 
'<p>Hi {{first_name}},</p><p>I hope you''ve had time to review the estimate. I''m excited about the possibility of working together on your {{building_type}} project.</p><p>Are you ready to take the next step?</p><p>Best regards,<br>{{rep_name}}</p>', 
'decision_helper');

-- Create function to update stage history
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if stage actually changed
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        INSERT INTO public.lead_stage_history (lead_id, from_stage, to_stage, changed_by)
        VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());
        
        -- Update stage_entered_date
        NEW.stage_entered_date = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stage change logging
CREATE TRIGGER lead_stage_change_trigger
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.log_lead_stage_change();

-- Create function to auto-set quote-related fields
CREATE OR REPLACE FUNCTION public.handle_quote_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When stage changes to Quoted, set quote-related fields
    IF NEW.stage = 'Quoted' AND (OLD.stage IS NULL OR OLD.stage != 'Quoted') THEN
        NEW.quote_date = CURRENT_DATE;
        NEW.quote_valid_until = CURRENT_DATE + INTERVAL '30 days';
        NEW.sub_status = 'Recently Quoted';
        NEW.cadence_name = 'Quoted-3-touch';
        NEW.next_action_due_date = CURRENT_DATE + INTERVAL '3 days';
    END IF;
    
    -- When stage changes to Working and first_contact_date is null
    IF NEW.stage = 'Working' AND NEW.first_contact_date IS NULL THEN
        NEW.first_contact_date = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quote automation
CREATE TRIGGER quote_automation_trigger
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_quote_stage_change();

-- Create function to calculate days since quote (for use in queries)
CREATE OR REPLACE FUNCTION public.days_since_quote(quote_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF quote_date IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN CURRENT_DATE - quote_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add updated_at trigger to new tables
CREATE TRIGGER update_lead_cadences_updated_at
    BEFORE UPDATE ON public.lead_cadences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_follow_up_tasks_updated_at
    BEFORE UPDATE ON public.lead_follow_up_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();