
-- Add trigger to automatically convert leads to customers when status changes to 'Won'
CREATE OR REPLACE FUNCTION convert_lead_to_customer()
RETURNS TRIGGER AS $$
DECLARE
    customer_id UUID;
BEGIN
    -- Only proceed if status changed to 'Won' and not already converted
    IF NEW.status = 'Won' AND (OLD.status IS NULL OR OLD.status != 'Won') AND NEW.converted_to_customer_id IS NULL THEN
        -- Insert new customer
        INSERT INTO public.customers (
            name, 
            email, 
            phone, 
            address, 
            city, 
            state, 
            zip,
            notes
        ) VALUES (
            NEW.first_name || ' ' || NEW.last_name,
            NEW.email,
            NEW.phone,
            NEW.address,
            NEW.city,
            NEW.state,
            NEW.zip,
            'Converted from lead on ' || NOW()::date || '. Original estimated value: $' || COALESCE(NEW.estimated_value, 0)
        )
        RETURNING id INTO customer_id;
        
        -- Update the lead with the customer reference
        NEW.converted_to_customer_id = customer_id;
    END IF;
    
    -- Archive lost leads
    IF NEW.status = 'Lost' AND (OLD.status IS NULL OR OLD.status != 'Lost') AND NEW.archived_at IS NULL THEN
        NEW.archived_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lead conversion
DROP TRIGGER IF EXISTS trigger_convert_lead_to_customer ON leads;
CREATE TRIGGER trigger_convert_lead_to_customer
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION convert_lead_to_customer();
