-- ============================================================================
-- FILE: project-docs/sql/009_workflow_tables.sql
-- Yohan.AI Platform - Workflow Tables
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: workflow.definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow.definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    trigger_event VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    definition JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE workflow.definitions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE workflow.definitions IS
'Workflow definitions for automation engine.';

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_active
ON workflow.definitions(is_active);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_created
ON workflow.definitions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_deleted
ON workflow.definitions(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_workflow_definitions_updated_at
ON workflow.definitions;

CREATE TRIGGER trg_workflow_definitions_updated_at
BEFORE UPDATE
ON workflow.definitions
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: workflow.steps
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow.steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    definition_id UUID NOT NULL
        REFERENCES workflow.definitions(id)
        ON DELETE CASCADE,

    step_order INTEGER NOT NULL,

    action_type VARCHAR(255) NOT NULL,

    config JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_workflow_step
        UNIQUE(definition_id, step_order)
);

ALTER TABLE workflow.steps ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE workflow.steps IS
'Ordered workflow execution steps.';

CREATE INDEX IF NOT EXISTS idx_workflow_steps_definition
ON workflow.steps(definition_id);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_order
ON workflow.steps(step_order);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_deleted
ON workflow.steps(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_workflow_steps_updated_at
ON workflow.steps;

CREATE TRIGGER trg_workflow_steps_updated_at
BEFORE UPDATE
ON workflow.steps
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: workflow.executions
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow.executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    definition_id UUID NOT NULL
        REFERENCES workflow.definitions(id)
        ON DELETE CASCADE,

    target_id UUID,

    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'running',
                'success',
                'failed',
                'cancelled'
            )
        ),

    result JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE workflow.executions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE workflow.executions IS
'Workflow execution history.';

CREATE INDEX IF NOT EXISTS idx_workflow_executions_definition
ON workflow.executions(definition_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
ON workflow.executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_created
ON workflow.executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_deleted
ON workflow.executions(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_workflow_executions_updated_at
ON workflow.executions;

CREATE TRIGGER trg_workflow_executions_updated_at
BEFORE UPDATE
ON workflow.executions
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;