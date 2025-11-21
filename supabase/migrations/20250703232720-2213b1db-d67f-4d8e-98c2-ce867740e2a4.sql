-- First unlink the user from the customer record
UPDATE customers 
SET user_id = NULL,
    signed_up_at = NULL
WHERE user_id = 'd5ee0aa4-b310-4432-9d12-0e650a5d1c65';

-- Remove the profile entry
DELETE FROM profiles WHERE id = 'd5ee0aa4-b310-4432-9d12-0e650a5d1c65';

-- Remove the auth user
DELETE FROM auth.users WHERE email = 'dcoblentz@gmail.com';