-- Check if customer exists and create one with the correct user_id if needed
DO $$
DECLARE
    customer_uuid UUID;
    project_uuid UUID;
    user_exists BOOLEAN;
    customer_exists BOOLEAN;
BEGIN
    -- Check if the specific user exists in auth
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = '836947a0-8f14-43a6-bf1b-9658ea2e4421') INTO user_exists;
    
    -- Check if customer already exists for this user_id
    SELECT EXISTS(SELECT 1 FROM public.customers WHERE user_id = '836947a0-8f14-43a6-bf1b-9658ea2e4421') INTO customer_exists;
    
    IF user_exists AND NOT customer_exists THEN
        -- Insert customer record with the correct user_id
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
            '836947a0-8f14-43a6-bf1b-9658ea2e4421',
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
        
        RAISE NOTICE 'Test customer account created with correct user_id: %', customer_uuid;
    ELSIF customer_exists THEN
        RAISE NOTICE 'Customer already exists for this user_id';
    ELSE
        RAISE NOTICE 'User not found in auth.users table';
    END IF;
END $$;