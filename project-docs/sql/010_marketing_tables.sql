-- ============================================================================
-- FILE: project-docs/sql/010_marketing_tables.sql
-- Yohan.AI Platform - Marketing Tables
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: marketing.campaigns
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'scheduled',
                'running',
                'paused',
                'completed',
                'cancelled'
            )
        ),

    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_campaign_date
    CHECK (
        end_date IS NULL
        OR start_date IS NULL
        OR end_date >= start_date
    )
);

ALTER TABLE marketing.campaigns ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE marketing.campaigns IS
'Marketing campaign master.';

CREATE INDEX IF NOT EXISTS idx_campaign_status
ON marketing.campaigns(status);

CREATE INDEX IF NOT EXISTS idx_campaign_start
ON marketing.campaigns(start_date);

CREATE INDEX IF NOT EXISTS idx_campaign_created
ON marketing.campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_deleted
ON marketing.campaigns(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_marketing_campaigns_updated_at
ON marketing.campaigns;

CREATE TRIGGER trg_marketing_campaigns_updated_at
BEFORE UPDATE
ON marketing.campaigns
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: marketing.templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    type VARCHAR(50) NOT NULL
        CHECK (
            type IN (
                'email',
                'whatsapp',
                'sms',
                'push',
                'facebook',
                'instagram'
            )
        ),

    subject VARCHAR(255),

    body TEXT NOT NULL,

    variables JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE marketing.templates ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE marketing.templates IS
'Reusable marketing templates.';

CREATE INDEX IF NOT EXISTS idx_templates_type
ON marketing.templates(type);

CREATE INDEX IF NOT EXISTS idx_templates_created
ON marketing.templates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_templates_deleted
ON marketing.templates(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_marketing_templates_updated_at
ON marketing.templates;

CREATE TRIGGER trg_marketing_templates_updated_at
BEFORE UPDATE
ON marketing.templates
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;