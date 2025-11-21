-- First, let's create the auth user for Fulford
-- Note: We'll create this user account manually since we can't directly insert into auth.users
-- Instead, we'll update the existing customer record to use a new user_id that we'll create

-- Create a new profile entry for the Fulford customer portal access
INSERT INTO public.profiles (id, email, full_name, role, phone)
VALUES (
  gen_random_uuid(),
  'fulford@customer.test',
  'Nick and Rachael Fulford',
  'customer',
  '302-222-3398'
);

-- We'll need to get the ID from this insert to update the customer record
-- Let's create a temporary function to handle this
CREATE OR REPLACE FUNCTION create_fulford_customer_access()
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Insert the profile and get the ID
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (
        gen_random_uuid(),
        'fulford@customer.test',
        'Nick and Rachael Fulford',
        'customer',
        '302-222-3398'
    )
    RETURNING id INTO new_user_id;
    
    -- Update the customer record to link to this new user
    UPDATE public.customers 
    SET user_id = new_user_id, email = 'fulford@customer.test'
    WHERE id = '78cb01c4-9f07-4443-b03f-63e8f7783e21';
    
    RETURN new_user_id;
END;
$$;

-- Execute the function
SELECT create_fulford_customer_access();