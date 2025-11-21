-- Fix search path for functions to resolve security warnings
ALTER FUNCTION public.update_timestamp_column() SET search_path TO 'public';
ALTER FUNCTION public.handle_new_user() SET search_path TO 'public';
ALTER FUNCTION public.convert_lead_to_customer() SET search_path TO 'public';
ALTER FUNCTION public.create_lead_assignment_notification() SET search_path TO 'public';
ALTER FUNCTION public.auto_create_baseline_on_project_start() SET search_path TO 'public';
ALTER FUNCTION public.upsert_faq(text, text, text, text, text[], text, boolean) SET search_path TO 'public';