-- ============================================================================
-- 029_revoke_public_execute.sql
-- Yohan.AI Platform — Cabut EXECUTE dari PUBLIC pada handle_new_user
--
-- Lanjutan 028. Verifikasi setelah 028 diterapkan menunjukkan
-- auth_ext.handle_new_user masih bisa dieksekusi anon.
-- ============================================================================

BEGIN;

-- ============================================================================
-- Dua sumber hak EXECUTE, dan keduanya harus dicabut
--
-- Ini kebalikan persis dari masalah di 025/028, jadi catat baik-baik:
--
--   * CREATE FUNCTION di Postgres otomatis memberi EXECUTE ke PUBLIC.
--   * Supabase TAMBAHAN memberi EXECUTE eksplisit ke `anon` dan
--     `authenticated` lewat default privileges.
--
-- Mencabut dari salah satunya saja tidak cukup:
--   - Di 025 saya cabut dari PUBLIC saja → hak eksplisit `anon` tetap hidup.
--   - Di 028 saya cabut dari `anon` saja → hak lewat PUBLIC tetap hidup.
--
-- Untuk benar-benar mengunci sebuah fungsi: cabut dari PUBLIC, lalu berikan
-- eksplisit hanya ke role yang memang perlu.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION auth_ext.handle_new_user() FROM PUBLIC;

-- ============================================================================
-- YANG SENGAJA TIDAK DISENTUH — core.is_authenticated()
--
-- Fungsi ini juga punya EXECUTE dari PUBLIC, tapi TIDAK dicabut, dan itu
-- keputusan sadar.
--
-- Fungsi ini dipanggil dari dalam policy RLS di seluruh tabel domain, dan
-- karena bersifat SECURITY INVOKER, ekspresi policy dievaluasi memakai hak
-- role pemanggil. Kalau `authenticated` kehilangan EXECUTE, setiap query ke
-- tabel domain akan gagal dengan permission denied — RLS di seluruh database
-- lumpuh sekaligus.
--
-- Imbalannya pun nyaris nol: fungsi ini hanya mengembalikan boolean tentang
-- sesi pemanggil sendiri (auth.uid() IS NOT NULL), tidak membocorkan apa pun.
-- Risiko besar, manfaat nol — dibiarkan.
--
-- Tiga fungsi trigger core (update_updated_at_column, set_created_defaults,
-- soft_delete_record) juga dibiarkan dengan alasan serupa: bukan SECURITY
-- DEFINER, tidak menyentuh data di luar baris yang sedang diproses, dan
-- tidak diflag linter.
-- ============================================================================

COMMIT;
