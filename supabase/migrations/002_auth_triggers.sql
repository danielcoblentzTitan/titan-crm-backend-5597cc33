
-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Additional RLS policies for remaining tables
CREATE POLICY "Builders can manage all invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Customers can view their invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.customers c ON c.email = p.email
      WHERE p.id = auth.uid() AND p.role = 'customer' AND c.id = invoices.customer_id
    )
  );

CREATE POLICY "Builders can manage all invoice items" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Builders can manage all project costs" ON public.project_costs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Builders can manage all vendors" ON public.vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Builders can manage all activities" ON public.activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Customers can view project activities" ON public.activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.customers c ON c.email = p.email
      JOIN public.projects pr ON pr.customer_id = c.id
      WHERE p.id = auth.uid() AND p.role = 'customer' AND pr.id = activities.project_id
    )  
  );

CREATE POLICY "Builders can manage all documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Customers can view project documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.customers c ON c.email = p.email
      JOIN public.projects pr ON pr.customer_id = c.id
      WHERE p.id = auth.uid() AND p.role = 'customer' AND pr.id = documents.project_id
    )
  );

CREATE POLICY "Builders can manage all schedules" ON public.schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
    )
  );

CREATE POLICY "Customers can view project schedules" ON public.schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.customers c ON c.email = p.email
      JOIN public.projects pr ON pr.customer_id = c.id
      WHERE p.id = auth.uid() AND p.role = 'customer' AND pr.id = schedules.project_id
    )
  );
