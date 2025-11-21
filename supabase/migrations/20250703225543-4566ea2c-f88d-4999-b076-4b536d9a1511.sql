-- Link existing auth user to customer record
WITH existing_user AS (
  SELECT id FROM auth.users WHERE email = 'dcoblentz@gmail.com'
)
UPDATE customers 
SET user_id = (SELECT id FROM existing_user),
    signed_up_at = NOW()
WHERE id = '78cb01c4-9f07-4443-b03f-63e8f7783e21';