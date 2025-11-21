-- Add signature_id field to change_orders table
ALTER TABLE public.change_orders 
ADD COLUMN signature_id UUID REFERENCES public.digital_signatures(id);