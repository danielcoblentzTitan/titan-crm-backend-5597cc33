-- Create master_interior_selections table
CREATE TABLE public.master_interior_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Flooring defaults
  default_flooring_product_id UUID,
  default_flooring_material TEXT,
  default_flooring_color TEXT,
  default_flooring_finish TEXT,
  
  -- Paint defaults
  default_wall_paint_color TEXT,
  default_wall_paint_brand TEXT,
  default_ceiling_paint_color TEXT,
  default_ceiling_paint_brand TEXT,
  
  -- Trim & Doors
  default_trim_color TEXT,
  default_trim_style TEXT,
  default_baseboard_style TEXT,
  default_door_style TEXT,
  default_door_color TEXT,
  default_door_hardware_finish TEXT,
  
  -- Electrical
  default_outlet_switch_color TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id)
);

-- Create master_exterior_selections table
CREATE TABLE public.master_exterior_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Metal selections
  metal_siding_color TEXT,
  metal_siding_type TEXT,
  metal_roof_color TEXT,
  metal_roof_type TEXT,
  metal_trim_color TEXT,
  
  -- Porch/Entry
  porch_post_style TEXT,
  porch_post_color TEXT,
  porch_ceiling_material TEXT,
  porch_ceiling_color TEXT,
  
  -- Doors & Windows
  exterior_door_color TEXT,
  exterior_door_style TEXT,
  window_color TEXT,
  window_style TEXT,
  garage_door_color TEXT,
  garage_door_style TEXT,
  
  -- Stone & Concrete
  stone_wainscot_color TEXT,
  stone_wainscot_type TEXT,
  concrete_finish_type TEXT,
  
  -- Lighting
  exterior_lighting_style TEXT,
  exterior_lighting_finish TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id)
);

-- Create room_type_rules table
CREATE TABLE public.room_type_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  json_rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create flooring_products table
CREATE TABLE public.flooring_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  product_line TEXT,
  room_image_url TEXT,
  texture_image_url TEXT,
  material_type TEXT,
  color_family TEXT,
  finish_type TEXT,
  price_tier TEXT DEFAULT 'standard',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create metal_color_products table
CREATE TABLE public.metal_color_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_name TEXT NOT NULL,
  product_code TEXT,
  hex_color TEXT,
  category TEXT,
  finish_type TEXT,
  price_tier TEXT DEFAULT 'standard',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance selection_items table
ALTER TABLE public.selection_items 
ADD COLUMN IF NOT EXISTS uses_master_default BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS master_field_name TEXT,
ADD COLUMN IF NOT EXISTS is_overridden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS product_id UUID,
ADD COLUMN IF NOT EXISTS product_type TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_selection_items_master ON public.selection_items(uses_master_default, is_overridden);
CREATE INDEX IF NOT EXISTS idx_flooring_products_active ON public.flooring_products(is_active, material_type);
CREATE INDEX IF NOT EXISTS idx_metal_color_products_active ON public.metal_color_products(is_active, category);

-- Enable RLS
ALTER TABLE public.master_interior_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_exterior_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_type_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flooring_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metal_color_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage master interior selections"
ON public.master_interior_selections FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'builder_admin'::app_role));

CREATE POLICY "Admins can manage master exterior selections"
ON public.master_exterior_selections FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'builder_admin'::app_role));

CREATE POLICY "Everyone can view room type rules"
ON public.room_type_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage room type rules"
ON public.room_type_rules FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'builder_admin'::app_role));

CREATE POLICY "Everyone can view flooring products"
ON public.flooring_products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage flooring products"
ON public.flooring_products FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'builder_admin'::app_role));

CREATE POLICY "Everyone can view metal color products"
ON public.metal_color_products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage metal color products"
ON public.metal_color_products FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'builder_admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_master_interior_selections_updated_at
  BEFORE UPDATE ON public.master_interior_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_master_exterior_selections_updated_at
  BEFORE UPDATE ON public.master_exterior_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_type_rules_updated_at
  BEFORE UPDATE ON public.room_type_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flooring_products_updated_at
  BEFORE UPDATE ON public.flooring_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metal_color_products_updated_at
  BEFORE UPDATE ON public.metal_color_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();