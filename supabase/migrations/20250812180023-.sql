-- Create storage buckets for each CRM page/tab
INSERT INTO storage.buckets (id, name, public) VALUES 
('products', 'products', true),
('design-options', 'design-options', true),
('project-gallery', 'project-gallery', true),
('customer-portal', 'customer-portal', true),
('marketing-materials', 'marketing-materials', true);

-- Create RLS policies for products bucket
CREATE POLICY "Products images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload products images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update products images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete products images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Create RLS policies for design-options bucket
CREATE POLICY "Design options images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'design-options');

CREATE POLICY "Authenticated users can upload design options images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'design-options' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update design options images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'design-options' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete design options images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'design-options' AND auth.role() = 'authenticated');

-- Create RLS policies for project-gallery bucket
CREATE POLICY "Project gallery images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-gallery');

CREATE POLICY "Authenticated users can upload project gallery images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project-gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update project gallery images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'project-gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete project gallery images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'project-gallery' AND auth.role() = 'authenticated');

-- Create RLS policies for customer-portal bucket
CREATE POLICY "Customer portal images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-portal');

CREATE POLICY "Authenticated users can upload customer portal images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'customer-portal' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update customer portal images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'customer-portal' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete customer portal images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'customer-portal' AND auth.role() = 'authenticated');

-- Create RLS policies for marketing-materials bucket
CREATE POLICY "Marketing materials images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'marketing-materials');

CREATE POLICY "Authenticated users can upload marketing materials images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'marketing-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update marketing materials images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'marketing-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete marketing materials images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'marketing-materials' AND auth.role() = 'authenticated');