-- Create change orders table
CREATE TABLE public.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost_impact NUMERIC DEFAULT 0,
  schedule_impact_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
  requested_by TEXT,
  requested_date TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id),
  approved_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create digital signatures table
CREATE TABLE public.digital_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID, -- Generic reference to any document
  document_type TEXT NOT NULL, -- 'invoice', 'contract', 'change_order', etc.
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_data TEXT NOT NULL, -- Base64 encoded signature
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment reminders table
CREATE TABLE public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'overdue' CHECK (reminder_type IN ('due_soon', 'overdue', 'final_notice')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  days_overdue INTEGER DEFAULT 0,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create project milestones table
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  target_date DATE,
  completed_date DATE,
  is_completed BOOLEAN DEFAULT false,
  is_automated BOOLEAN DEFAULT true,
  trigger_phase TEXT, -- Which project phase triggers this milestone
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Change orders policies
CREATE POLICY "Builders can manage change orders" ON public.change_orders
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Customers can view their project change orders" ON public.change_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    JOIN customers c ON c.id = p.customer_id 
    WHERE p.id = change_orders.project_id AND c.user_id = auth.uid()
  )
);

-- Digital signatures policies  
CREATE POLICY "Builders can manage digital signatures" ON public.digital_signatures
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

-- Payment reminders policies
CREATE POLICY "Builders can manage payment reminders" ON public.payment_reminders
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

-- Project milestones policies
CREATE POLICY "Builders can manage project milestones" ON public.project_milestones
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Customers can view their project milestones" ON public.project_milestones
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    JOIN customers c ON c.id = p.customer_id 
    WHERE p.id = project_milestones.project_id AND c.user_id = auth.uid()
  )
);

-- Add payment status to invoices if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE public.invoices ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
END $$;

-- Create function to auto-create milestones when project phase changes
CREATE OR REPLACE FUNCTION public.create_automated_milestones()
RETURNS TRIGGER AS $$
BEGIN
  -- When project moves to a new phase, create/update milestones
  IF NEW.phase IS DISTINCT FROM OLD.phase AND NEW.phase IS NOT NULL THEN
    INSERT INTO public.project_milestones (
      project_id,
      milestone_name,
      target_date,
      trigger_phase,
      is_automated
    ) VALUES (
      NEW.id,
      NEW.phase || ' Completed',
      NEW.estimated_completion,
      NEW.phase,
      true
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automated milestones
CREATE TRIGGER create_milestones_on_phase_change
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_automated_milestones();