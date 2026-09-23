-- ============================================================================
-- 027_fix_missing_grants.sql
-- Yohan.AI Platform — Perbaikan GRANT dan hak akses
--
-- BERBEDA DARI 022–026. File-file itu merekonstruksi objek yang sudah ada.
-- File ini MENGUBAH keadaan database: memperbaiki dua masalah yang ditemukan
-- saat audit skema pada 23 September 2026.
-- ============================================================================

BEGIN;

-- ============================================================================
-- MASALAH 1 — Tabel customer.* punya policy RLS tapi tanpa GRANT sama sekali
--
-- Ketiga tabel sudah punya policy `authenticated_all` yang memakai
-- core.is_authenticated(). Tetapi role `authenticated` tidak punya GRANT
-- apa pun pada tabel-tabel itu, sehingga setiap query dari aplikasi tetap
-- ditolak Postgres sebelum RLS sempat dievaluasi.
--
-- Ini persis jebakan dua lapisan yang sudah memakan waktu di Edit Profile:
-- policy benar, tapi grant dasarnya tidak pernah diberikan.
--
-- Wajib diperbaiki sebelum modul CRM dan integrasi lead intake dikerjakan —
-- tanpa ini, lead yang masuk tidak akan pernah bisa dibaca dari aplikasi.
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON customer.leads        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer.contacts     TO authenticated;
GRANT SELECT                          ON customer.lead_sources TO authenticated;

-- ============================================================================
-- MASALAH 2 — Hak tulis berlebihan pada tabel referensi di schema public
--
-- Supabase memberi GRANT ALL ke `anon` dan `authenticated` secara default
-- untuk setiap tabel di schema public. Akibatnya tabel wilayah dan
-- profile_completeness_rules ikut terbawa hak INSERT, UPDATE, DELETE, dan
-- bahkan TRUNCATE.
--
-- Saat ini belum bisa dieksploitasi karena RLS aktif dan tidak ada policy
-- yang mengizinkan tulis. Tapi hak ini tidak pernah diniatkan, dan akan
-- berbahaya kalau suatu saat ada yang menambahkan policy permisif atau
-- mematikan RLS untuk keperluan debugging.
--
-- Data referensi ini hanya boleh dibaca, dan hanya oleh user yang sudah login.
-- ============================================================================

REVOKE ALL ON public.wilayah_provinsi            FROM anon, authenticated;
REVOKE ALL ON public.wilayah_kabupaten           FROM anon, authenticated;
REVOKE ALL ON public.wilayah_kecamatan           FROM anon, authenticated;
REVOKE ALL ON public.wilayah_desa                FROM anon, authenticated;
REVOKE ALL ON public.profile_completeness_rules  FROM anon, authenticated;

GRANT SELECT ON public.wilayah_provinsi           TO authenticated;
GRANT SELECT ON public.wilayah_kabupaten          TO authenticated;
GRANT SELECT ON public.wilayah_kecamatan          TO authenticated;
GRANT SELECT ON public.wilayah_desa               TO authenticated;
GRANT SELECT ON public.profile_completeness_rules TO authenticated;

-- ============================================================================
-- CATATAN — Masalah ketiga ditangani di 025_profile_completeness.sql
--
-- public.profile_completeness_rules punya RLS aktif tanpa satu pun policy,
-- sehingga pembacaan langsung dari client selalu mengembalikan nol baris.
-- Policy SELECT-nya ditambahkan di 025 bersama definisi tabelnya.
-- ============================================================================

COMMIT;
