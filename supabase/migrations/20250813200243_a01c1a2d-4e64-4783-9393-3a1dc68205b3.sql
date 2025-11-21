-- Fix security warnings for function search paths
CREATE OR REPLACE FUNCTION generate_vendor_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_num INTEGER;
  vendor_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM vendors_new
  WHERE code ~ '^VEN-[0-9]+$';
  
  vendor_code := 'VEN-' || LPAD(next_num::TEXT, 3, '0');
  RETURN vendor_code;
END;
$$;