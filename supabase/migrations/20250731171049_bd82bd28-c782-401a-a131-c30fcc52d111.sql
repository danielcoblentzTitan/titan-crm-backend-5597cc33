-- Update the existing Fulford customer to use the test email
-- This assumes we'll create the auth user account manually in the Supabase dashboard

UPDATE public.customers 
SET email = 'fulford@customer.test'
WHERE name = 'Nick and Rachael Fulford';