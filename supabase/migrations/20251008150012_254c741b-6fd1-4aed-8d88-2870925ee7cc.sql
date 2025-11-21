-- Create quick estimate settings table
CREATE TABLE IF NOT EXISTS public.quick_estimate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value NUMERIC NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quick estimates table
CREATE TABLE IF NOT EXISTS public.quick_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  build_type TEXT NOT NULL,
  living_sqft NUMERIC NOT NULL,
  shop_sqft NUMERIC DEFAULT 0,
  include_site_utilities BOOLEAN DEFAULT false,
  estimated_low NUMERIC NOT NULL,
  estimated_high NUMERIC NOT NULL,
  breakdown_data JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_estimate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_estimates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_estimate_settings
CREATE POLICY "Builders can view settings"
  ON public.quick_estimate_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Builders can manage settings"
  ON public.quick_estimate_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'builder'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'builder'
    )
  );

-- RLS Policies for quick_estimates
CREATE POLICY "Builders can view all quick estimates"
  ON public.quick_estimates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Builders can create quick estimates"
  ON public.quick_estimates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'builder'
    )
  );

-- Insert default rate settings
INSERT INTO public.quick_estimate_settings (setting_key, setting_value, description) VALUES
  ('shell_rate_low', 110, 'Shell Only - Low Rate ($/sq ft)'),
  ('shell_rate_high', 130, 'Shell Only - High Rate ($/sq ft)'),
  ('dried_in_rate_low', 140, 'Dried-In - Low Rate ($/sq ft)'),
  ('dried_in_rate_high', 160, 'Dried-In - High Rate ($/sq ft)'),
  ('turnkey_rate_low', 180, 'Turnkey - Low Rate ($/sq ft)'),
  ('turnkey_rate_high', 210, 'Turnkey - High Rate ($/sq ft)'),
  ('custom_rate_low', 200, 'Custom - Low Rate ($/sq ft)'),
  ('custom_rate_high', 250, 'Custom - High Rate ($/sq ft)'),
  ('shop_rate', 55, 'Shop/Garage Rate ($/sq ft)'),
  ('site_utilities_low', 30000, 'Site & Utilities - Low Allowance ($)'),
  ('site_utilities_high', 55000, 'Site & Utilities - High Allowance ($)')
ON CONFLICT (setting_key) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_quick_estimate_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quick_estimate_settings_updated_at
  BEFORE UPDATE ON public.quick_estimate_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quick_estimate_settings_timestamp();