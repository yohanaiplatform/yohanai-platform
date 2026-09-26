-- ============================================================================
-- 042_property_listing_slug.sql
-- Yohan.AI Platform — slug untuk URL listing properti
--
-- Sebelumnya /properties/<uuid> -- tidak ramah dibagikan buat promosi.
-- Backfill sederhana cukup di sini karena baru ada 1 listing (dites Yohan
-- 26 Sep 2026); slug berikutnya dibuat & dijamin unik di aplikasi
-- (src/lib/property/slugify.ts), bukan di database.
-- ============================================================================

BEGIN;

ALTER TABLE property.listings ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE property.listings
SET slug = lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

ALTER TABLE property.listings ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_listings_slug_unique
ON property.listings(slug);

COMMIT;
