-- Update design-options bucket structure with comprehensive asset categories
-- The bucket already exists, so we'll just document the folder structure needed

-- Expected folder structure in design-options bucket:
-- /flooring/hardwood/ (wheat-sample.png, wheat-room.png, etc.)
-- /flooring/tile/ (alamosa-beige-sample.png, alamosa-beige-room.png, etc.)
-- /flooring/carpet/ (ash-gray-sample.png, ash-gray-room.png, etc.)
-- /flooring/lvp/ (luxury vinyl plank options)
-- /paint/interior/ (color samples and room applications)
-- /paint/exterior/ (exterior color combinations)
-- /fixtures/lighting/ (light fixture options)
-- /fixtures/plumbing/ (faucets, sinks, etc.)
-- /fixtures/hardware/ (door handles, cabinet pulls, etc.)
-- /cabinets/kitchen/ (cabinet door styles and finishes)
-- /cabinets/bathroom/ (vanity styles and finishes)
-- /countertops/ (granite, quartz, marble samples)
-- /roofing/ (shingle colors and materials)
-- /siding/ (siding colors and textures)
-- /windows-doors/ (window and door styles)
-- /appliances/ (appliance packages and finishes)

-- Create a design_asset_categories table to manage categories and subcategories
CREATE TABLE IF NOT EXISTS public.design_asset_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  subcategory_name text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  bucket_path text NOT NULL, -- e.g., 'flooring/hardwood'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on design_asset_categories
ALTER TABLE public.design_asset_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for design_asset_categories
CREATE POLICY "Design asset categories are viewable by everyone" 
ON public.design_asset_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Builders can manage design asset categories" 
ON public.design_asset_categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

-- Insert initial categories and subcategories
INSERT INTO public.design_asset_categories (category_name, subcategory_name, display_order, bucket_path) VALUES
-- Flooring
('Flooring', 'Hardwood', 1, 'flooring/hardwood'),
('Flooring', 'Tile', 2, 'flooring/tile'),
('Flooring', 'Carpet', 3, 'flooring/carpet'),
('Flooring', 'LVP', 4, 'flooring/lvp'),
-- Paint
('Paint', 'Interior', 10, 'paint/interior'),
('Paint', 'Exterior', 11, 'paint/exterior'),
-- Fixtures
('Fixtures', 'Lighting', 20, 'fixtures/lighting'),
('Fixtures', 'Plumbing', 21, 'fixtures/plumbing'),
('Fixtures', 'Hardware', 22, 'fixtures/hardware'),
-- Cabinets
('Cabinets', 'Kitchen', 30, 'cabinets/kitchen'),
('Cabinets', 'Bathroom', 31, 'cabinets/bathroom'),
-- Other categories
('Countertops', NULL, 40, 'countertops'),
('Roofing', NULL, 50, 'roofing'),
('Siding', NULL, 60, 'siding'),
('Windows & Doors', NULL, 70, 'windows-doors'),
('Appliances', NULL, 80, 'appliances');

-- Create updated_at trigger
CREATE TRIGGER update_design_asset_categories_updated_at
BEFORE UPDATE ON public.design_asset_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();