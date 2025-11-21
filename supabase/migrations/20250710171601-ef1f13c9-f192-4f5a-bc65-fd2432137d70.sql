-- Make documents bucket completely public for testing
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to documents bucket" ON storage.objects;

-- Create completely public policies for documents bucket
CREATE POLICY "Public upload to documents bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public access to documents bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents');

CREATE POLICY "Public update to documents bucket" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents');

CREATE POLICY "Public delete from documents bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents');