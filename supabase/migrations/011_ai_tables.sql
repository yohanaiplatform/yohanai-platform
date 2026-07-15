-- ============================================================================
-- FILE: project-docs/sql/011_ai_tables.sql
-- Yohan.AI Platform - AI Tables
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: ai.models
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(255) NOT NULL,

    config JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE ai.models ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE ai.models IS
'AI model registry.';

CREATE INDEX IF NOT EXISTS idx_ai_models_name
ON ai.models(name);

CREATE INDEX IF NOT EXISTS idx_ai_models_provider
ON ai.models(provider);

CREATE INDEX IF NOT EXISTS idx_ai_models_active
ON ai.models(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_models_deleted
ON ai.models(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_ai_models_updated_at
ON ai.models;

CREATE TRIGGER trg_ai_models_updated_at
BEFORE UPDATE
ON ai.models
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: ai.prompts
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL UNIQUE,

    system_prompt TEXT NOT NULL,

    variables JSONB NOT NULL DEFAULT '[]'::jsonb,

    version INTEGER NOT NULL DEFAULT 1
        CHECK (version > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE ai.prompts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE ai.prompts IS
'Prompt library.';

CREATE INDEX IF NOT EXISTS idx_ai_prompts_name
ON ai.prompts(name);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_version
ON ai.prompts(version);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_deleted
ON ai.prompts(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_ai_prompts_updated_at
ON ai.prompts;

CREATE TRIGGER trg_ai_prompts_updated_at
BEFORE UPDATE
ON ai.prompts
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: ai.interactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    model_id UUID
        REFERENCES ai.models(id)
        ON DELETE SET NULL,

    prompt_id UUID
        REFERENCES ai.prompts(id)
        ON DELETE SET NULL,

    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    tokens_used INTEGER
        CHECK (tokens_used IS NULL OR tokens_used >= 0),

    cost NUMERIC(10,4)
        CHECK (cost IS NULL OR cost >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE ai.interactions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE ai.interactions IS
'AI execution history.';

CREATE INDEX IF NOT EXISTS idx_ai_interactions_model
ON ai.interactions(model_id);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_prompt
ON ai.interactions(prompt_id);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_created
ON ai.interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_deleted
ON ai.interactions(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_ai_interactions_updated_at
ON ai.interactions;

CREATE TRIGGER trg_ai_interactions_updated_at
BEFORE UPDATE
ON ai.interactions
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;