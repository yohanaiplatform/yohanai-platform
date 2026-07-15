-- ============================================================================
-- FILE: project-docs/sql/014_foreign_keys.sql
-- Yohan.AI Platform
-- Deferred Foreign Keys
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- INFORMATION
-- ============================================================================

-- All foreign keys have already been created inside their respective
-- CREATE TABLE statements.

-- No circular dependency exists in the current schema.

-- Therefore this migration intentionally performs no ALTER TABLE
-- ADD CONSTRAINT statements.

-- This file is intentionally kept to preserve migration numbering
-- and future extensibility.

COMMIT;