-- Phase 2: Communication & Enhanced Photo Management
-- Create comments system for punchlist items
CREATE TABLE IF NOT EXISTS punchlist_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  punchlist_item_id UUID NOT NULL REFERENCES punchlist_items(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE, -- internal comments vs customer-visible
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_punchlist_comments_item_id ON punchlist_comments(punchlist_item_id);
CREATE INDEX IF NOT EXISTS idx_punchlist_comments_created_at ON punchlist_comments(created_at);

-- Enable RLS for comments
ALTER TABLE punchlist_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Builders can manage all punchlist comments" ON punchlist_comments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'builder'
  )
);

CREATE POLICY "Customers can view customer-visible comments on their project items" ON punchlist_comments
FOR SELECT USING (
  is_internal = FALSE AND
  EXISTS (
    SELECT 1 FROM punchlist_items pi
    JOIN projects p ON p.id = pi.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE pi.id = punchlist_comments.punchlist_item_id
    AND c.user_id = auth.uid()
  )
);

-- Enhance punchlist_items for multiple photos and better tracking
ALTER TABLE punchlist_items 
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS before_photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS after_photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_comment_at TIMESTAMP WITH TIME ZONE;

-- Update existing single photo_url data to new photos array (if any exist)
UPDATE punchlist_items 
SET photos = jsonb_build_array(jsonb_build_object('url', photo_url, 'type', 'general', 'uploaded_at', created_at))
WHERE photo_url IS NOT NULL AND photos = '[]'::jsonb;

-- Create function to update last_comment_at when comments are added
CREATE OR REPLACE FUNCTION update_punchlist_item_last_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE punchlist_items 
  SET last_comment_at = NOW()
  WHERE id = NEW.punchlist_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updating last comment timestamp
CREATE TRIGGER update_punchlist_item_last_comment_trigger
  AFTER INSERT ON punchlist_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_punchlist_item_last_comment();

-- Create trigger for updating comments timestamp
CREATE TRIGGER update_punchlist_comments_updated_at
  BEFORE UPDATE ON punchlist_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();