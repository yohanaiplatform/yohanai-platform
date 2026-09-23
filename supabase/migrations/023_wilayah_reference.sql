-- ============================================================================
-- 023_wilayah_reference.sql
-- Yohan.AI Platform — Referensi wilayah administratif Indonesia (Sprint 011)
--
-- REKONSTRUKSI dari struktur database production, 23 September 2026.
-- Lihat catatan di 022_business_roles.sql.
--
-- CATATAN DATA: file ini hanya membuat STRUKTUR. Isinya (38 provinsi,
-- 514 kabupaten/kota, 7.285 kecamatan, 83.762 desa/kelurahan) diimport
-- terpisah lewat CSV dari dataset cahyadsn/wilayah berkode Kemendagri —
-- terlalu besar untuk ditaruh sebagai INSERT di dalam migration.
-- Data tersebut sudah ada di database production dan tidak ikut terhapus
-- oleh file ini.
--
-- Tabel sengaja berada di schema `public`, bukan `core`, karena bersifat
-- referensi global dan dipakai lintas modul.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.wilayah_provinsi (
    id   VARCHAR(2)   PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wilayah_kabupaten (
    id          VARCHAR(5)   PRIMARY KEY,
    provinsi_id VARCHAR(2)   NOT NULL REFERENCES public.wilayah_provinsi(id),
    name        VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wilayah_kecamatan (
    id           VARCHAR(8)   PRIMARY KEY,
    kabupaten_id VARCHAR(5)   NOT NULL REFERENCES public.wilayah_kabupaten(id),
    name         VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wilayah_desa (
    id           VARCHAR(13)  PRIMARY KEY,
    kecamatan_id VARCHAR(8)   NOT NULL REFERENCES public.wilayah_kecamatan(id),
    name         VARCHAR(100) NOT NULL
);

-- ============================================================================
-- INDEX
-- Cascading selector meng-query per level (bukan menarik 83rb baris sekaligus),
-- jadi index pada kolom induk yang dipakai setiap kali dropdown dibuka.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wilayah_kabupaten_provinsi
ON public.wilayah_kabupaten(provinsi_id);

CREATE INDEX IF NOT EXISTS idx_wilayah_kecamatan_kabupaten
ON public.wilayah_kecamatan(kabupaten_id);

CREATE INDEX IF NOT EXISTS idx_wilayah_desa_kecamatan
ON public.wilayah_desa(kecamatan_id);

-- ============================================================================
-- RLS + GRANT
--
-- Data referensi publik, tapi tetap dibatasi ke user yang sudah login —
-- tidak ada alasan membukanya ke `anon`.
-- ============================================================================

ALTER TABLE public.wilayah_provinsi  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayah_kabupaten ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayah_kecamatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayah_desa      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read wilayah_provinsi"  ON public.wilayah_provinsi;
DROP POLICY IF EXISTS "authenticated users can read wilayah_kabupaten" ON public.wilayah_kabupaten;
DROP POLICY IF EXISTS "authenticated users can read wilayah_kecamatan" ON public.wilayah_kecamatan;
DROP POLICY IF EXISTS "authenticated users can read wilayah_desa"      ON public.wilayah_desa;

CREATE POLICY "authenticated users can read wilayah_provinsi"
ON public.wilayah_provinsi  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "authenticated users can read wilayah_kabupaten"
ON public.wilayah_kabupaten FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "authenticated users can read wilayah_kecamatan"
ON public.wilayah_kecamatan FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "authenticated users can read wilayah_desa"
ON public.wilayah_desa      FOR SELECT TO authenticated USING (TRUE);

GRANT SELECT ON public.wilayah_provinsi  TO authenticated;
GRANT SELECT ON public.wilayah_kabupaten TO authenticated;
GRANT SELECT ON public.wilayah_kecamatan TO authenticated;
GRANT SELECT ON public.wilayah_desa      TO authenticated;

COMMIT;
