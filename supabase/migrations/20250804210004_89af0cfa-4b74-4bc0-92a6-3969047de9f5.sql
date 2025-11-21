-- Add payment plan fields to change_orders table
ALTER TABLE public.change_orders 
ADD COLUMN payment_plan_type text DEFAULT 'one_payment',
ADD COLUMN payment_plan_data jsonb DEFAULT '[]'::jsonb;