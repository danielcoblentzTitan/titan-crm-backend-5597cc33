-- Disconnect dcoblentz@gmail.com from Nick and Rachael Fulford customer record
UPDATE customers 
SET user_id = NULL,
    signed_up_at = NULL
WHERE id = '78cb01c4-9f07-4443-b03f-63e8f7783e21';