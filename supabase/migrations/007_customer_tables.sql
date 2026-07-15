-- ============================================================================
-- FILE: project-docs/sql/007_customer_tables.sql
-- Yohan.AI Platform - Customer Tables
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: customer.lead_sources
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer.lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE customer.lead_sources ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lead_sources_name
ON customer.lead_sources(name);

CREATE INDEX IF NOT EXISTS idx_lead_sources_deleted
ON customer.lead_sources(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_customer_lead_sources_updated_at
ON customer.lead_sources;

CREATE TRIGGER trg_customer_lead_sources_updated_at
BEFORE UPDATE
ON customer.lead_sources
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: customer.leads
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_source_id UUID
        REFERENCES customer.lead_sources(id)
        ON DELETE SET NULL,

    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,

    email VARCHAR(255),
    phone VARCHAR(50),

    status VARCHAR(50) NOT NULL DEFAULT 'new'
        CHECK (
            status IN (
                'new',
                'contacted',
                'qualified',
                'proposal',
                'negotiation',
                'won',
                'lost'
            )
        ),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE customer.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leads_source
ON customer.leads(lead_source_id);

CREATE INDEX IF NOT EXISTS idx_leads_email
ON customer.leads(email);

CREATE INDEX IF NOT EXISTS idx_leads_phone
ON customer.leads(phone);

CREATE INDEX IF NOT EXISTS idx_leads_status
ON customer.leads(status);

CREATE INDEX IF NOT EXISTS idx_leads_deleted
ON customer.leads(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_customer_leads_updated_at
ON customer.leads;

CREATE TRIGGER trg_customer_leads_updated_at
BEFORE UPDATE
ON customer.leads
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: customer.contacts
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL
        REFERENCES customer.leads(id)
        ON DELETE CASCADE,

    contact_type VARCHAR(50) NOT NULL
        CHECK (
            contact_type IN (
                'email',
                'phone',
                'whatsapp',
                'telegram',
                'other'
            )
        ),

    contact_value TEXT NOT NULL,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE customer.contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contacts_lead
ON customer.contacts(lead_id);

CREATE INDEX IF NOT EXISTS idx_contacts_primary
ON customer.contacts(is_primary);

CREATE INDEX IF NOT EXISTS idx_contacts_deleted
ON customer.contacts(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_customer_contacts_updated_at
ON customer.contacts;

CREATE TRIGGER trg_customer_contacts_updated_at
BEFORE UPDATE
ON customer.contacts
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;