-- Allow customers to insert digital signatures for change orders they can access
CREATE POLICY "Customers can create digital signatures for change orders" 
ON public.digital_signatures 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM change_orders co
    JOIN projects p ON p.id = co.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE co.id = digital_signatures.document_id::uuid
    AND c.user_id = auth.uid()
    AND digital_signatures.document_type = 'change_order'
  )
);

-- Allow customers to view digital signatures for change orders they can access
CREATE POLICY "Customers can view digital signatures for their change orders" 
ON public.digital_signatures 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM change_orders co
    JOIN projects p ON p.id = co.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE co.id = digital_signatures.document_id::uuid
    AND c.user_id = auth.uid()
    AND digital_signatures.document_type = 'change_order'
  )
);