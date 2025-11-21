-- Clear all existing data to start fresh
-- Delete in order to respect foreign key constraints

-- Clear design selection versions first
DELETE FROM public.design_selection_versions;

-- Clear design selection documents
DELETE FROM public.design_selection_documents;

-- Clear invoice items first
DELETE FROM public.invoice_items;

-- Clear invoices
DELETE FROM public.invoices;

-- Clear lead activities
DELETE FROM public.lead_activities;

-- Clear lead notifications
DELETE FROM public.lead_notifications;

-- Clear lead documents
DELETE FROM public.lead_documents;

-- Clear project costs
DELETE FROM public.project_costs;

-- Clear activities
DELETE FROM public.activities;

-- Clear customer invites
DELETE FROM public.customer_invites;

-- Clear leads (before customers due to foreign key)
DELETE FROM public.leads;

-- Clear projects (before customers due to foreign key)
DELETE FROM public.projects;

-- Clear customers
DELETE FROM public.customers;

-- Clear team members
DELETE FROM public.team_members;