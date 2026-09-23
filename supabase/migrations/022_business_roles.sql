-- ============================================================================
-- 022_business_roles.sql
-- Yohan.AI Platform — Peran bisnis pengguna (Sprint 011, Edit Profile)
--
-- REKONSTRUKSI. Objek di file ini SUDAH ADA di database production sejak
-- Agustus 2026; SQL aslinya dijalankan lewat Supabase SQL Editor dan tidak
-- pernah di-commit. File ini ditulis ulang dari struktur database yang hidup
-- pada 23 September 2026 supaya riwayat migration kembali utuh.
--
-- Ditulis idempotent: aman dijalankan ulang di database yang objeknya sudah ada.
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: core.business_roles
-- Peran pengguna di industri properti. Menentukan field wajib mana yang
-- berlaku untuk user tersebut — lihat 025_profile_completeness.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.business_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE core.business_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS + GRANT
--
-- Dua lapisan berbeda: policy RLS saja tidak cukup, role `authenticated`
-- juga harus diberi GRANT. Tanpa GRANT, query tetap gagal walau policy benar.
-- ============================================================================

DROP POLICY IF EXISTS "authenticated users can read business_roles"
ON core.business_roles;

CREATE POLICY "authenticated users can read business_roles"
ON core.business_roles
FOR SELECT
TO authenticated
USING (TRUE);

GRANT SELECT ON core.business_roles TO authenticated;

-- ============================================================================
-- SEED: 4 peran bisnis
-- ============================================================================

INSERT INTO core.business_roles (code, name, description) VALUES
    ('agent_agency',     'Agen dari Kantor Agen',       'Agen properti yang bernaung di bawah kantor/agensi'),
    ('agent_freelance',  'Agen Freelance',              'Agen properti independen, tidak terikat kantor agensi'),
    ('developer',        'Developer',                   'Perusahaan pengembang properti'),
    ('individual_owner', 'Pemilik Properti Pribadi',    'Individu yang menjual/menyewakan properti milik sendiri')
ON CONFLICT (code) DO NOTHING;

COMMIT;
