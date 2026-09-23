-- ============================================================================
-- 024_profiles_extension.sql
-- Yohan.AI Platform — Perluasan auth_ext.profiles (Sprint 011, Edit Profile)
--
-- REKONSTRUKSI dari struktur database production, 23 September 2026.
-- Lihat catatan di 022_business_roles.sql.
--
-- Kolom 1–11 dibuat di 005_auth_tables.sql. File ini menambahkan kolom 12–21.
-- ============================================================================

BEGIN;

-- ============================================================================
-- KOLOM BARU
-- ============================================================================

ALTER TABLE auth_ext.profiles
    ADD COLUMN IF NOT EXISTS business_role_id UUID,
    ADD COLUMN IF NOT EXISTS address_line     TEXT,
    ADD COLUMN IF NOT EXISTS wilayah_desa_id  VARCHAR(13),
    ADD COLUMN IF NOT EXISTS facebook_url     TEXT,
    ADD COLUMN IF NOT EXISTS instagram_url    TEXT,
    ADD COLUMN IF NOT EXISTS tiktok_url       TEXT,
    ADD COLUMN IF NOT EXISTS linkedin_url     TEXT,
    ADD COLUMN IF NOT EXISTS twitter_x_url    TEXT,
    ADD COLUMN IF NOT EXISTS website_url      TEXT,
    ADD COLUMN IF NOT EXISTS role_details     JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN auth_ext.profiles.role_details IS
'Field spesifik per business_role, disimpan sebagai JSONB supaya menambah field baru cukup lewat profile_completeness_rules tanpa migration kolom.';

-- ============================================================================
-- FOREIGN KEY
-- Dibungkus DO block karena ADD CONSTRAINT tidak punya IF NOT EXISTS.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_business_role_id_fkey'
    ) THEN
        ALTER TABLE auth_ext.profiles
            ADD CONSTRAINT profiles_business_role_id_fkey
            FOREIGN KEY (business_role_id) REFERENCES core.business_roles(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_wilayah_desa_id_fkey'
    ) THEN
        ALTER TABLE auth_ext.profiles
            ADD CONSTRAINT profiles_wilayah_desa_id_fkey
            FOREIGN KEY (wilayah_desa_id) REFERENCES public.wilayah_desa(id);
    END IF;
END
$$;

-- ============================================================================
-- INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_business_role
ON auth_ext.profiles(business_role_id);

CREATE INDEX IF NOT EXISTS idx_profiles_wilayah_desa
ON auth_ext.profiles(wilayah_desa_id);

-- GIN untuk pencarian di dalam role_details JSONB.
CREATE INDEX IF NOT EXISTS idx_profiles_role_details
ON auth_ext.profiles USING GIN (role_details);

-- ============================================================================
-- RLS + GRANT
-- ============================================================================

DROP POLICY IF EXISTS "users can update own profile" ON auth_ext.profiles;

CREATE POLICY "users can update own profile"
ON auth_ext.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, UPDATE ON auth_ext.profiles TO authenticated;

COMMIT;
