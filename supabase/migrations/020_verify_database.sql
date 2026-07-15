-- ============================================================================
-- FILE: project-docs/sql/020_verify_database.sql
-- Yohan.AI Platform
-- Final Database Verification
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

DO
$$
DECLARE
    v_extensions INTEGER;
    v_schemas INTEGER;
    v_tables INTEGER;
    v_functions INTEGER;
    v_triggers INTEGER;
    v_indexes INTEGER;
    v_policies INTEGER;
    v_buckets INTEGER;
BEGIN

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

SELECT COUNT(*)
INTO v_extensions
FROM pg_extension
WHERE extname IN
(
    'pgcrypto',
    'pg_trgm',
    'btree_gist',
    'btree_gin',
    'vector'
);

IF v_extensions <> 5 THEN
    RAISE EXCEPTION 'Verification FAILED: Expected 5 extensions, found %', v_extensions;
END IF;

-- ============================================================================
-- SCHEMAS
-- ============================================================================

SELECT COUNT(*)
INTO v_schemas
FROM information_schema.schemata
WHERE schema_name IN
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
);

IF v_schemas <> 10 THEN
    RAISE EXCEPTION 'Verification FAILED: Expected 10 schemas, found %', v_schemas;
END IF;

-- ============================================================================
-- TABLES
-- ============================================================================

SELECT COUNT(*)
INTO v_tables
FROM information_schema.tables
WHERE table_schema IN
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
);

IF v_tables < 24 THEN
    RAISE EXCEPTION 'Verification FAILED: Expected at least 24 tables, found %', v_tables;
END IF;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

SELECT COUNT(*)
INTO v_functions
FROM pg_proc p
JOIN pg_namespace n
    ON n.oid = p.pronamespace
WHERE n.nspname = 'core'
AND p.proname IN
(
    'update_updated_at_column',
    'set_created_defaults',
    'soft_delete_record'
);

IF v_functions <> 3 THEN
    RAISE EXCEPTION 'Verification FAILED: Expected 3 core functions, found %', v_functions;
END IF;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

SELECT COUNT(*)
INTO v_triggers
FROM pg_trigger
WHERE NOT tgisinternal;

IF v_triggers < 20 THEN
    RAISE EXCEPTION 'Verification FAILED: Expected at least 20 triggers, found %', v_triggers;
END IF;

-- ============================================================================
-- INDEXES
-- ============================================================================

SELECT COUNT(*)
INTO v_indexes
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
);

IF v_indexes < 50 THEN
    RAISE EXCEPTION 'Verification FAILED: Expected at least 50 indexes, found %', v_indexes;
END IF;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

SELECT COUNT(*)
INTO v_policies
FROM pg_policies
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
);

IF v_policies < 15 THEN
    RAISE EXCEPTION 'Verification FAILED: Expected at least 15 RLS policies, found %', v_policies;
END IF;

-- ============================================================================
-- STORAGE
-- ============================================================================

SELECT COUNT(*)
INTO v_buckets
FROM storage.buckets;

IF v_buckets < 8 THEN
    RAISE EXCEPTION 'Verification FAILED: Expected at least 8 storage buckets, found %', v_buckets;
END IF;

-- ============================================================================
-- SUCCESS
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '====================================================';
RAISE NOTICE 'Yohan.AI Platform Database Verification';
RAISE NOTICE 'STATUS : PASS';
RAISE NOTICE 'Extensions : %', v_extensions;
RAISE NOTICE 'Schemas    : %', v_schemas;
RAISE NOTICE 'Tables     : %', v_tables;
RAISE NOTICE 'Functions  : %', v_functions;
RAISE NOTICE 'Triggers   : %', v_triggers;
RAISE NOTICE 'Indexes    : %', v_indexes;
RAISE NOTICE 'RLS        : %', v_policies;
RAISE NOTICE 'Buckets    : %', v_buckets;
RAISE NOTICE '====================================================';

END;
$$;