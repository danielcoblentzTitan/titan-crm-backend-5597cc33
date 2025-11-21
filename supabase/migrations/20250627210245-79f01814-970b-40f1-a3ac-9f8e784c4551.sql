
-- Create customer_invites table to track invitations
CREATE TABLE public.customer_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  invite_token UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.customer_invites ENABLE ROW LEVEL SECURITY;

-- Policy for builders to manage invites
CREATE POLICY "Builders can manage customer invites" 
  ON public.customer_invites 
  FOR ALL
  USING (true);

-- Add a column to customers table to track if they've signed up
ALTER TABLE public.customers 
ADD COLUMN user_id UUID REFERENCES auth.users(id),
ADD COLUMN signed_up_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX idx_customer_invites_token ON public.customer_invites(invite_token);
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
