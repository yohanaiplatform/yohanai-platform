-- ============================================================================
-- 036_list_assignable_users.sql
-- Yohan.AI Platform -- fungsi buat dropdown "assign lead ke agent"
--
-- Masalahnya: RLS auth_ext.profiles cuma izinkan user baca profil sendiri
-- (user_id = auth.uid()). Jadi admin yang mau lihat daftar agent buat
-- di-assign lead, query biasa dari client bakal balik kosong -- bukan
-- cuma lead yang di-restrict, daftar user-nya juga.
--
-- Pola sama seperti core.is_admin_or_above() (migration 035):
-- SECURITY DEFINER supaya bisa baca auth_ext.profiles/auth.users/core.roles
-- terlepas dari RLS, identitas pemanggil diambil dari auth.uid() (bukan
-- parameter client), search_path dikunci, EXECUTE dicabut dari PUBLIC+anon.
--
-- Sengaja RETURN KOSONG (bukan raise exception) kalau pemanggil bukan
-- admin/super_admin -- UI pakai ini buat auto-hide dropdown assign buat
-- non-admin, tanpa perlu query terpisah "apakah saya admin".
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.list_assignable_users()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  role_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'core', 'auth_ext', 'auth'
STABLE
AS $$
  SELECT
    p.user_id,
    NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), '') AS display_name,
    u.email,
    r.name AS role_name
  FROM auth_ext.profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN core.roles r ON r.id = p.role_id
  WHERE core.is_admin_or_above()
  ORDER BY r.name, display_name;
$$;

REVOKE ALL ON FUNCTION core.list_assignable_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION core.list_assignable_users() FROM anon;
GRANT EXECUTE ON FUNCTION core.list_assignable_users() TO authenticated;

COMMENT ON FUNCTION core.list_assignable_users() IS
'Daftar user (id, nama, email, role) untuk dropdown assign lead di Lead Detail. Return kosong kalau pemanggil bukan admin/super_admin -- dipakai UI buat auto-hide dropdown assign untuk non-admin.';

COMMIT;
