-- Remove the unnecessary builder account that was just created
DELETE FROM auth.users WHERE email = 'builder@titanbuildings.com';