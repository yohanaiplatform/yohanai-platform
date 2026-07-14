-- ============================================================================
-- FILE: project-docs/sql/005_auth_tables.sql
-- Yohan.AI Platform - Authentication & Authorization
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: core.roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID,
    updated_by UUID
);

ALTER TABLE core.roles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE core.roles IS
'Application roles.';

CREATE INDEX IF NOT EXISTS idx_roles_name
ON core.roles(name);

CREATE INDEX IF NOT EXISTS idx_roles_deleted
ON core.roles(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_roles_updated_at
ON core.roles;

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE
ON core.roles
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: core.permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID,
    updated_by UUID
);

ALTER TABLE core.permissions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE core.permissions IS
'Application permissions.';

CREATE INDEX IF NOT EXISTS idx_permissions_name
ON core.permissions(name);

CREATE INDEX IF NOT EXISTS idx_permissions_deleted
ON core.permissions(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_permissions_updated_at
ON core.permissions;

CREATE TRIGGER trg_permissions_updated_at
BEFORE UPDATE
ON core.permissions
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: auth_ext.profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_ext.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    first_name VARCHAR(255),
    last_name VARCHAR(255),
    avatar_url TEXT,

    role_id UUID
        REFERENCES core.roles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID,
    updated_by UUID
);

ALTER TABLE auth_ext.profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth_ext.profiles IS
'Extended user profile.';

CREATE INDEX IF NOT EXISTS idx_profiles_user
ON auth_ext.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role
ON auth_ext.profiles(role_id);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted
ON auth_ext.profiles(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_profiles_updated_at
ON auth_ext.profiles;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE
ON auth_ext.profiles
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: core.role_permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_id UUID NOT NULL
        REFERENCES core.roles(id)
        ON DELETE CASCADE,

    permission_id UUID NOT NULL
        REFERENCES core.permissions(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_role_permission
        UNIQUE(role_id, permission_id)
);

ALTER TABLE core.role_permissions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE core.role_permissions IS
'Many-to-many relationship between roles and permissions.';

CREATE INDEX IF NOT EXISTS idx_role_permissions_role
ON core.role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission
ON core.role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_deleted
ON core.role_permissions(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at
ON core.role_permissions;

CREATE TRIGGER trg_role_permissions_updated_at
BEFORE UPDATE
ON core.role_permissions
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;