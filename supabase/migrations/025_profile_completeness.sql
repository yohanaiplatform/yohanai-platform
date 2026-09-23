-- ============================================================================
-- 025_profile_completeness.sql
-- Yohan.AI Platform — Aturan kelengkapan profil (Sprint 011, Edit Profile)
--
-- REKONSTRUKSI dari struktur database production, 23 September 2026.
-- Lihat catatan di 022_business_roles.sql.
--
-- Inti pendekatan table-driven: field mana yang wajib TIDAK di-hardcode di
-- form, melainkan dibaca dari tabel ini. Menambah syarat baru cukup INSERT
-- satu baris, tanpa mengubah kode — kecuali tipe input UI-nya, yang tetap
-- dipetakan di FIELD_INPUT_TYPE pada EditProfileForm.tsx.
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: public.profile_completeness_rules
--
-- tier 1 = syarat dasar yang berlaku untuk semua user (business_role_id NULL)
-- tier 2 = syarat lanjutan, bisa global atau khusus satu business_role
--
-- source menentukan dari mana nilainya dibaca:
--   profiles_column   → kolom di auth_ext.profiles
--   auth_users_column → kolom di auth.users
--   role_details_json → key di dalam profiles.role_details
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profile_completeness_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- NULL berarti aturan berlaku untuk semua business_role.
    business_role_id UUID REFERENCES core.business_roles(id),

    tier      SMALLINT     NOT NULL CHECK (tier = ANY (ARRAY[1, 2])),
    field_key VARCHAR(100) NOT NULL,
    source    VARCHAR(20)  NOT NULL
        CHECK (source IN ('profiles_column', 'auth_users_column', 'role_details_json')),
    label     VARCHAR(150) NOT NULL,

    -- Field kondisional: aturan hanya berlaku bila field lain bernilai tertentu.
    -- Contoh: No. Sertifikat Broker hanya wajib bila has_broker_certificate = 'true'.
    depends_on_field_key VARCHAR(100),
    depends_on_value     TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_completeness_rule UNIQUE (business_role_id, tier, field_key)
);

ALTER TABLE public.profile_completeness_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_completeness_rules_role_tier
ON public.profile_completeness_rules(business_role_id, tier)
WHERE is_active;

-- ============================================================================
-- RLS + GRANT
--
-- PERHATIAN: di database production per 23 September 2026 tabel ini punya
-- RLS aktif TANPA satu pun policy — artinya pembacaan langsung dari client
-- selalu mengembalikan nol baris. Policy di bawah memperbaikinya.
-- Lihat 027_fix_missing_grants.sql untuk penjelasan lengkap.
-- ============================================================================

DROP POLICY IF EXISTS "authenticated users can read completeness rules"
ON public.profile_completeness_rules;

CREATE POLICY "authenticated users can read completeness rules"
ON public.profile_completeness_rules
FOR SELECT
TO authenticated
USING (is_active);

GRANT SELECT ON public.profile_completeness_rules TO authenticated;

-- ============================================================================
-- SEED: 21 aturan
-- ============================================================================

-- Aturan global (business_role_id NULL) memakai WHERE NOT EXISTS, bukan
-- ON CONFLICT. Sebabnya: uq_completeness_rule mencakup business_role_id yang
-- nullable, dan Postgres menganggap dua NULL selalu berbeda — sehingga
-- ON CONFLICT tidak akan pernah mendeteksi duplikat pada baris-baris ini
-- dan migration yang dijalankan ulang akan menggandakannya.

-- Tier 1 — berlaku untuk semua role
INSERT INTO public.profile_completeness_rules
    (business_role_id, tier, field_key, source, label)
SELECT NULL, 1, v.field_key, v.source, v.label
FROM (VALUES
    ('first_name',         'profiles_column',   'Nama Lengkap'),
    ('business_role_id',   'profiles_column',   'Role'),
    ('address_line',       'profiles_column',   'Alamat'),
    ('wilayah_desa_id',    'profiles_column',   'Wilayah (Provinsi–Desa)'),
    ('phone_confirmed_at', 'auth_users_column', 'Nomor Telepon/WA (terverifikasi)')
) AS v(field_key, source, label)
WHERE NOT EXISTS (
    SELECT 1 FROM public.profile_completeness_rules r
    WHERE r.business_role_id IS NULL
      AND r.tier = 1
      AND r.field_key = v.field_key
);

-- Tier 2 — global
INSERT INTO public.profile_completeness_rules
    (business_role_id, tier, field_key, source, label)
SELECT NULL, 2, v.field_key, 'profiles_column', v.label
FROM (VALUES
    ('avatar_url',    'Foto Profil'),
    ('facebook_url',  'Facebook'),
    ('instagram_url', 'Instagram')
) AS v(field_key, label)
WHERE NOT EXISTS (
    SELECT 1 FROM public.profile_completeness_rules r
    WHERE r.business_role_id IS NULL
      AND r.tier = 2
      AND r.field_key = v.field_key
);

-- Tier 2 — Agen dari Kantor Agen
INSERT INTO public.profile_completeness_rules
    (business_role_id, tier, field_key, source, label, depends_on_field_key, depends_on_value)
SELECT br.id, 2, v.field_key, 'role_details_json', v.label, v.dep_key, v.dep_val
FROM core.business_roles br
CROSS JOIN (VALUES
    ('agency_name',               'Nama Kantor/Agensi',                     NULL,                     NULL),
    ('position',                  'Jabatan',                                NULL,                     NULL),
    ('is_arebi_member',           'Member AREBI (Ya/Tidak)',                NULL,                     NULL),
    ('has_broker_certificate',    'Sertifikasi Broker Properti (Ya/Tidak)', NULL,                     NULL),
    ('broker_certificate_number', 'No. Sertifikat Broker',                  'has_broker_certificate', 'true')
) AS v(field_key, label, dep_key, dep_val)
WHERE br.code = 'agent_agency'
ON CONFLICT (business_role_id, tier, field_key) DO NOTHING;

-- Tier 2 — Agen Freelance
INSERT INTO public.profile_completeness_rules
    (business_role_id, tier, field_key, source, label, depends_on_field_key, depends_on_value)
SELECT br.id, 2, v.field_key, 'role_details_json', v.label, v.dep_key, v.dep_val
FROM core.business_roles br
CROSS JOIN (VALUES
    ('service_area',              'Area Layanan',                           NULL,                     NULL),
    ('property_specialization',   'Spesialisasi Properti',                  NULL,                     NULL),
    ('has_broker_certificate',    'Sertifikasi Broker Properti (Ya/Tidak)', NULL,                     NULL),
    ('broker_certificate_number', 'No. Sertifikat Broker',                  'has_broker_certificate', 'true')
) AS v(field_key, label, dep_key, dep_val)
WHERE br.code = 'agent_freelance'
ON CONFLICT (business_role_id, tier, field_key) DO NOTHING;

-- Tier 2 — Developer
INSERT INTO public.profile_completeness_rules
    (business_role_id, tier, field_key, source, label)
SELECT br.id, 2, v.field_key, 'role_details_json', v.label
FROM core.business_roles br
CROSS JOIN (VALUES
    ('company_name',     'Nama Perusahaan'),
    ('company_legal_id', 'NIB/Legalitas')
) AS v(field_key, label)
WHERE br.code = 'developer'
ON CONFLICT (business_role_id, tier, field_key) DO NOTHING;

-- Tier 2 — Pemilik Properti Pribadi
INSERT INTO public.profile_completeness_rules
    (business_role_id, tier, field_key, source, label)
SELECT br.id, 2, v.field_key, 'role_details_json', v.label
FROM core.business_roles br
CROSS JOIN (VALUES
    ('asset_types',    'Tipe Aset'),
    ('property_count', 'Jumlah Properti untuk Dijual/Disewa')
) AS v(field_key, label)
WHERE br.code = 'individual_owner'
ON CONFLICT (business_role_id, tier, field_key) DO NOTHING;

-- ============================================================================
-- FUNCTION: public.check_profile_completeness(uuid, smallint)
--
-- SECURITY DEFINER karena perlu membaca auth.users, yang tidak bisa diakses
-- role `authenticated` secara langsung. search_path dikunci eksplisit agar
-- fungsi tidak bisa dibajak lewat manipulasi search_path pemanggil.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_profile_completeness(
    p_user_id UUID,
    p_tier    SMALLINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth_ext', 'auth', 'core'
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION public.check_profile_completeness(UUID, SMALLINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_profile_completeness(UUID, SMALLINT) TO authenticated;

COMMIT;
