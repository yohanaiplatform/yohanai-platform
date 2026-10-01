-- ============================================================================
-- 053_profile_brand_name.sql
-- Yohan.AI Platform -- Nama Brand per user (1 Oktober 2026)
--
-- Diminta Yohan: header Laporan Pemasaran (lihat getListingReport.ts)
-- sebelumnya hardcode "GRIYA INDONESIA REAL ESTATE" -- harus diganti brand
-- milik agen yang generate laporan (mis. "Rizal Property"), bukan nama
-- Griya Indonesia. Field OPSIONAL, tidak dimasukkan ke
-- profile_completeness_rules (bukan syarat kelengkapan profil, murni
-- identitas tambahan buat laporan). Kalau kosong, laporan fallback ke
-- nama lengkap agen -- lihat multi-tenant-forward-compat, platform ini
-- akan dipakai bisnis lain selain Griya Indonesia nanti.
--
-- Catatan dari Yohan: ini bagian KECIL dari rencana lebih besar (redesain
-- halaman Profile -- sembunyikan field yang tak perlu, tambah logo/
-- watermark setting) yang SENGAJA ditunda ke sesi lain. Jangan bangun
-- redesain penuh itu dari migration ini saja.
-- ============================================================================

BEGIN;

ALTER TABLE auth_ext.profiles
    ADD COLUMN IF NOT EXISTS brand_name TEXT;

COMMIT;
