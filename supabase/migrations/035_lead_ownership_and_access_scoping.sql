-- ============================================================================
-- 035_lead_ownership_and_access_scoping.sql
-- Yohan.AI Platform — pisahkan visibilitas lead per akun (owner vs agent)
--
-- Dipicu temuan 23 September 2026: ada akun kedua (Ramlan Hadiansyah,
-- rekan Yohan di Griya Indonesia) yang, dengan policy authenticated_all
-- yang lama, otomatis bisa melihat SEMUA 1968 lead -- bukan cuma
-- miliknya. Keputusan yang diambil (dikonfirmasi Yohan):
--
--   - Owner/admin (role 'admin'/'super_admin') tetap lihat SEMUA lead.
--   - Agent (dan role lain) cuma lihat lead yang assigned_to dirinya.
--   - 1968 lead lama (dari Google Form, sebelum ada pembagian per-agen)
--     di-assign ke admin@yohanai.id sebagai pemilik bisnis.
--   - admin@yohanai.id untuk SEMENTARA tetap dipakai harian (dev/testing
--     dengan data asli) sekaligus berperan admin -- pemisahan akun
--     developer vs akun bisnis murni ditunda sampai strukturnya firm.
--
-- core.roles/core.permissions/core.role_permissions ternyata sudah ada
-- sejak migration awal (001-021) tapi tidak pernah dipakai sama sekali
-- (role_permissions kosong, 0 baris). Migration ini SENGAJA tidak
-- menyentuh sistem permission granular itu -- cukup pakai core.roles +
-- auth_ext.profiles.role_id untuk keputusan biner admin/bukan-admin,
-- supaya tidak menambah kerumitan yang belum diperlukan.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Kolom assigned_to -- kepemilikan CRM, terpisah dari created_by/updated_by
--    (yang cuma audit trail siapa insert/update, bukan "lead ini milik siapa").
-- ----------------------------------------------------------------------------
ALTER TABLE customer.leads
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON customer.leads(assigned_to);

-- ----------------------------------------------------------------------------
-- 2. Backfill: semua lead yang belum punya assigned_to jadi milik owner
--    (admin@yohanai.id) -- ini histori lead sebelum ada pembagian per-agen.
-- ----------------------------------------------------------------------------
UPDATE customer.leads
SET assigned_to = (SELECT id FROM auth.users WHERE email = 'admin@yohanai.id')
WHERE assigned_to IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Beri Ramlan role 'agent' -- sebelumnya role_id NULL (badge "No Role
--    Assigned"). Tanpa role eksplisit dia tetap ter-restrict dengan benar
--    (default aman), tapi biar rapi & profile-nya benar.
-- ----------------------------------------------------------------------------
UPDATE auth_ext.profiles
SET role_id = (SELECT id FROM core.roles WHERE name = 'agent')
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ramlan.hadiansyah@gmail.com')
  AND role_id IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Helper function: apakah pemanggil admin/super_admin?
--    Pola sama seperti core.is_authenticated() -- SECURITY DEFINER supaya
--    bisa baca auth_ext.profiles + core.roles terlepas dari RLS tabel itu,
--    search_path dikunci, EXECUTE dicabut dari PUBLIC & anon eksplisit.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION core.is_admin_or_above()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'core', 'auth_ext', 'auth'
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth_ext.profiles p
    JOIN core.roles r ON r.id = p.role_id
    WHERE p.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
      AND r.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION core.is_admin_or_above() FROM PUBLIC;
REVOKE ALL ON FUNCTION core.is_admin_or_above() FROM anon;
GRANT EXECUTE ON FUNCTION core.is_admin_or_above() TO authenticated;

COMMENT ON FUNCTION core.is_admin_or_above() IS
'true kalau pemanggil (auth.uid()) punya role admin/super_admin. Dipakai RLS policy customer.leads untuk visibilitas owner-lihat-semua.';

-- ----------------------------------------------------------------------------
-- 5. Ganti policy authenticated_all (semua-lihat-semua) jadi scoped.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS authenticated_all ON customer.leads;

CREATE POLICY leads_owner_or_admin ON customer.leads
FOR ALL
TO authenticated
USING (
  assigned_to = auth.uid() OR core.is_admin_or_above()
)
WITH CHECK (
  assigned_to = auth.uid() OR core.is_admin_or_above()
);

COMMIT;
