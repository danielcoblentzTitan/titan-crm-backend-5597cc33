-- Ensure documents storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for documents bucket
DO $$
BEGIN
  -- Policy for builders to manage all documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Builders can manage all documents'
  ) THEN
    CREATE POLICY "Builders can manage all documents" 
    ON storage.objects 
    FOR ALL 
    USING (
      bucket_id = 'documents' AND 
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
      )
    );
  END IF;

  -- Policy for authenticated users to upload documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload documents" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (
      bucket_id = 'documents' AND 
      auth.role() = 'authenticated'
    );
  END IF;

  -- Policy for authenticated users to view documents they uploaded
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their uploaded documents'
  ) THEN
    CREATE POLICY "Users can view their uploaded documents" 
    ON storage.objects 
    FOR SELECT 
    USING (
      bucket_id = 'documents' AND 
      (auth.uid() = owner OR auth.role() = 'authenticated')
    );
  END IF;
END
$$;