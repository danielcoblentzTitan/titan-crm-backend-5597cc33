-- Add columns to capture all JotForm submission data

-- Basic project info
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS project_start_timeframe TEXT,
ADD COLUMN IF NOT EXISTS building_type TEXT,
ADD COLUMN IF NOT EXISTS building_width TEXT,
ADD COLUMN IF NOT EXISTS building_length TEXT,
ADD COLUMN IF NOT EXISTS wall_height TEXT;

-- Doors and windows
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS overhead_doors_count TEXT,
ADD COLUMN IF NOT EXISTS doors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS entry_doors_count TEXT,
ADD COLUMN IF NOT EXISTS windows_count TEXT,
ADD COLUMN IF NOT EXISTS doors_windows_notes TEXT;

-- Lean-To
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS wants_lean_to TEXT,
ADD COLUMN IF NOT EXISTS lean_to_options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lean_to_notes TEXT;

-- Additional options and features
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS additional_options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS building_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS other_options_notes TEXT;

-- Interior finishing
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS is_barndominium TEXT,
ADD COLUMN IF NOT EXISTS wants_interior_finished TEXT,
ADD COLUMN IF NOT EXISTS interior_finishing_options JSONB DEFAULT '[]'::jsonb;

-- Barndominium specific
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS has_acquired_land TEXT,
ADD COLUMN IF NOT EXISTS has_plans TEXT,
ADD COLUMN IF NOT EXISTS barndominium_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS site_needs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS barndominium_vision TEXT,
ADD COLUMN IF NOT EXISTS barndominium_files JSONB DEFAULT '[]'::jsonb;

-- Communication preferences
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS best_contact_time TEXT,
ADD COLUMN IF NOT EXISTS preferred_communication_method TEXT,
ADD COLUMN IF NOT EXISTS additional_project_notes TEXT,
ADD COLUMN IF NOT EXISTS uploaded_files JSONB DEFAULT '[]'::jsonb;

-- Timestamps
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS first_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_leads_building_type ON public.leads(building_type);
CREATE INDEX IF NOT EXISTS idx_leads_project_start_timeframe ON public.leads(project_start_timeframe);
CREATE INDEX IF NOT EXISTS idx_leads_is_barndominium ON public.leads(is_barndominium);
CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON public.leads(archived_at);

-- Add comment to table
COMMENT ON TABLE public.leads IS 'Stores lead information from JotForm submissions and 3D designer';