-- ============================================================================
-- FILE: project-docs/sql/021_post_deployment_validation.sql
-- Yohan.AI Platform
-- Post Deployment Validation
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

DO
$$
DECLARE
    v_error_count INTEGER := 0;
BEGIN

    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Yohan.AI Post Deployment Validation';
    RAISE NOTICE '==============================================';

    ---------------------------------------------------------------------------
    -- Core Functions
    ---------------------------------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname='update_updated_at_column'
    ) THEN
        RAISE WARNING 'Missing function: update_updated_at_column';
        v_error_count := v_error_count + 1;
    END IF;

    ---------------------------------------------------------------------------
    -- pgvector
    ---------------------------------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname='vector'
    ) THEN
        RAISE WARNING 'pgvector extension missing';
        v_error_count := v_error_count + 1;
    END IF;

    ---------------------------------------------------------------------------
    -- Storage
    ---------------------------------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM storage.buckets
        WHERE id='properties'
    ) THEN
        RAISE WARNING 'Storage bucket "properties" missing';
        v_error_count := v_error_count + 1;
    END IF;

    ---------------------------------------------------------------------------
    -- RLS Enabled
    ---------------------------------------------------------------------------

    IF EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n
        ON c.relnamespace=n.oid
        WHERE n.nspname IN
        (
            'core',
            'auth_ext',
            'property',
            'customer',
            'chat',
            'workflow',
            'marketing',
            'ai',
            'knowledge',
            'reporting'
        )
        AND c.relkind='r'
        AND c.relrowsecurity = FALSE
    ) THEN

        RAISE WARNING 'Some tables do not have RLS enabled';
        v_error_count := v_error_count + 1;

    END IF;

    ---------------------------------------------------------------------------
    -- Trigger Check
    ---------------------------------------------------------------------------

    IF (
        SELECT COUNT(*)
        FROM pg_trigger
        WHERE NOT tgisinternal
    ) < 20 THEN

        RAISE WARNING 'Trigger count below expected';
        v_error_count := v_error_count + 1;

    END IF;

    ---------------------------------------------------------------------------
    -- Index Check
    ---------------------------------------------------------------------------

    IF (
        SELECT COUNT(*)
        FROM pg_indexes
        WHERE schemaname IN
        (
            'core',
            'auth_ext',
            'property',
            'customer',
            'chat',
            'workflow',
            'marketing',
            'ai',
            'knowledge',
            'reporting'
        )
    ) < 50 THEN

        RAISE WARNING 'Index count below expected';
        v_error_count := v_error_count + 1;

    END IF;

    ---------------------------------------------------------------------------
    -- Result
    ---------------------------------------------------------------------------

    IF v_error_count = 0 THEN

        RAISE NOTICE '';
        RAISE NOTICE '==============================================';
        RAISE NOTICE 'POST DEPLOYMENT VALIDATION : PASS';
        RAISE NOTICE 'System is ready.';
        RAISE NOTICE '==============================================';

    ELSE

        RAISE EXCEPTION
        'POST DEPLOYMENT VALIDATION FAILED (% issues detected)',
        v_error_count;

    END IF;

END;
$$;