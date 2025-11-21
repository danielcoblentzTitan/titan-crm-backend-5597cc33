-- Update the transfer function to only move statement files, not all customer documents
DROP FUNCTION IF EXISTS public.transfer_customer_documents_to_project() CASCADE;

-- Create updated function that only transfers statement documents
CREATE OR REPLACE FUNCTION public.transfer_customer_documents_to_project()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a project is created for a customer, only transfer statement-related documents
  IF TG_OP = 'INSERT' AND NEW.customer_id IS NOT NULL THEN
    -- Only copy statement documents (files with "Statement" or "COGS" in the name)
    INSERT INTO public.project_documents (
      project_id,
      file_name,
      file_path,
      file_type,
      file_size,
      customer_facing,
      uploaded_at,
      uploaded_by,
      notes
    )
    SELECT 
      NEW.id,
      cd.file_name,
      REPLACE(cd.file_path, 'customers/' || NEW.customer_id::text, 'projects/' || NEW.id::text),
      cd.file_type,
      cd.file_size,
      cd.customer_facing,
      cd.uploaded_at,
      cd.uploaded_by,
      cd.notes || ' (Transferred from customer)'
    FROM public.customer_documents cd
    WHERE cd.customer_id = NEW.customer_id
    AND (
      LOWER(cd.file_name) LIKE '%statement%' 
      OR LOWER(cd.file_name) LIKE '%cogs%'
      OR LOWER(cd.file_name) LIKE '%estimate%'
      OR LOWER(cd.file_name) LIKE '%fees%'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS transfer_customer_docs_on_project_creation ON public.projects;
CREATE TRIGGER transfer_customer_docs_on_project_creation
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.transfer_customer_documents_to_project();