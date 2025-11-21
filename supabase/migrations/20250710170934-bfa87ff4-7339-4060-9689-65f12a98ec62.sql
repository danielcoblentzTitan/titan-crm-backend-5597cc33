-- Fix storage policies for camera uploads to work
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Builders can manage all documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploaded documents" ON storage.objects;

-- Create more permissive policies for documents bucket
-- Allow all authenticated users to upload to documents bucket
CREATE POLICY "Allow authenticated uploads to documents bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view documents in the bucket
CREATE POLICY "Allow authenticated access to documents bucket" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update documents in the bucket
CREATE POLICY "Allow authenticated updates to documents bucket" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete documents in the bucket
CREATE POLICY "Allow authenticated deletes to documents bucket" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);