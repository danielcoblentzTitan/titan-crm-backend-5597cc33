-- Add RLS policy for customers to view their own records
CREATE POLICY "Customers can view their own records" 
ON customers 
FOR SELECT 
USING (auth.uid() = user_id);