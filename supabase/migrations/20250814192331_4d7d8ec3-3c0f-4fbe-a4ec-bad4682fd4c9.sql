-- Fix security issues: Add search_path to functions

-- Update log_lead_stage_change function
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only log if stage actually changed
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        INSERT INTO public.lead_stage_history (lead_id, from_stage, to_stage, changed_by)
        VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());
        
        -- Update stage_entered_date
        NEW.stage_entered_date = now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update handle_quote_stage_change function
CREATE OR REPLACE FUNCTION public.handle_quote_stage_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- When stage changes to Quoted, set quote-related fields
    IF NEW.stage = 'Quoted' AND (OLD.stage IS NULL OR OLD.stage != 'Quoted') THEN
        NEW.quote_date = CURRENT_DATE;
        NEW.quote_valid_until = CURRENT_DATE + INTERVAL '30 days';
        NEW.sub_status = 'Recently Quoted';
        NEW.cadence_name = 'Quoted-3-touch';
        NEW.next_action_due_date = CURRENT_DATE + INTERVAL '3 days';
    END IF;
    
    -- When stage changes to Working and first_contact_date is null
    IF NEW.stage = 'Working' AND NEW.first_contact_date IS NULL THEN
        NEW.first_contact_date = now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update days_since_quote function
CREATE OR REPLACE FUNCTION public.days_since_quote(quote_date DATE)
RETURNS INTEGER 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
    IF quote_date IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN CURRENT_DATE - quote_date;
END;
$$;