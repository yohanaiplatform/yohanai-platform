-- ============================================================================
-- 075_user_branding.sql
-- Yohan.AI Platform -- logo & watermark per pengguna (14 Oktober 2026)
--
-- property.document_settings.branding: JSONB { watermark: {url,width,height,updatedAt}, docLogo: {...} }.
-- Satu baris per pengguna (tabel sudah ber-RLS user_id = auth.uid() dari migration 073, GRANT sudah ada). Kolom sendiri
-- (bukan di kolom data) supaya penyimpanan isian Pihak 2 oleh dokumen tidak menimpa logo/watermark.
-- Gambar fisik di R2 (branding/<userId>/...), disajikan lewat proxy /api/branding/file/<kind>.
-- ============================================================================

BEGIN;

ALTER TABLE property.document_settings ADD COLUMN IF NOT EXISTS branding JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN property.document_settings.branding IS
'Logo dokumen dan watermark foto per pengguna: { watermark, docLogo } masing-masing {url,width,height,updatedAt}. Kosong = watermark bawaan Yohan.AI, logo dokumen teks nama kantor.';

COMMIT;
