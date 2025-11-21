-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create estimates table to store and manage all estimates
CREATE TABLE public.estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_name TEXT NOT NULL,
  building_type TEXT NOT NULL DEFAULT 'Barndominium',
  dimensions TEXT,
  wall_height TEXT DEFAULT '12',
  estimated_price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  scope TEXT,
  timeline TEXT DEFAULT '90-120 days',
  notes TEXT,
  detailed_breakdown JSONB,
  status TEXT NOT NULL DEFAULT 'Draft',
  is_written_estimate BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

-- Create policies for estimates
CREATE POLICY "Builders can manage all estimates" 
ON public.estimates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_estimates_updated_at
BEFORE UPDATE ON public.estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint to leads
ALTER TABLE public.estimates 
ADD CONSTRAINT estimates_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE CASCADE;