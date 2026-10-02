-- ============================================================================
-- 055_customer_leads_slug.sql
-- Yohan.AI Platform -- slug untuk URL Lead Detail
--
-- Sebelumnya /crm/<uuid> -- Yohan minta diganti nama lead supaya mudah
-- diingat/dibagikan saat di-copy. Pola sama seperti property.listings.slug
-- (042), bedanya di sini sudah ada ~1973 lead existing dengan banyak nama
-- yang bentrok (363 dari 1973 base slug bentrok di data produksi) -- jadi
-- backfill-nya pakai window function buat penomoran -2/-3/dst yang
-- deterministik, bukan asumsi semua nama unik seperti migration 042 dulu
-- (saat itu baru ada 1 listing).
--
-- Slug berikutnya (lead baru) dibuat & dijamin unik di aplikasi
-- (src/lib/crm/slugify.ts), bukan di database -- sama seperti listing.
-- Slug SENGAJA tidak diregenerasi otomatis kalau nama lead diedit lagi
-- nanti (termasuk oleh AI Agent lewat confirmedName) -- supaya link yang
-- sudah dibagikan/disimpan tetap valid, sama seperti slug listing.
-- ============================================================================

BEGIN;

ALTER TABLE customer.leads ADD COLUMN IF NOT EXISTS slug TEXT;

WITH base AS (
  SELECT
    id,
    NULLIF(
      trim(both '-' from lower(regexp_replace(
        trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')),
        '[^a-zA-Z0-9]+', '-', 'g'
      ))),
      ''
    ) AS base_slug,
    created_at
  FROM customer.leads
  WHERE slug IS NULL
),
ranked AS (
  SELECT
    id,
    coalesce(base_slug, 'lead') AS base_slug,
    row_number() OVER (
      PARTITION BY coalesce(base_slug, 'lead')
      ORDER BY created_at, id
    ) AS rn
  FROM base
)
UPDATE customer.leads l
SET slug = CASE WHEN r.rn = 1 THEN r.base_slug ELSE r.base_slug || '-' || r.rn END
FROM ranked r
WHERE l.id = r.id;

ALTER TABLE customer.leads ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_leads_slug_unique
ON customer.leads(slug);

COMMIT;
