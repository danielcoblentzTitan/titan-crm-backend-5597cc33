-- Allow customers to upload documents to their own projects
CREATE POLICY "Customers can upload documents to their projects" 
ON project_documents 
FOR INSERT 
WITH CHECK (
  EXISTS ( 
    SELECT 1
    FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = project_documents.project_id 
    AND c.user_id = auth.uid()
  )
);