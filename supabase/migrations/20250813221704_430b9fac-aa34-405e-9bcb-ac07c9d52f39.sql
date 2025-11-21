-- Enable real-time updates for punchlist_items table
ALTER TABLE public.punchlist_items REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.punchlist_items;