-- ============================================================================
-- FILE: project-docs/sql/006_property_tables.sql
-- Yohan.AI Platform - Property Tables
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: property.categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS property.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE property.categories ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE property.categories IS
'Master property categories.';

CREATE INDEX IF NOT EXISTS idx_property_categories_name
ON property.categories(name);

CREATE INDEX IF NOT EXISTS idx_property_categories_deleted
ON property.categories(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_property_categories_updated_at
ON property.categories;

CREATE TRIGGER trg_property_categories_updated_at
BEFORE UPDATE
ON property.categories
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: property.listings
-- ============================================================================

CREATE TABLE IF NOT EXISTS property.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID
        REFERENCES property.categories(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,

    price NUMERIC(15,2) NOT NULL
        CHECK(price >= 0),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE property.listings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE property.listings IS
'Property listings.';

CREATE INDEX IF NOT EXISTS idx_property_listings_category
ON property.listings(category_id);

CREATE INDEX IF NOT EXISTS idx_property_listings_price
ON property.listings(price);

CREATE INDEX IF NOT EXISTS idx_property_listings_created
ON property.listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_listings_deleted
ON property.listings(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_property_listings_updated_at
ON property.listings;

CREATE TRIGGER trg_property_listings_updated_at
BEFORE UPDATE
ON property.listings
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;