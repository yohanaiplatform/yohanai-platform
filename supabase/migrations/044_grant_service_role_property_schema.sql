-- ============================================================================
-- 044_grant_service_role_property_schema.sql
-- Yohan.AI Platform — GRANT service_role ke schema property
--
-- Pola yang sama seperti temuan audit 23 September 2026: service_role cuma
-- otomatis punya USAGE di schema public, sama sekali tidak di customer/core/
-- chat/property/auth_ext. Sebelumnya cuma diperbaiki untuk schema customer
-- (032) dan chat (039), karena belum ada kode yang butuh property.
--
-- Ketemu 28 September 2026 saat menulis skrip migrasi bulk listing dari
-- spreadsheet (pakai service_role key, bukan sesi login) -- gagal dengan
-- "permission denied for schema property" sampai GRANT ini ditambahkan.
-- ============================================================================

BEGIN;

GRANT USAGE ON SCHEMA property TO service_role;
GRANT SELECT, INSERT, UPDATE ON property.categories, property.listings TO service_role;

COMMIT;
