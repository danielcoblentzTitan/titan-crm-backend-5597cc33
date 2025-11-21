
-- Create team_members table to track salespeople
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'salesperson',
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  source TEXT DEFAULT 'Website', -- Website, Referral, Cold Call, etc.
  status TEXT DEFAULT 'New', -- New, Contacted, Qualified, Proposal, Won, Lost
  priority TEXT DEFAULT 'Medium', -- Low, Medium, High
  assigned_to UUID REFERENCES public.team_members(id),
  estimated_value NUMERIC DEFAULT 0,
  notes TEXT,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  converted_to_customer_id UUID REFERENCES public.customers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_activities table for tracking interactions
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES public.team_members(id),
  activity_type TEXT NOT NULL, -- Call, Email, Meeting, Note
  subject TEXT,
  notes TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_members (builders can see all)
CREATE POLICY "Builders can view all team members" 
  ON public.team_members 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

CREATE POLICY "Builders can insert team members" 
  ON public.team_members 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

CREATE POLICY "Builders can update team members" 
  ON public.team_members 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

-- Create RLS policies for leads (builders can see all, salespeople can see their own)
CREATE POLICY "Builders can view all leads" 
  ON public.leads 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

CREATE POLICY "Team members can view their assigned leads" 
  ON public.leads 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() AND id = leads.assigned_to
  ));

CREATE POLICY "Builders can insert leads" 
  ON public.leads 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

CREATE POLICY "Builders can update all leads" 
  ON public.leads 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

CREATE POLICY "Team members can update their assigned leads" 
  ON public.leads 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() AND id = leads.assigned_to
  ));

-- Create RLS policies for lead_activities
CREATE POLICY "Builders can view all lead activities" 
  ON public.lead_activities 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

CREATE POLICY "Team members can view activities for their leads" 
  ON public.lead_activities 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.team_members tm ON tm.id = l.assigned_to
    WHERE l.id = lead_activities.lead_id AND tm.user_id = auth.uid()
  ));

CREATE POLICY "Builders can insert lead activities" 
  ON public.lead_activities 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'builder'
  ));

CREATE POLICY "Team members can insert activities for their leads" 
  ON public.lead_activities 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.team_members tm ON tm.id = l.assigned_to
    WHERE l.id = lead_activities.lead_id AND tm.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
