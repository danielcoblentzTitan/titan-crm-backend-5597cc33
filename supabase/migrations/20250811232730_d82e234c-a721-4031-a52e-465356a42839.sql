-- Enhanced project tracking tables for sophisticated Gantt functionality

-- Add progress tracking columns to project_phases
ALTER TABLE project_phases 
ADD COLUMN IF NOT EXISTS actual_start_date date,
ADD COLUMN IF NOT EXISTS actual_end_date date,
ADD COLUMN IF NOT EXISTS completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS baseline_start_date date,
ADD COLUMN IF NOT EXISTS baseline_end_date date,
ADD COLUMN IF NOT EXISTS baseline_duration_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_critical_path boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
ADD COLUMN IF NOT EXISTS effort_hours numeric DEFAULT 0;

-- Create project baselines table to track original plans
CREATE TABLE IF NOT EXISTS project_baselines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
    baseline_name text NOT NULL DEFAULT 'Original Plan',
    baseline_date timestamp with time zone NOT NULL DEFAULT now(),
    baseline_data jsonb NOT NULL DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for tracking Gantt view preferences
CREATE TABLE IF NOT EXISTS gantt_view_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects_new(id) ON DELETE CASCADE,
    zoom_level text DEFAULT 'weeks' CHECK (zoom_level IN ('days', 'weeks', 'months', 'quarters')),
    show_critical_path boolean DEFAULT true,
    show_baselines boolean DEFAULT false,
    show_progress boolean DEFAULT true,
    show_milestones boolean DEFAULT true,
    show_dependencies boolean DEFAULT true,
    group_by text DEFAULT 'none' CHECK (group_by IN ('none', 'status', 'resource', 'priority')),
    filter_status text[] DEFAULT '{}',
    filter_resources text[] DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, project_id)
);

-- Enhanced project milestones with more detail
ALTER TABLE project_milestones 
ADD COLUMN IF NOT EXISTS milestone_type text DEFAULT 'delivery' CHECK (milestone_type IN ('delivery', 'review', 'payment', 'approval', 'start', 'finish')),
ADD COLUMN IF NOT EXISTS is_critical boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS actual_date date,
ADD COLUMN IF NOT EXISTS completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6';

-- Create critical path analysis results table
CREATE TABLE IF NOT EXISTS critical_path_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
    analysis_date timestamp with time zone NOT NULL DEFAULT now(),
    critical_phases uuid[] NOT NULL DEFAULT '{}',
    total_float_days integer DEFAULT 0,
    longest_path_duration integer DEFAULT 0,
    analysis_data jsonb DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE project_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE gantt_view_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_path_analysis ENABLE ROW LEVEL SECURITY;

-- Admin/PM can manage baselines
CREATE POLICY "Admin can manage baselines" ON project_baselines FOR ALL 
USING (get_current_user_role() = 'Admin');

CREATE POLICY "PM can manage baselines for assigned projects" ON project_baselines FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM projects_new p 
        WHERE p.id = project_baselines.project_id 
        AND p.pm_user_id = auth.uid()
    ) OR get_current_user_role() = 'Admin'
);

-- Users can manage their own view settings
CREATE POLICY "Users can manage their own gantt settings" ON gantt_view_settings FOR ALL 
USING (user_id = auth.uid());

-- Admin/PM can view critical path analysis
CREATE POLICY "Admin can view critical path analysis" ON critical_path_analysis FOR SELECT 
USING (get_current_user_role() = 'Admin');

CREATE POLICY "PM can view critical path for assigned projects" ON critical_path_analysis FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM projects_new p 
        WHERE p.id = critical_path_analysis.project_id 
        AND p.pm_user_id = auth.uid()
    ) OR get_current_user_role() = 'Admin'
);

-- Function to calculate critical path
CREATE OR REPLACE FUNCTION calculate_critical_path(project_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    critical_phases uuid[];
    total_duration integer;
BEGIN
    -- Simple critical path calculation based on dependencies and durations
    WITH RECURSIVE path_calculation AS (
        -- Start with phases that have no dependencies
        SELECT 
            pp.id,
            pp.name,
            pp.duration_days,
            pp.start_date,
            pp.end_date,
            ARRAY[pp.id] as path,
            pp.duration_days as total_duration,
            0 as level
        FROM project_phases pp
        WHERE pp.project_id = project_id_param
        AND NOT EXISTS (
            SELECT 1 FROM phase_dependencies pd 
            WHERE pd.successor_phase_id = pp.id
        )
        
        UNION ALL
        
        -- Add phases that depend on previous phases
        SELECT 
            pp.id,
            pp.name,
            pp.duration_days,
            pp.start_date,
            pp.end_date,
            pc.path || pp.id,
            pc.total_duration + pp.duration_days + COALESCE(pd.lag_days, 0),
            pc.level + 1
        FROM project_phases pp
        JOIN phase_dependencies pd ON pd.successor_phase_id = pp.id
        JOIN path_calculation pc ON pc.id = pd.predecessor_phase_id
        WHERE pp.project_id = project_id_param
    )
    SELECT INTO critical_phases, total_duration
        path, total_duration
    FROM path_calculation
    ORDER BY total_duration DESC, level DESC
    LIMIT 1;
    
    -- Update phases with critical path flag
    UPDATE project_phases 
    SET is_critical_path = (id = ANY(critical_phases))
    WHERE project_id = project_id_param;
    
    -- Store analysis results
    INSERT INTO critical_path_analysis (
        project_id, 
        critical_phases, 
        longest_path_duration,
        analysis_data
    ) VALUES (
        project_id_param,
        critical_phases,
        total_duration,
        jsonb_build_object(
            'calculated_at', now(),
            'total_phases', array_length(critical_phases, 1),
            'critical_path_duration', total_duration
        )
    );
    
    result := jsonb_build_object(
        'critical_phases', critical_phases,
        'total_duration', total_duration,
        'success', true
    );
    
    RETURN result;
END;
$$;

-- Function to create baseline snapshots
CREATE OR REPLACE FUNCTION create_project_baseline(
    project_id_param uuid,
    baseline_name_param text DEFAULT 'Baseline'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    baseline_id uuid;
    baseline_data jsonb;
BEGIN
    -- Capture current project phase data as baseline
    SELECT jsonb_agg(
        jsonb_build_object(
            'phase_id', id,
            'name', name,
            'start_date', start_date,
            'end_date', end_date,
            'duration_days', duration_days,
            'sort_order', COALESCE((
                SELECT COUNT(*) FROM project_phases pp2 
                WHERE pp2.project_id = project_phases.project_id 
                AND pp2.created_at <= project_phases.created_at
            ), 0)
        )
    ) INTO baseline_data
    FROM project_phases
    WHERE project_id = project_id_param;
    
    -- Create baseline record
    INSERT INTO project_baselines (
        project_id,
        baseline_name,
        baseline_data,
        created_by
    ) VALUES (
        project_id_param,
        baseline_name_param,
        baseline_data,
        auth.uid()
    ) RETURNING id INTO baseline_id;
    
    -- Set baseline dates on phases if not already set
    UPDATE project_phases 
    SET 
        baseline_start_date = COALESCE(baseline_start_date, start_date),
        baseline_end_date = COALESCE(baseline_end_date, end_date),
        baseline_duration_days = COALESCE(baseline_duration_days, duration_days)
    WHERE project_id = project_id_param
    AND baseline_start_date IS NULL;
    
    RETURN baseline_id;
END;
$$;

-- Add triggers for automatic baseline creation
CREATE OR REPLACE FUNCTION auto_create_baseline_on_project_start()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create initial baseline when project status changes to Active
    IF NEW.status = 'Active' AND (OLD.status IS NULL OR OLD.status != 'Active') THEN
        PERFORM create_project_baseline(NEW.id, 'Initial Baseline');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger (will only create if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'auto_baseline_on_project_start'
    ) THEN
        CREATE TRIGGER auto_baseline_on_project_start
            AFTER UPDATE ON projects_new
            FOR EACH ROW
            EXECUTE FUNCTION auto_create_baseline_on_project_start();
    END IF;
END $$;