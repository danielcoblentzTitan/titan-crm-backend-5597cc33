-- Create a test customer record linked to the authenticated user
-- First check if customer already exists, if not insert
DO $$
DECLARE
    customer_exists BOOLEAN;
    customer_uuid UUID;
    project_uuid UUID;
BEGIN
    -- Check if customer already exists
    SELECT EXISTS(SELECT 1 FROM public.customers WHERE email = 'dcoblentz@gmail.com') INTO customer_exists;
    
    IF NOT customer_exists THEN
        -- Insert customer record
        INSERT INTO public.customers (
            id,
            user_id,
            name,
            email,
            phone,
            address,
            city,
            state,
            zip,
            notes
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM auth.users WHERE email = 'dcoblentz@gmail.com' LIMIT 1),
            'David Coblentz',
            'dcoblentz@gmail.com',
            '(555) 123-4567',
            '123 Test Street',
            'Test City',
            'TX',
            '12345',
            'Test customer account for development'
        ) RETURNING id INTO customer_uuid;
        
        -- Insert test project
        INSERT INTO public.projects (
            id,
            customer_id,
            customer_name,
            name,
            description,
            start_date,
            estimated_completion,
            status,
            phase,
            progress,
            budget,
            address,
            city,
            state,
            zip
        ) VALUES (
            gen_random_uuid(),
            customer_uuid,
            'David Coblentz',
            'Test Barndominium Project',
            'A test project for design selections and customer portal testing',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '120 days',
            'In Progress',
            'Design Phase',
            25,
            450000.00,
            '123 Test Street',
            'Test City',
            'TX',
            '12345'
        ) RETURNING id INTO project_uuid;
        
        -- Insert design selection document
        INSERT INTO public.design_selection_documents (
            id,
            project_id,
            customer_id,
            title,
            current_version_number
        ) VALUES (
            gen_random_uuid(),
            project_uuid,
            customer_uuid,
            'Design Selections',
            1
        );
        
        RAISE NOTICE 'Test customer account created successfully';
    ELSE
        RAISE NOTICE 'Customer account already exists';
    END IF;
END $$;