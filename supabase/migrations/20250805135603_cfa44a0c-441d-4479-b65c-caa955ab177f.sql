-- Allow customers to update change orders for their own projects (for approval)
CREATE POLICY "Customers can update their project change orders for approval" 
ON public.change_orders 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 
  FROM projects p 
  JOIN customers c ON c.id = p.customer_id 
  WHERE p.id = change_orders.project_id 
  AND c.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 
  FROM projects p 
  JOIN customers c ON c.id = p.customer_id 
  WHERE p.id = change_orders.project_id 
  AND c.user_id = auth.uid()
));