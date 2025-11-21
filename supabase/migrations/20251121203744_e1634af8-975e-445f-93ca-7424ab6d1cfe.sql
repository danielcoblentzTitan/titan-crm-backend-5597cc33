-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- RLS policies for product images bucket
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'builder_admin'::app_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'builder_admin'::app_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'builder_admin'::app_role)
);

-- Add image_url to metal_color_products if not exists
ALTER TABLE metal_color_products 
ADD COLUMN IF NOT EXISTS image_url text;

-- Create door_products table for entry and interior doors
CREATE TABLE IF NOT EXISTS door_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  door_type text NOT NULL, -- 'entry' or 'interior'
  style text,
  material text,
  color_options text[],
  glass_options text[],
  description text,
  image_url text,
  price_tier text DEFAULT 'standard',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on door_products
ALTER TABLE door_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for door_products
CREATE POLICY "Everyone can view door products"
ON door_products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage door products"
ON door_products FOR ALL
USING (has_role(auth.uid(), 'builder_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_door_products_updated_at
  BEFORE UPDATE ON door_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_door_products_type ON door_products(door_type);
CREATE INDEX idx_door_products_active ON door_products(is_active);
CREATE INDEX idx_door_products_sort ON door_products(sort_order);