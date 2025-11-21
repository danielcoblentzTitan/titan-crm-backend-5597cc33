-- Create pricing categories and items tables
CREATE TABLE public.pricing_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pricing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES pricing_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit_type TEXT NOT NULL DEFAULT 'each', -- sq ft, linear ft, each, etc.
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_items ENABLE ROW LEVEL SECURITY;

-- Create policies for builders to manage pricing
CREATE POLICY "Builders can manage pricing categories" 
ON public.pricing_categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Builders can manage pricing items" 
ON public.pricing_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- Create update triggers
CREATE TRIGGER update_pricing_categories_updated_at
BEFORE UPDATE ON public.pricing_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_items_updated_at
BEFORE UPDATE ON public.pricing_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories and items based on EstimatingTool
INSERT INTO public.pricing_categories (name, description, sort_order) VALUES
('Structural', 'Structural components and framing', 1),
('Materials', 'Building materials and supplies', 2),
('Systems', 'Electrical, plumbing, and HVAC', 3),
('Finishes', 'Interior and exterior finishes', 4),
('Hardware', 'Doors, windows, and fixtures', 5);

-- Insert default pricing items
INSERT INTO public.pricing_items (category_id, name, unit_type, base_price, sort_order) 
SELECT 
  cat.id,
  item.name,
  item.unit_type,
  0.00,
  item.sort_order
FROM pricing_categories cat
CROSS JOIN (VALUES
  ('Structural', 'Metal Framing', 'sq ft', 1),
  ('Materials', 'Lumber', 'board ft', 2),
  ('Materials', 'Concrete', 'cubic yard', 3),
  ('Finishes', 'Roofing Material', 'sq ft', 4),
  ('Systems', 'Electrical Rough-in', 'each', 5),
  ('Systems', 'Plumbing Rough-in', 'each', 6),
  ('Materials', 'Insulation', 'sq ft', 7),
  ('Finishes', 'Drywall', 'sq ft', 8),
  ('Finishes', 'Flooring', 'sq ft', 9),
  ('Hardware', 'Doors & Windows', 'each', 10),
  ('Hardware', 'Fixtures & Hardware', 'each', 11),
  ('Finishes', 'Paint & Finishes', 'sq ft', 12)
) AS item(category, name, unit_type, sort_order)
WHERE cat.name = item.category;