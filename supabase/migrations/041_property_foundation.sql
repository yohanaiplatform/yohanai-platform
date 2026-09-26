-- ============================================================================
-- 041_property_foundation.sql
-- Yohan.AI Platform — fondasi Property Module
--
-- authenticated belum pernah punya GRANT ke schema property sama sekali
-- (temuan audit 23 Sep, sengaja belum diperbaiki karena belum ada kode yang
-- butuh) -- sekarang Property Module mulai dibangun, jadi diperbaiki di
-- sini, pola sama seperti 027 (customer) dan 034 (chat).
--
-- Kategori di-seed idempotent (ON CONFLICT DO NOTHING) supaya form Tambah
-- Listing langsung punya pilihan tanpa perlu UI manajemen kategori dulu.
-- ============================================================================

BEGIN;

GRANT USAGE ON SCHEMA property TO authenticated;
GRANT SELECT, INSERT, UPDATE ON property.categories, property.listings TO authenticated;

INSERT INTO property.categories (name) VALUES
  ('Rumah'),
  ('Tanah'),
  ('Ruko'),
  ('Apartemen'),
  ('Gudang')
ON CONFLICT (name) DO NOTHING;

COMMIT;
