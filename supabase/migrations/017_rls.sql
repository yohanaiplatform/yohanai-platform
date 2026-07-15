-- ============================================================================
-- FILE: project-docs/sql/017_rls.sql
-- Yohan.AI Platform
-- Row Level Security Policies
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION core.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
SELECT auth.uid() IS NOT NULL;
$$;

-- ============================================================================
-- CORE
-- ============================================================================

DROP POLICY IF EXISTS settings_read ON core.settings;
CREATE POLICY settings_read
ON core.settings
FOR SELECT
TO authenticated
USING (core.is_authenticated());

DROP POLICY IF EXISTS settings_manage ON core.settings;
CREATE POLICY settings_manage
ON core.settings
FOR ALL
TO authenticated
USING (core.is_authenticated())
WITH CHECK (core.is_authenticated());

DROP POLICY IF EXISTS audit_logs_read ON core.audit_logs;
CREATE POLICY audit_logs_read
ON core.audit_logs
FOR SELECT
TO authenticated
USING (core.is_authenticated());

-- ============================================================================
-- AUTH
-- ============================================================================

DROP POLICY IF EXISTS profiles_all ON auth_ext.profiles;
CREATE POLICY profiles_all
ON auth_ext.profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS roles_read ON core.roles;
CREATE POLICY roles_read
ON core.roles
FOR SELECT
TO authenticated
USING (core.is_authenticated());

DROP POLICY IF EXISTS permissions_read ON core.permissions;
CREATE POLICY permissions_read
ON core.permissions
FOR SELECT
TO authenticated
USING (core.is_authenticated());

DROP POLICY IF EXISTS role_permissions_read ON core.role_permissions;
CREATE POLICY role_permissions_read
ON core.role_permissions
FOR SELECT
TO authenticated
USING (core.is_authenticated());

-- ============================================================================
-- BUSINESS SCHEMAS
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN
        (
            'property',
            'customer',
            'chat',
            'workflow',
            'marketing',
            'ai',
            'knowledge',
            'reporting'
        )
    LOOP

        EXECUTE format(
            'DROP POLICY IF EXISTS authenticated_all ON %I.%I',
            r.schemaname,
            r.tablename
        );

        EXECUTE format(
            '
            CREATE POLICY authenticated_all
            ON %I.%I
            FOR ALL
            TO authenticated
            USING (core.is_authenticated())
            WITH CHECK (core.is_authenticated())
            ',
            r.schemaname,
            r.tablename
        );

    END LOOP;
END;
$$;

COMMIT;