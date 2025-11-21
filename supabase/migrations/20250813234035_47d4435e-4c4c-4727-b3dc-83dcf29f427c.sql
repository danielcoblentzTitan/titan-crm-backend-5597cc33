-- Fix constraint issues with punchlist_items table
-- Remove problematic constraints that might be causing update failures

-- Drop any potential duplicate or conflicting constraints
ALTER TABLE punchlist_items DROP CONSTRAINT IF EXISTS unique_project_location_description;

-- Ensure the table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_punchlist_items_project_id ON punchlist_items(project_id);
CREATE INDEX IF NOT EXISTS idx_punchlist_items_status ON punchlist_items(status);
CREATE INDEX IF NOT EXISTS idx_punchlist_items_due_date ON punchlist_items(due_date);

-- Update the updated_at column to use a trigger instead of default
DROP TRIGGER IF EXISTS update_punchlist_item_updated_at ON punchlist_items;

CREATE TRIGGER update_punchlist_item_updated_at
    BEFORE UPDATE ON punchlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();