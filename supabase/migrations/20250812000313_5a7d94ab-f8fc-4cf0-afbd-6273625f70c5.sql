-- Fix foreign key constraints for both project_phases and project_milestones
-- to reference projects_new instead of projects

-- Fix project_phases foreign key
DO $$ 
BEGIN
    -- Drop existing foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_phases_project_id_fkey' 
        AND table_name = 'project_phases'
    ) THEN
        ALTER TABLE project_phases DROP CONSTRAINT project_phases_project_id_fkey;
    END IF;
    
    -- Add the correct foreign key reference to projects_new
    ALTER TABLE project_phases 
    ADD CONSTRAINT project_phases_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects_new(id) ON DELETE CASCADE;
    
END $$;

-- Fix project_milestones foreign key
DO $$ 
BEGIN
    -- Drop existing foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_milestones_project_id_fkey' 
        AND table_name = 'project_milestones'
    ) THEN
        ALTER TABLE project_milestones DROP CONSTRAINT project_milestones_project_id_fkey;
    END IF;
    
    -- Add the correct foreign key reference to projects_new
    ALTER TABLE project_milestones 
    ADD CONSTRAINT project_milestones_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects_new(id) ON DELETE CASCADE;
    
END $$;