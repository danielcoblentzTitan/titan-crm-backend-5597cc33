-- Phase 3: Templates & Mobile Optimization
-- Create punchlist templates system
CREATE TABLE IF NOT EXISTS punchlist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'room', 'trade', 'general'
  template_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE, -- can be used by all projects vs project-specific
  project_id UUID, -- NULL for public templates
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_punchlist_templates_category ON punchlist_templates(category);
CREATE INDEX IF NOT EXISTS idx_punchlist_templates_project_id ON punchlist_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_punchlist_templates_is_public ON punchlist_templates(is_public, is_active);

-- Enable RLS for templates
ALTER TABLE punchlist_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Builders can manage all templates" ON punchlist_templates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'builder'
  )
);

CREATE POLICY "Users can view public active templates" ON punchlist_templates
FOR SELECT USING (is_public = TRUE AND is_active = TRUE);

CREATE POLICY "Users can view their project templates" ON punchlist_templates
FOR SELECT USING (
  project_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = punchlist_templates.project_id
    AND c.user_id = auth.uid()
  )
);

-- Add mobile optimization fields to punchlist_items
ALTER TABLE punchlist_items 
ADD COLUMN IF NOT EXISTS gps_coordinates JSONB, -- {lat: number, lng: number, accuracy: number}
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS created_via_mobile BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offline_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced'; -- 'synced', 'pending', 'error'

-- Create trigger for templates timestamp
CREATE TRIGGER update_punchlist_templates_updated_at
  BEFORE UPDATE ON punchlist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default templates
INSERT INTO punchlist_templates (name, description, category, template_items, is_public, is_active) VALUES
(
  'Kitchen Inspection',
  'Common kitchen punchlist items for final inspection',
  'room',
  '[
    {"location": "Kitchen", "description": "Touch up paint on cabinet doors", "priority": "Low"},
    {"location": "Kitchen", "description": "Clean fingerprints from stainless steel appliances", "priority": "Low"},
    {"location": "Kitchen", "description": "Check all cabinet doors and drawers align properly", "priority": "Medium"},
    {"location": "Kitchen", "description": "Ensure all electrical outlets and switches work", "priority": "High"},
    {"location": "Kitchen", "description": "Verify garbage disposal functions properly", "priority": "Medium"},
    {"location": "Kitchen", "description": "Check for water leaks under sink", "priority": "High"}
  ]'::jsonb,
  TRUE,
  TRUE
),
(
  'Bathroom Final Check',
  'Standard bathroom completion checklist',
  'room',
  '[
    {"location": "Bathroom", "description": "Caulk around tub and shower areas", "priority": "Medium"},
    {"location": "Bathroom", "description": "Touch up tile grout where needed", "priority": "Low"},
    {"location": "Bathroom", "description": "Check all plumbing fixtures for leaks", "priority": "High"},
    {"location": "Bathroom", "description": "Ensure exhaust fan operates quietly", "priority": "Medium"},
    {"location": "Bathroom", "description": "Clean and polish all mirrors", "priority": "Low"},
    {"location": "Bathroom", "description": "Test GFCI outlets", "priority": "High"}
  ]'::jsonb,
  TRUE,
  TRUE
),
(
  'Electrical Walkthrough',
  'Electrical system final inspection items',
  'trade',
  '[
    {"location": "Electrical Panel", "description": "Label all circuit breakers clearly", "priority": "Medium"},
    {"location": "Throughout House", "description": "Test all GFCI outlets", "priority": "High"},
    {"location": "Throughout House", "description": "Verify all light switches operate correctly", "priority": "High"},
    {"location": "Throughout House", "description": "Check all outlet covers are installed", "priority": "Medium"},
    {"location": "Exterior", "description": "Test exterior lighting and outlets", "priority": "Medium"}
  ]'::jsonb,
  TRUE,
  TRUE
),
(
  'Paint & Finish Touch-ups',
  'Common paint and finishing items for completion',
  'trade',
  '[
    {"location": "Throughout House", "description": "Touch up nail holes in walls", "priority": "Low"},
    {"location": "Throughout House", "description": "Clean paint drips and splatters", "priority": "Low"},
    {"location": "Trim Work", "description": "Caulk gaps between trim and walls", "priority": "Medium"},
    {"location": "Doors", "description": "Touch up paint on door frames", "priority": "Low"},
    {"location": "Windows", "description": "Clean paint from window glass", "priority": "Low"}
  ]'::jsonb,
  TRUE,
  TRUE
);