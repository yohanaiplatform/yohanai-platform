-- ============================================================================
-- FILE: project-docs/sql/004_system_tables.sql
-- Yohan.AI Platform - System Tables
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: core.settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID,
    updated_by UUID
);

ALTER TABLE core.settings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE core.settings IS
'Global application configuration stored as JSON values.';

CREATE INDEX IF NOT EXISTS idx_settings_key
ON core.settings(key);

CREATE INDEX IF NOT EXISTS idx_settings_deleted
ON core.settings(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_settings_updated_at
ON core.settings;

CREATE TRIGGER trg_settings_updated_at
BEFORE UPDATE
ON core.settings
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: core.audit_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,

    action VARCHAR(50) NOT NULL,

    old_data JSONB,
    new_data JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID,
    updated_by UUID
);

ALTER TABLE core.audit_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE core.audit_logs IS
'Central audit trail for every data modification.';

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record
ON core.audit_logs(table_name,record_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON core.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
ON core.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_deleted
ON core.audit_logs(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_audit_logs_updated_at
ON core.audit_logs;

CREATE TRIGGER trg_audit_logs_updated_at
BEFORE UPDATE
ON core.audit_logs
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;