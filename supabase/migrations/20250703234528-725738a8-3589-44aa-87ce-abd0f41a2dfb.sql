-- Add RLS policy for customers to view their own projects
CREATE POLICY "Customers can view their own projects" 
ON projects 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM customers 
  WHERE customers.id = projects.customer_id 
  AND customers.user_id = auth.uid()
));