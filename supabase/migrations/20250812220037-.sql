-- Create price_requests table
CREATE TABLE IF NOT EXISTS public.price_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  requested_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_estimator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scope_summary text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  final_price_file text,
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Review', 'Need Info', 'Completed')),
  due_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create master_pricing_items table
CREATE TABLE IF NOT EXISTS public.master_pricing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  subcategory text,
  item_name text NOT NULL,
  sku text,
  vendor text,
  model text,
  dimensions text,
  spec text,
  uom text NOT NULL,
  base_cost numeric DEFAULT 0,
  markup_pct numeric DEFAULT 0,
  sell_price numeric GENERATED ALWAYS AS (base_cost * (1 + markup_pct / 100)) STORED,
  tax_class text,
  region text,
  lead_time_days integer NOT NULL CHECK (lead_time_days >= 0),
  warranty text,
  effective_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_status text DEFAULT 'Approved' CHECK (approval_status IN ('Approved', 'Pending', 'Rejected')),
  updated_at timestamp with time zone DEFAULT now(),
  dedupe_key text GENERATED ALWAYS AS (
    LOWER(TRIM(category)) || '|' || 
    LOWER(TRIM(COALESCE(subcategory, ''))) || '|' || 
    LOWER(TRIM(item_name)) || '|' || 
    LOWER(TRIM(COALESCE(sku, ''))) || '|' ||
    LOWER(TRIM(COALESCE(vendor, '')))
  ) STORED
);

-- Create pricing_lines table
CREATE TABLE IF NOT EXISTS public.pricing_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_request_id uuid REFERENCES public.price_requests(id) ON DELETE CASCADE,
  master_item_id uuid REFERENCES public.master_pricing_items(id) ON DELETE SET NULL,
  item_label text NOT NULL,
  qty numeric DEFAULT 1,
  uom text NOT NULL,
  unit_cost numeric DEFAULT 0,
  markup_pct numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  extended_price numeric GENERATED ALWAYS AS (qty * unit_price) STORED,
  notes text,
  lead_time_days integer NOT NULL CHECK (lead_time_days >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.price_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_requests
CREATE POLICY "Builders can manage all price requests" 
ON public.price_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Users can view their own requests or assigned requests" 
ON public.price_requests 
FOR SELECT 
USING (
  requested_by_user_id = auth.uid() OR 
  assigned_estimator_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
  )
);

CREATE POLICY "Users can create price requests" 
ON public.price_requests 
FOR INSERT 
WITH CHECK (requested_by_user_id = auth.uid());

CREATE POLICY "Estimators can update assigned requests" 
ON public.price_requests 
FOR UPDATE 
USING (
  assigned_estimator_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
  )
);

-- RLS Policies for master_pricing_items
CREATE POLICY "Everyone can view approved active master pricing items" 
ON public.master_pricing_items 
FOR SELECT 
USING (is_active = true AND approval_status = 'Approved');

CREATE POLICY "Builders and estimators can manage master pricing items" 
ON public.master_pricing_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role IN ('builder', 'estimator')
));

-- RLS Policies for pricing_lines
CREATE POLICY "Users can view pricing lines for accessible requests" 
ON public.pricing_lines 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM price_requests pr
  WHERE pr.id = pricing_lines.price_request_id
  AND (
    pr.requested_by_user_id = auth.uid() OR 
    pr.assigned_estimator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  )
));

CREATE POLICY "Estimators can manage pricing lines for assigned requests" 
ON public.pricing_lines 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM price_requests pr
  WHERE pr.id = pricing_lines.price_request_id
  AND (
    pr.assigned_estimator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  )
));

-- Create indexes for performance
CREATE INDEX idx_price_requests_project_id ON public.price_requests(project_id);
CREATE INDEX idx_price_requests_status ON public.price_requests(status);
CREATE INDEX idx_price_requests_assigned_estimator ON public.price_requests(assigned_estimator_id);
CREATE INDEX idx_price_requests_due_date ON public.price_requests(due_date);
CREATE INDEX idx_master_pricing_items_category ON public.master_pricing_items(category);
CREATE INDEX idx_master_pricing_items_dedupe_key ON public.master_pricing_items(dedupe_key);
CREATE INDEX idx_pricing_lines_request_id ON public.pricing_lines(price_request_id);

-- Create updated_at triggers
CREATE TRIGGER update_price_requests_updated_at
BEFORE UPDATE ON public.price_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_master_pricing_items_updated_at
BEFORE UPDATE ON public.master_pricing_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_lines_updated_at
BEFORE UPDATE ON public.pricing_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample master pricing items
INSERT INTO public.master_pricing_items (
  category, subcategory, item_name, sku, vendor, uom, base_cost, markup_pct, 
  lead_time_days, warranty, created_by_user_id
) VALUES 
  ('Materials', 'Steel', 'Steel Beam 20ft', 'SB-20', 'Steel Supply Co', 'each', 150.00, 35, 14, '1 Year', auth.uid()),
  ('Materials', 'Lumber', '2x4x8 Pressure Treated', 'PT-2x4x8', 'Lumber Yard', 'each', 8.50, 40, 7, '6 Months', auth.uid()),
  ('Hardware', 'Fasteners', 'Galvanized Bolts 1/2"', 'GB-0.5', 'Hardware Plus', 'box', 25.00, 50, 3, '1 Year', auth.uid()),
  ('Labor', 'Installation', 'Skilled Carpenter Hour', 'CARP-HR', 'Internal', 'hour', 45.00, 25, 0, 'N/A', auth.uid()),
  ('Equipment', 'Rental', 'Crane Daily Rental', 'CRANE-DAY', 'Equipment Rental', 'day', 500.00, 20, 5, 'N/A', auth.uid());