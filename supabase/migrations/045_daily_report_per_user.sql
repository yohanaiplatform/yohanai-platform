-- ============================================================================
-- 045_daily_report_per_user.sql
-- Yohan.AI Platform -- Daily Report personal per user (28-29 September 2026)
--
-- Sebelumnya Daily Report cuma satu email statis (DAILY_REPORT_RECIPIENT)
-- berisi data agregat semua agent. Yohan minta tiap user (termasuk agent
-- non-admin seperti Ramlan nanti) terima laporan sendiri, di-scope ke
-- datanya sendiri (pola sama seperti leads_owner_or_admin/
-- listings_owner_or_admin -- admin lihat semua, agent cuma lihat miliknya).
--
-- Dua hal yang perlu ditambahkan:
-- 1. Kolom preferensi baru (opt-out, default aktif) supaya user bisa
--    matikan lewat halaman Notification Preferences yang sudah ada --
--    tidak bikin UI baru, cukup tambah kategori.
-- 2. GRANT service_role ke auth_ext + core -- pola yang sama berulang
--    seperti temuan customer/chat/property sebelumnya (AGENTS.md):
--    service_role cuma otomatis dapat USAGE di schema public, dan baru
--    sekarang ada kode (cron Daily Report, jalan lewat service-role
--    client) yang butuh baca auth_ext.profiles + auth_ext.
--    notification_preferences + core.roles untuk tentukan siapa admin dan
--    siapa yang masih mau menerima laporan.
-- ============================================================================

BEGIN;

ALTER TABLE auth_ext.notification_preferences
  ADD COLUMN IF NOT EXISTS daily_report_email BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN auth_ext.notification_preferences.daily_report_email IS
'Terima Daily Report (ringkasan lead/listing/chat harian) lewat email. Default aktif, email-only (tidak ada varian in-app).';

GRANT USAGE ON SCHEMA auth_ext TO service_role;
GRANT SELECT ON auth_ext.profiles TO service_role;
GRANT SELECT ON auth_ext.notification_preferences TO service_role;

GRANT USAGE ON SCHEMA core TO service_role;
GRANT SELECT ON core.roles TO service_role;

COMMIT;
