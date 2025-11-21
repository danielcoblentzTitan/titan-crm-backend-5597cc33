-- Create building layouts table
CREATE TABLE building_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Layout',
  building_width numeric DEFAULT 0,
  building_length numeric DEFAULT 0,
  building_height numeric DEFAULT 12,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  layout_data jsonb DEFAULT '{}',
  notes text
);

-- Create layout elements table
CREATE TABLE layout_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid REFERENCES building_layouts(id) ON DELETE CASCADE,
  element_type text NOT NULL,
  position_data jsonb NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE building_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_elements ENABLE ROW LEVEL SECURITY;

-- Create policies for building_layouts
CREATE POLICY "Builders can manage all building layouts" 
ON building_layouts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their own building layouts" 
ON building_layouts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM customers c 
  WHERE c.id = building_layouts.customer_id AND c.user_id = auth.uid()
));

-- Create policies for layout_elements
CREATE POLICY "Builders can manage all layout elements" 
ON layout_elements 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));

CREATE POLICY "Customers can view their layout elements" 
ON layout_elements 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM building_layouts bl
  JOIN customers c ON c.id = bl.customer_id
  WHERE bl.id = layout_elements.layout_id AND c.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_building_layouts_updated_at
  BEFORE UPDATE ON building_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();