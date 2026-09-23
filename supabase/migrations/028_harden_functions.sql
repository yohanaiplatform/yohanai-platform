-- ============================================================================
-- 028_harden_functions.sql
-- Yohan.AI Platform — Pengerasan hak akses dan search_path fungsi
--
-- Hasil audit Supabase database linter, 23 September 2026.
-- ============================================================================

BEGIN;

-- ============================================================================
-- MASALAH 1 — `anon` masih bisa memanggil check_profile_completeness
--
-- Migration 025 memakai REVOKE ALL ... FROM PUBLIC, dan itu TIDAK cukup.
-- Supabase memberi EXECUTE secara eksplisit ke role `anon` dan `authenticated`
-- lewat default privileges, bukan lewat PUBLIC — sehingga revoke dari PUBLIC
-- tidak menyentuhnya sama sekali.
--
-- Dampaknya: siapa pun tanpa login bisa memanggil
-- /rest/v1/rpc/check_profile_completeness dengan UUID user mana pun dan
-- mengetahui berapa persen profil orang itu terisi serta field apa saja yang
-- masih kosong. Nilai fieldnya tidak ikut bocor, tapi ini tetap kebocoran
-- informasi yang tidak pernah diniatkan.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.check_profile_completeness(UUID, SMALLINT) FROM anon;

-- Fungsi trigger tidak perlu hak EXECUTE untuk siapa pun: trigger dijalankan
-- atas nama pemilik tabel, bukan atas nama pemanggil. Dicabut agar tidak
-- muncul lagi di linter. Fungsi ini juga tidak benar-benar bisa dipanggil
-- lewat RPC karena bertipe kembalian `trigger`.
REVOKE EXECUTE ON FUNCTION auth_ext.handle_new_user() FROM anon, authenticated;

-- ============================================================================
-- MASALAH 2 — search_path empat fungsi core tidak dikunci
--
-- Tanpa search_path tetap, nama objek di dalam fungsi diselesaikan memakai
-- search_path milik pemanggil. Pemanggil yang jahat bisa menaruh objek
-- bernama sama di schema lain dan membuat fungsi mengeksekusi sesuatu yang
-- tidak diniatkan.
--
-- `core.is_authenticated()` paling penting: fungsi ini dipakai oleh policy
-- RLS di SELURUH tabel domain.
--
-- Aman di-set kosong karena keempatnya hanya memakai now() (dari pg_catalog,
-- yang selalu ikut dicari) dan auth.uid() yang sudah ditulis lengkap dengan
-- nama schema-nya.
-- ============================================================================

ALTER FUNCTION core.is_authenticated()         SET search_path = '';
ALTER FUNCTION core.update_updated_at_column() SET search_path = '';
ALTER FUNCTION core.set_created_defaults()     SET search_path = '';
ALTER FUNCTION core.soft_delete_record()       SET search_path = '';

COMMIT;
