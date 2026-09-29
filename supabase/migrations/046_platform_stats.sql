-- ============================================================================
-- 046_platform_stats.sql
-- Yohan.AI Platform -- fungsi untuk Platform Report (laporan developer, 29 Sep 2026)
--
-- Butuh ukuran database & storage untuk dibandingkan ke limit Supabase Free
-- Tier (500MB DB, 1GB Storage). PostgREST/service-role client tidak bisa
-- panggil pg_database_size() langsung (bukan tabel), dan baca storage.objects
-- perlu privilese yang service_role belum tentu punya -- dibungkus fungsi
-- SECURITY DEFINER (didefinisikan sebagai postgres, jadi bisa baca storage.*
-- terlepas dari GRANT service_role ke schema storage) supaya cuma perlu
-- GRANT EXECUTE, pola sama seperti core.is_admin_or_above()/
-- list_assignable_users().
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.get_platform_stats()
RETURNS TABLE (
  db_size_bytes bigint,
  storage_size_bytes bigint,
  storage_object_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'storage'
STABLE
AS $$
  SELECT
    pg_database_size(current_database()),
    (SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) FROM storage.objects),
    (SELECT COUNT(*) FROM storage.objects);
$$;

REVOKE ALL ON FUNCTION core.get_platform_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION core.get_platform_stats() FROM anon;
REVOKE ALL ON FUNCTION core.get_platform_stats() FROM authenticated;
GRANT EXECUTE ON FUNCTION core.get_platform_stats() TO service_role;

COMMENT ON FUNCTION core.get_platform_stats() IS
'Ukuran database + storage bucket, dipakai Platform Report (laporan developer harian) untuk bandingkan ke limit Supabase Free Tier. service_role-only -- bukan data yang perlu/boleh diakses dari sesi login biasa.';

COMMIT;
