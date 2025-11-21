-- Enable Row Level Security on tables that are missing it
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Fix function search path issues by setting search_path for security-critical functions
ALTER FUNCTION public.update_design_document_timestamp() SET search_path = public;
ALTER FUNCTION public.create_customer_portal_access() SET search_path = public;
ALTER FUNCTION public.update_sticky_note_timestamp() SET search_path = public;
ALTER FUNCTION public.create_automated_milestones() SET search_path = public;
ALTER FUNCTION public.update_message_timestamp() SET search_path = public;
ALTER FUNCTION public.transfer_customer_documents_to_project() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.create_lead_assignment_notification() SET search_path = public;
ALTER FUNCTION public.convert_lead_to_customer() SET search_path = public;