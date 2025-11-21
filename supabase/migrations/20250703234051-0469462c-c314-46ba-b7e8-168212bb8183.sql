-- Connect the dcoblentz@gmail.com user to the Nick and Rachael Fulford customer record
UPDATE customers 
SET user_id = '836947a0-8f14-43a6-bf1b-9658ea2e4421',
    signed_up_at = NOW()
WHERE id = '78cb01c4-9f07-4443-b03f-63e8f7783e21';