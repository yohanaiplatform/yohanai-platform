-- ============================================================================
-- 072_platform_dashboard.sql
-- Yohan.AI Platform -- dashboard khusus admin (Master Admin) + penanda penerima laporan (12 Oktober 2026)
--
-- 1) auth_ext.profiles.can_view_platform_reports: akun NON-admin yang boleh melihat halaman Master Admin dan menerima
--    Platform Report (email), TANPA diberi peran admin penuh (admin = melihat semua lead/listing semua agen).
--    Pola sama seperti is_knowledge_curator: hanya admin/service_role yang bisa mengubahnya (trigger pelindung).
-- 2) core.platform_snapshots: potret harian metrik platform (satu baris per hari WIB) -- dasar tren mingguan/bulanan/tahunan
--    untuk metrik yang tidak bisa dihitung ulang dari data lama (ukuran database, storage). Hanya service_role.
-- ============================================================================

BEGIN;

ALTER TABLE auth_ext.profiles ADD COLUMN IF NOT EXISTS can_view_platform_reports BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION auth_ext.protect_platform_reports_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_ext, core, public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT core.is_admin_or_above() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.can_view_platform_reports := false;
    ELSIF NEW.can_view_platform_reports IS DISTINCT FROM OLD.can_view_platform_reports THEN
      NEW.can_view_platform_reports := OLD.can_view_platform_reports;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION auth_ext.protect_platform_reports_flag() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_platform_reports_flag ON auth_ext.profiles;
CREATE TRIGGER trg_protect_platform_reports_flag
BEFORE INSERT OR UPDATE ON auth_ext.profiles
FOR EACH ROW
EXECUTE FUNCTION auth_ext.protect_platform_reports_flag();

COMMENT ON COLUMN auth_ext.profiles.can_view_platform_reports IS
'Boleh melihat halaman Master Admin dan menerima Platform Report tanpa peran admin. Hanya admin/service_role yang bisa mengubahnya (trigger trg_protect_platform_reports_flag).';

CREATE TABLE IF NOT EXISTS core.platform_snapshots (
    snapshot_date DATE PRIMARY KEY,
    users_total INTEGER,
    leads_total INTEGER,
    listings_total INTEGER,
    db_size_bytes BIGINT,
    storage_size_bytes BIGINT,
    ai_messages INTEGER,
    ai_cost_usd NUMERIC(10, 4),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE core.platform_snapshots ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON core.platform_snapshots TO service_role;

COMMENT ON TABLE core.platform_snapshots IS
'Potret harian metrik platform (tanggal WIB) untuk tren; diisi cron per jam (upsert). Hanya service_role.';

COMMIT;
