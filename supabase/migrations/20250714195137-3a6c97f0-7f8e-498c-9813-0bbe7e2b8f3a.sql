-- Create a dedicated table for design options with images
CREATE TABLE public.design_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.design_options ENABLE ROW LEVEL SECURITY;

-- Create policies for design options
CREATE POLICY "Design options are viewable by everyone" 
ON public.design_options 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Builders can manage design options" 
ON public.design_options 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- Insert some sample design options (these would be replaced with your actual data)
INSERT INTO public.design_options (name, category, subcategory, description, file_path, file_name, file_type, display_order) VALUES
('Metal Panel - Charcoal', 'siding', 'metal', 'Durable metal siding panel in charcoal gray', 'design-options/siding/metal-charcoal.jpg', 'metal-charcoal.jpg', 'image/jpeg', 1),
('Metal Panel - Barn Red', 'siding', 'metal', 'Classic barn red metal siding panel', 'design-options/siding/metal-barn-red.jpg', 'metal-barn-red.jpg', 'image/jpeg', 2),
('Vinyl Siding - White', 'siding', 'vinyl', 'Clean white vinyl siding', 'design-options/siding/vinyl-white.jpg', 'vinyl-white.jpg', 'image/jpeg', 3),
('Standing Seam - Galvalume', 'roofing', 'metal', 'Galvalume standing seam metal roofing', 'design-options/roofing/standing-seam-galvalume.jpg', 'standing-seam-galvalume.jpg', 'image/jpeg', 1),
('Asphalt Shingles - Charcoal', 'roofing', 'shingles', 'Architectural shingles in charcoal', 'design-options/roofing/shingles-charcoal.jpg', 'shingles-charcoal.jpg', 'image/jpeg', 2),
('Luxury Vinyl Plank - Oak', 'flooring', 'vinyl', 'Oak-look luxury vinyl plank flooring', 'design-options/flooring/lvp-oak.jpg', 'lvp-oak.jpg', 'image/jpeg', 1),
('Porcelain Tile - Wood Look', 'flooring', 'tile', 'Wood-look porcelain tile flooring', 'design-options/flooring/porcelain-wood.jpg', 'porcelain-wood.jpg', 'image/jpeg', 2),
('Shaker Style - White', 'cabinets', 'shaker', 'Classic white shaker style cabinets', 'design-options/cabinets/shaker-white.jpg', 'shaker-white.jpg', 'image/jpeg', 1),
('Shaker Style - Gray', 'cabinets', 'shaker', 'Modern gray shaker style cabinets', 'design-options/cabinets/shaker-gray.jpg', 'shaker-gray.jpg', 'image/jpeg', 2),
('Quartz - White Carrara', 'countertops', 'quartz', 'White Carrara look quartz countertop', 'design-options/countertops/quartz-carrara.jpg', 'quartz-carrara.jpg', 'image/jpeg', 1),
('Granite - Black Pearl', 'countertops', 'granite', 'Black Pearl granite countertop', 'design-options/countertops/granite-black-pearl.jpg', 'granite-black-pearl.jpg', 'image/jpeg', 2),
('Subway Tile - White', 'tile', 'ceramic', 'Classic white subway tile', 'design-options/tile/subway-white.jpg', 'subway-white.jpg', 'image/jpeg', 1),
('Mosaic Tile - Gray', 'tile', 'glass', 'Gray glass mosaic tile', 'design-options/tile/mosaic-gray.jpg', 'mosaic-gray.jpg', 'image/jpeg', 2),
('Casement - White', 'windows', 'vinyl', 'White vinyl casement windows', 'design-options/windows/casement-white.jpg', 'casement-white.jpg', 'image/jpeg', 1),
('Double Hung - Bronze', 'windows', 'vinyl', 'Bronze vinyl double hung windows', 'design-options/windows/double-hung-bronze.jpg', 'double-hung-bronze.jpg', 'image/jpeg', 2),
('Steel Entry - Black', 'doors', 'steel', 'Black steel entry door', 'design-options/doors/steel-black.jpg', 'steel-black.jpg', 'image/jpeg', 1),
('Fiberglass - Wood Grain', 'doors', 'fiberglass', 'Wood grain fiberglass door', 'design-options/doors/fiberglass-wood.jpg', 'fiberglass-wood.jpg', 'image/jpeg', 2),
('Brushed Nickel', 'hardware', 'metal', 'Brushed nickel door hardware', 'design-options/hardware/brushed-nickel.jpg', 'brushed-nickel.jpg', 'image/jpeg', 1),
('Oil Rubbed Bronze', 'hardware', 'metal', 'Oil rubbed bronze hardware', 'design-options/hardware/oil-rubbed-bronze.jpg', 'oil-rubbed-bronze.jpg', 'image/jpeg', 2),
('Modern Vanity Light', 'fixtures', 'lighting', 'Modern bathroom vanity light fixture', 'design-options/fixtures/vanity-modern.jpg', 'vanity-modern.jpg', 'image/jpeg', 1),
('Traditional Chandelier', 'fixtures', 'lighting', 'Traditional dining room chandelier', 'design-options/fixtures/chandelier-traditional.jpg', 'chandelier-traditional.jpg', 'image/jpeg', 2);

-- Create trigger for updated_at
CREATE TRIGGER update_design_options_updated_at
BEFORE UPDATE ON public.design_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_design_options_category ON public.design_options(category);
CREATE INDEX idx_design_options_active ON public.design_options(is_active);
CREATE INDEX idx_design_options_display_order ON public.design_options(display_order);