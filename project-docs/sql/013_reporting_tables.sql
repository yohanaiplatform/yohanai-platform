-- ============================================================================
-- FILE: project-docs/sql/013_reporting_tables.sql
-- Yohan.AI Platform - Reporting Tables
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: reporting.dashboards
-- ============================================================================

CREATE TABLE IF NOT EXISTS reporting.dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    layout JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_public BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE reporting.dashboards ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE reporting.dashboards IS
'Dashboard definitions for analytics.';

CREATE INDEX IF NOT EXISTS idx_dashboards_public
ON reporting.dashboards(is_public);

CREATE INDEX IF NOT EXISTS idx_dashboards_created
ON reporting.dashboards(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dashboards_deleted
ON reporting.dashboards(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_reporting_dashboards_updated_at
ON reporting.dashboards;

CREATE TRIGGER trg_reporting_dashboards_updated_at
BEFORE UPDATE
ON reporting.dashboards
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: reporting.metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS reporting.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dashboard_id UUID NOT NULL
        REFERENCES reporting.dashboards(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    query TEXT NOT NULL,

    chart_type VARCHAR(50)
        CHECK (
            chart_type IS NULL
            OR chart_type IN (
                'line',
                'bar',
                'pie',
                'area',
                'table',
                'kpi'
            )
        ),

    config JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE reporting.metrics ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE reporting.metrics IS
'Dashboard metrics and widgets.';

CREATE INDEX IF NOT EXISTS idx_metrics_dashboard
ON reporting.metrics(dashboard_id);

CREATE INDEX IF NOT EXISTS idx_metrics_chart
ON reporting.metrics(chart_type);

CREATE INDEX IF NOT EXISTS idx_metrics_created
ON reporting.metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_deleted
ON reporting.metrics(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_reporting_metrics_updated_at
ON reporting.metrics;

CREATE TRIGGER trg_reporting_metrics_updated_at
BEFORE UPDATE
ON reporting.metrics
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;