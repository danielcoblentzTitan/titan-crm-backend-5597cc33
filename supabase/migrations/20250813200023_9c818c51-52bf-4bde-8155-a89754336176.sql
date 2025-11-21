-- Email-Native Vendor Management System Database Schema (Modified to avoid conflicts)

-- Enhanced vendors table with email integration (rename from existing basic vendor table)
CREATE TABLE public.vendors_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- VEN-### format
  name TEXT NOT NULL,
  trade TEXT,
  regions TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Probation', 'Inactive', 'Blacklisted')),
  rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  
  -- Primary contact info
  primary_contact_name TEXT,
  primary_email TEXT,
  phone TEXT,
  
  -- Email system integration
  inbound_alias TEXT UNIQUE, -- vendor+VEN-001@domain.com
  email_prefs JSONB DEFAULT '{
    "format": "html",
    "cc_list": [],
    "blackout_hours": [],
    "do_not_email": false
  }'::jsonb,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor contacts table
CREATE TABLE public.vendor_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor compliance documents
CREATE TABLE public.vendor_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('W9', 'COI', 'License', 'NDA', 'Other')),
  file_url TEXT,
  expires_on DATE,
  status TEXT NOT NULL DEFAULT 'Valid' CHECK (status IN ('Valid', 'Expiring', 'Expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor pricing items
CREATE TABLE public.vendor_price_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  sku TEXT,
  uom TEXT NOT NULL, -- unit of measure
  base_cost NUMERIC(12,2) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  region TEXT,
  notes TEXT,
  effective_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RFQs (Request for Quotes)
CREATE TABLE public.rfqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- RFQ-###
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id),
  project_id UUID REFERENCES public.projects(id),
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'Sent' CHECK (status IN ('Draft', 'Sent', 'Acknowledged', 'Quoted', 'Declined', 'Expired')),
  due_date DATE,
  quote_amount NUMERIC(12,2),
  quote_notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  object_alias TEXT UNIQUE, -- rfq+RFQ-###@domain.com
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- PO-###
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id),
  project_id UUID REFERENCES public.projects(id),
  rfq_id UUID REFERENCES public.rfqs(id), -- Can be created from RFQ
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Acknowledged', 'In Progress', 'Delivered', 'Completed')),
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  target_delivery DATE,
  actual_delivery DATE,
  attachments JSONB DEFAULT '[]'::jsonb,
  object_alias TEXT UNIQUE, -- po+PO-###@domain.com
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Schedule Requests
CREATE TABLE public.schedule_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- SCH-###
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id),
  project_id UUID REFERENCES public.projects(id),
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent', 'Acknowledged', 'Confirmed', 'Declined', 'Completed')),
  window_start TIMESTAMP WITH TIME ZONE,
  window_end TIMESTAMP WITH TIME ZONE,
  confirmed_date TIMESTAMP WITH TIME ZONE,
  crew_notes TEXT,
  object_alias TEXT UNIQUE, -- sched+SCH-###@domain.com
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor Change Requests
CREATE TABLE public.change_requests_vendor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- CHG-###
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id),
  project_id UUID REFERENCES public.projects(id),
  po_id UUID REFERENCES public.purchase_orders(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Acknowledged', 'Approved', 'Declined')),
  cost_impact NUMERIC(12,2) DEFAULT 0,
  schedule_impact_days INTEGER DEFAULT 0,
  vendor_response TEXT,
  object_alias TEXT UNIQUE, -- chg+CHG-###@domain.com
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Warranty Tickets
CREATE TABLE public.warranty_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- SV-###
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id),
  project_id UUID REFERENCES public.projects(id),
  po_id UUID REFERENCES public.purchase_orders(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Acknowledged', 'In Progress', 'Resolved', 'Closed')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  resolution_notes TEXT,
  object_alias TEXT UNIQUE, -- svc+SV-###@domain.com
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor messages for email threading (separate from existing messages table)
CREATE TABLE public.vendor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_type TEXT NOT NULL CHECK (object_type IN ('vendor', 'rfq', 'po', 'schedule', 'change', 'warranty')),
  object_id UUID NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors_new(id),
  direction TEXT NOT NULL CHECK (direction IN ('Outbound', 'Inbound')),
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  from_email TEXT,
  to_emails TEXT[] DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  message_id TEXT, -- Email Message-ID header
  in_reply_to TEXT, -- In-Reply-To header
  delivered_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Sent' CHECK (status IN ('Sent', 'Delivered', 'Bounced', 'Parsed', 'Failed')),
  parsed_commands JSONB DEFAULT '[]'::jsonb, -- Commands found in email
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email delivery events
CREATE TABLE public.vendor_mail_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.vendor_messages(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('delivered', 'open', 'bounce', 'spam', 'unsubscribe')),
  meta JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email templates
CREATE TABLE public.vendor_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rfq', 'po', 'schedule', 'change', 'warranty', 'compliance')),
  subject_template TEXT NOT NULL,
  body_html_template TEXT NOT NULL,
  body_text_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_vendors_new_status ON public.vendors_new(status);
CREATE INDEX idx_vendors_new_trade ON public.vendors_new(trade);
CREATE INDEX idx_vendor_contacts_vendor_id ON public.vendor_contacts(vendor_id);
CREATE INDEX idx_vendor_compliance_vendor_id ON public.vendor_compliance(vendor_id);
CREATE INDEX idx_vendor_compliance_expires_on ON public.vendor_compliance(expires_on);
CREATE INDEX idx_vendor_messages_object ON public.vendor_messages(object_type, object_id);
CREATE INDEX idx_vendor_messages_vendor_id ON public.vendor_messages(vendor_id);
CREATE INDEX idx_vendor_messages_message_id ON public.vendor_messages(message_id);

-- RLS Policies
ALTER TABLE public.vendors_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_price_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests_vendor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_mail_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_email_templates ENABLE ROW LEVEL SECURITY;

-- Builders can manage all vendor data
CREATE POLICY "Builders can manage vendors" ON public.vendors_new FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage vendor contacts" ON public.vendor_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage vendor compliance" ON public.vendor_compliance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage vendor pricing" ON public.vendor_price_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage RFQs" ON public.rfqs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage purchase orders" ON public.purchase_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage schedule requests" ON public.schedule_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage change requests" ON public.change_requests_vendor FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage warranty tickets" ON public.warranty_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage vendor messages" ON public.vendor_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can view vendor mail events" ON public.vendor_mail_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

CREATE POLICY "Builders can manage vendor email templates" ON public.vendor_email_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder')
);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_vendors_new_updated_at BEFORE UPDATE ON public.vendors_new FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendor_compliance_updated_at BEFORE UPDATE ON public.vendor_compliance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedule_requests_updated_at BEFORE UPDATE ON public.schedule_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_change_requests_vendor_updated_at BEFORE UPDATE ON public.change_requests_vendor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warranty_tickets_updated_at BEFORE UPDATE ON public.warranty_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendor_email_templates_updated_at BEFORE UPDATE ON public.vendor_email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for auto-generation
CREATE OR REPLACE FUNCTION generate_vendor_code()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  vendor_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM vendors_new
  WHERE code ~ '^VEN-[0-9]+$';
  
  vendor_code := 'VEN-' || LPAD(next_num::TEXT, 3, '0');
  RETURN vendor_code;
END;
$$ LANGUAGE plpgsql;

-- Seed some initial vendor data
INSERT INTO public.vendors_new (code, name, trade, primary_email, phone, status, inbound_alias) VALUES
('VEN-001', 'Coastal Glass & Windows', 'Windows/Glazing', 'tanya@coastalglass.com', '(302) 555-0001', 'Active', 'vendor+VEN-001@titanbuildings.com'),
('VEN-002', 'First State Concrete', 'Concrete', 'lperez@firststateconcrete.com', '(302) 555-0002', 'Active', 'vendor+VEN-002@titanbuildings.com'),
('VEN-003', 'Delmarva Framing Co.', 'Framing', 'sean@delmarvaframing.com', '(410) 555-0003', 'Active', 'vendor+VEN-003@titanbuildings.com');

-- Seed email templates
INSERT INTO public.vendor_email_templates (name, category, subject_template, body_html_template, body_text_template) VALUES
('RFQ Initial Request', 'rfq', '[RFQ-{{rfq.code}}] Request for Quote – {{project.code}}', 
'<p>Hi {{vendor.name}},</p><p>Please provide a quote for: {{rfq.body}}</p><p>Due date: {{rfq.due_date}}</p><p>Reply with <strong>ACK</strong> to confirm receipt, <strong>QUOTE $12345</strong> when ready.</p><p>Best regards,<br>Titan Buildings Purchasing</p>',
'Hi {{vendor.name}},\n\nPlease provide a quote for: {{rfq.body}}\n\nDue date: {{rfq.due_date}}\n\nReply with ACK to confirm receipt, QUOTE $12345 when ready.\n\nBest regards,\nTitan Buildings Purchasing'),

('PO Issue', 'po', '[PO-{{po.code}}] Purchase Order – {{project.code}} (Acknowledgment Required)', 
'<p>Hi {{vendor.name}},</p><p>Attached is Purchase Order {{po.code}} totaling ${{po.total}}.</p><p>Please reply with <strong>ACK</strong> to confirm and <strong>DATE YYYY-MM-DD</strong> for target delivery.</p><p>Best regards,<br>Titan Buildings</p>',
'Hi {{vendor.name}},\n\nAttached is Purchase Order {{po.code}} totaling ${{po.total}}.\n\nPlease reply with ACK to confirm and DATE YYYY-MM-DD for target delivery.\n\nBest regards,\nTitan Buildings');