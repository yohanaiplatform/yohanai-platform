-- =====================================================================
-- Migration: Edit Profile Feature — role-conditional fields, alamat
-- wilayah, dan sistem completeness table-driven (bukan hardcode)
-- Jalankan urut dari atas ke bawah di Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BUSINESS ROLES
-- Terpisah dari core.roles (yang itu role akses/permission sistem:
-- admin, manager, marketing, dst). Ini role bisnis untuk kategori
-- pengguna platform (siapa dia sebagai pelaku properti).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.business_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        varchar(50) NOT NULL UNIQUE,  -- slug stabil, dipakai di kode
  name        varchar(100) NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO core.business_roles (code, name, description) VALUES
  ('agent_freelance',    'Agen Freelance',            'Agen properti independen, tidak terikat kantor agensi'),
  ('agent_agency',       'Agen dari Kantor Agen',      'Agen properti yang bernaung di bawah kantor/agensi'),
  ('developer',          'Developer',                  'Perusahaan pengembang properti'),
  ('individual_owner',   'Pemilik Properti Pribadi',   'Individu yang menjual/menyewakan properti milik sendiri')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. WILAYAH ADMINISTRATIF (referensi statis, ternormalisasi)
-- Struktur kode mengikuti konvensi Kepmendagri (kode berjenjang):
-- provinsi (2 digit) . kabupaten (2 digit) . kecamatan (2 digit) . desa (4 digit)
-- Sesuai untuk seed dari dataset cahyadsn/wilayah.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wilayah_provinsi (
  id    varchar(2) PRIMARY KEY,       -- contoh: '61' Kalimantan Barat
  name  varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS wilayah_kabupaten (
  id            varchar(5) PRIMARY KEY,   -- contoh: '61.01'
  provinsi_id   varchar(2) NOT NULL REFERENCES wilayah_provinsi(id),
  name          varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS wilayah_kecamatan (
  id            varchar(8) PRIMARY KEY,   -- contoh: '61.01.01'
  kabupaten_id  varchar(5) NOT NULL REFERENCES wilayah_kabupaten(id),
  name          varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS wilayah_desa (
  id             varchar(13) PRIMARY KEY, -- contoh: '61.01.01.2001'
  kecamatan_id   varchar(8) NOT NULL REFERENCES wilayah_kecamatan(id),
  name           varchar(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wilayah_kabupaten_provinsi ON wilayah_kabupaten(provinsi_id);
CREATE INDEX IF NOT EXISTS idx_wilayah_kecamatan_kabupaten ON wilayah_kecamatan(kabupaten_id);
CREATE INDEX IF NOT EXISTS idx_wilayah_desa_kecamatan ON wilayah_desa(kecamatan_id);

-- Catatan: tabel di atas kosong sampai kamu jalankan seed script terpisah
-- (Next Step #2 di brief) — jangan insert manual, pakai import dataset.

-- ---------------------------------------------------------------------
-- 3. ALTER auth_ext.profiles
-- Tidak menambah kolom `phone` — nomor terverifikasi tetap sumber
-- tunggal di auth.users.phone (via Supabase Phone Auth / Twilio Verify),
-- supaya tidak ada duplikasi & risiko out-of-sync.
-- ---------------------------------------------------------------------
ALTER TABLE auth_ext.profiles
  ADD COLUMN IF NOT EXISTS business_role_id  uuid REFERENCES core.business_roles(id),
  ADD COLUMN IF NOT EXISTS address_line      text,               -- nama jalan/kompleks, teks bebas
  ADD COLUMN IF NOT EXISTS wilayah_desa_id   varchar(13) REFERENCES wilayah_desa(id),
  ADD COLUMN IF NOT EXISTS facebook_url      text,
  ADD COLUMN IF NOT EXISTS instagram_url     text,
  ADD COLUMN IF NOT EXISTS tiktok_url        text,
  ADD COLUMN IF NOT EXISTS linkedin_url      text,
  ADD COLUMN IF NOT EXISTS twitter_x_url     text,
  ADD COLUMN IF NOT EXISTS website_url       text,
  ADD COLUMN IF NOT EXISTS role_details      jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_business_role ON auth_ext.profiles(business_role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_wilayah_desa ON auth_ext.profiles(wilayah_desa_id);
-- GIN index untuk query ke dalam JSONB kalau nanti dibutuhkan (mis. filter sertifikasi)
CREATE INDEX IF NOT EXISTS idx_profiles_role_details ON auth_ext.profiles USING gin (role_details);

-- ---------------------------------------------------------------------
-- 4. PROFILE COMPLETENESS RULES (table-driven, TANPA hardcode di kode)
--
-- Setiap baris = satu syarat kelengkapan. field_key merujuk ke:
--   - kolom asli di auth_ext.profiles (mis. 'address_line'), ATAU
--   - kolom di auth.users (mis. 'phone', 'phone_confirmed_at'), ATAU
--   - key di dalam JSONB role_details (mis. 'has_broker_certificate')
-- source membedakan ketiganya supaya fungsi checker tahu cara baca.
--
-- business_role_id NULL artinya field itu wajib untuk SEMUA role (umum).
--
-- Dukungan conditional required (mis. no. sertifikat cuma wajib kalau
-- has_broker_certificate = true) lewat depends_on_field_key +
-- depends_on_value. Kalau kosong berarti tidak bersyarat.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_completeness_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_role_id      uuid REFERENCES core.business_roles(id),  -- NULL = berlaku semua role
  tier                  smallint NOT NULL CHECK (tier IN (1, 2)), -- 1 = baseline, 2 = full
  field_key             varchar(100) NOT NULL,
  source                varchar(20) NOT NULL CHECK (source IN ('profiles_column', 'auth_users_column', 'role_details_json')),
  label                 varchar(150) NOT NULL,       -- untuk ditampilkan di progress bar UI
  depends_on_field_key  varchar(100),                -- NULL = tidak bersyarat
  depends_on_value      text,                        -- dibandingkan sebagai text (mis. 'true')
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_completeness_rules_role_tier
  ON profile_completeness_rules(business_role_id, tier) WHERE is_active;

-- --- Seed: field UMUM (berlaku semua role) ---
-- Tier 1 (baseline / akses Dashboard)
INSERT INTO profile_completeness_rules (business_role_id, tier, field_key, source, label) VALUES
  (NULL, 1, 'business_role_id', 'profiles_column', 'Role'),
  (NULL, 1, 'first_name',       'profiles_column', 'Nama Lengkap'),
  (NULL, 1, 'phone_confirmed_at', 'auth_users_column', 'Nomor Telepon/WA (terverifikasi)'),
  (NULL, 1, 'address_line',     'profiles_column', 'Alamat'),
  (NULL, 1, 'wilayah_desa_id',  'profiles_column', 'Wilayah (Provinsi–Desa)');

-- Tier 2 (full completion / publish)
INSERT INTO profile_completeness_rules (business_role_id, tier, field_key, source, label) VALUES
  (NULL, 2, 'avatar_url',    'profiles_column', 'Foto Profil'),
  (NULL, 2, 'facebook_url',  'profiles_column', 'Facebook'),
  (NULL, 2, 'instagram_url', 'profiles_column', 'Instagram');
-- tiktok/linkedin/x/website: opsional per brief -> sengaja TIDAK dimasukkan rules

-- --- Seed: role-specific, Tier 2 ---
-- Agen Freelance
INSERT INTO profile_completeness_rules (business_role_id, tier, field_key, source, label)
SELECT id, 2, 'service_area', 'role_details_json', 'Area Layanan' FROM core.business_roles WHERE code = 'agent_freelance'
UNION ALL
SELECT id, 2, 'property_specialization', 'role_details_json', 'Spesialisasi Properti' FROM core.business_roles WHERE code = 'agent_freelance'
UNION ALL
SELECT id, 2, 'has_broker_certificate', 'role_details_json', 'Sertifikasi Broker Properti (Ya/Tidak)' FROM core.business_roles WHERE code = 'agent_freelance';

-- No. sertifikat: CONDITIONAL, cuma wajib kalau has_broker_certificate = 'true'
INSERT INTO profile_completeness_rules (business_role_id, tier, field_key, source, label, depends_on_field_key, depends_on_value)
SELECT id, 2, 'broker_certificate_number', 'role_details_json', 'No. Sertifikat Broker',
       'has_broker_certificate', 'true'
FROM core.business_roles WHERE code = 'agent_freelance';

-- Agen dari Kantor Agen
INSERT INTO profile_completeness_rules (business_role_id, tier, field_key, source, label)
SELECT id, 2, 'agency_name', 'role_details_json', 'Nama Kantor/Agensi' FROM core.business_roles WHERE code = 'agent_agency'
UNION ALL
SELECT id, 2, 'position', 'role_details_json', 'Jabatan' FROM core.business_roles WHERE code = 'agent_agency'
UNION ALL
SELECT id, 2, 'is_arebi_member', 'role_details_json', 'Member AREBI (Ya/Tidak)' FROM core.business_roles WHERE code = 'agent_agency'
UNION ALL
SELECT id, 2, 'has_broker_certificate', 'role_details_json', 'Sertifikasi Broker Properti (Ya/Tidak)' FROM core.business_roles WHERE code = 'agent_agency';
-- agency_license_number sengaja tidak masuk rules -> opsional per brief

INSERT INTO profile_completeness_rules (business_role_id, tier, field_key, source, label, depends_on_field_key, depends_on_value)
SELECT id, 2, 'broker_certificate_number', 'role_details_json', 'No. Sertifikat Broker',
       'has_broker_certificate', 'true'
FROM core.business_roles WHERE code = 'agent_agency';

-- Developer
INSERT INTO profile_completeness_rules (business_role_id, tier, field_key, source, label)
SELECT id, 2, 'company_name', 'role_details_json', 'Nama Perusahaan' FROM core.business_roles WHERE code = 'developer'
UNION ALL
SELECT id, 2, 'company_legal_id', 'role_details_json', 'NIB/Legalitas' FROM core.business_roles WHERE code = 'developer';
-- jumlah project aktif: opsional per brief -> tidak masuk rules

-- Pemilik Properti Pribadi
INSERT INTO profile_completeness_rules (business_role_id, tier, field_key, source, label)
SELECT id, 2, 'property_count', 'role_details_json', 'Jumlah Properti untuk Dijual/Disewa' FROM core.business_roles WHERE code = 'individual_owner'
UNION ALL
SELECT id, 2, 'asset_types', 'role_details_json', 'Tipe Aset' FROM core.business_roles WHERE code = 'individual_owner';

-- ---------------------------------------------------------------------
-- 5. FUNCTION: check_profile_completeness
-- Generic, dipanggil dari modul mana saja (Dashboard, Property, CRM).
-- Return: JSON berisi status lengkap/belum + list field yang hilang
-- (untuk progress bar UI) + persentase.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_profile_completeness(
  p_user_id uuid,
  p_tier smallint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_ext, auth, core
AS $$
DECLARE
  v_profile   auth_ext.profiles%ROWTYPE;
  v_auth_user auth.users%ROWTYPE;
  v_rule      record;
  v_total     int := 0;
  v_filled    int := 0;
  v_missing   jsonb := '[]'::jsonb;
  v_value     text;
  v_dep_value text;
  v_applies   boolean;
BEGIN
  SELECT * INTO v_profile FROM auth_ext.profiles WHERE user_id = p_user_id;
  SELECT * INTO v_auth_user FROM auth.users WHERE id = p_user_id;

  IF v_profile.user_id IS NULL THEN
    RETURN jsonb_build_object('is_complete', false, 'percentage', 0, 'missing_fields', '[]'::jsonb);
  END IF;

  FOR v_rule IN
    SELECT * FROM profile_completeness_rules r
    WHERE r.tier = p_tier
      AND r.is_active
      AND (r.business_role_id IS NULL OR r.business_role_id = v_profile.business_role_id)
  LOOP
    -- Evaluasi apakah rule ini berlaku (cek depends_on kalau ada)
    v_applies := true;
    IF v_rule.depends_on_field_key IS NOT NULL THEN
      v_dep_value := v_profile.role_details ->> v_rule.depends_on_field_key;
      v_applies := (v_dep_value = v_rule.depends_on_value);
    END IF;

    IF NOT v_applies THEN
      CONTINUE; -- rule tidak relevan untuk kondisi user ini, skip dari hitungan
    END IF;

    v_total := v_total + 1;

    -- Ambil value sesuai source
    IF v_rule.source = 'profiles_column' THEN
      EXECUTE format('SELECT ($1).%I::text', v_rule.field_key) INTO v_value USING v_profile;
    ELSIF v_rule.source = 'auth_users_column' THEN
      EXECUTE format('SELECT ($1).%I::text', v_rule.field_key) INTO v_value USING v_auth_user;
    ELSIF v_rule.source = 'role_details_json' THEN
      v_value := v_profile.role_details ->> v_rule.field_key;
    END IF;

    IF v_value IS NOT NULL AND v_value <> '' THEN
      v_filled := v_filled + 1;
    ELSE
      v_missing := v_missing || jsonb_build_object('field_key', v_rule.field_key, 'label', v_rule.label);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'is_complete', (v_total > 0 AND v_filled = v_total),
    'percentage', CASE WHEN v_total = 0 THEN 100 ELSE round((v_filled::numeric / v_total) * 100) END,
    'missing_fields', v_missing,
    'total_fields', v_total,
    'filled_fields', v_filled
  );
END;
$$;

-- Contoh pemakaian dari Next.js (lewat supabase.rpc):
-- const { data } = await supabase.rpc('check_profile_completeness', { p_user_id: user.id, p_tier: 1 });

-- =====================================================================
-- SELESAI. Langkah selanjutnya (di luar migration ini):
-- 1. Seed data wilayah_provinsi/kabupaten/kecamatan/desa dari cahyadsn/wilayah
-- 2. Setup Twilio Verify sebagai Phone provider di Supabase Auth dashboard
-- 3. Build cascading dropdown wilayah
-- 4. Build form Edit Profile (baca daftar field wajib dari
--    profile_completeness_rules, bukan hardcode di form component)
-- =====================================================================