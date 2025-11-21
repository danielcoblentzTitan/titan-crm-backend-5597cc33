-- Temporarily make data publicly viewable for testing
CREATE POLICY "Public read access for testing users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read access for testing projects" ON public.projects_new FOR SELECT USING (true);
CREATE POLICY "Public read access for testing phases" ON public.phases_new FOR SELECT USING (true);