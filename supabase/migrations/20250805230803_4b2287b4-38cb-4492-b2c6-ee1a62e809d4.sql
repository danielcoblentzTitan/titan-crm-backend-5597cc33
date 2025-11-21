-- Add RLS policy for customers to view their project invoices
CREATE POLICY "Customers can view their project invoices" 
ON public.invoices 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = invoices.project_id 
    AND c.user_id = auth.uid()
  )
);