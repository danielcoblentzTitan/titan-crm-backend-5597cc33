-- Add temporary policy to allow authenticated users to access estimates
CREATE POLICY "Authenticated users can view estimates (temporary)" 
ON public.estimates 
FOR SELECT 
USING (auth.role() = 'authenticated');