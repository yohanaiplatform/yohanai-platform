-- ============================================================================
-- 030_secure_completeness_rpc.sql
-- Yohan.AI Platform — check_profile_completeness hanya boleh membaca profil
-- milik pemanggil sendiri
--
-- Hasil audit 23 September 2026.
-- ============================================================================

BEGIN;

-- ============================================================================
-- MASALAH
--
-- Fungsi ini SECURITY DEFINER dan menerima p_user_id dari client tanpa
-- diperiksa. Artinya setiap user yang sudah login bisa memanggil
-- /rest/v1/rpc/check_profile_completeness dengan UUID milik orang lain dan
-- mengetahui persentase kelengkapan profil orang itu beserta daftar field
-- yang masih kosong.
--
-- Migration 028 dan 029 menutup aksesnya dari `anon`. Tapi menutup pintu
-- luar tidak menyelesaikan masalah di dalam: antar sesama user yang login,
-- celahnya masih terbuka lebar.
--
-- PERBAIKAN
--
-- Identitas tidak lagi diambil dari parameter, melainkan dari auth.uid() —
-- nilai yang berasal dari JWT dan tidak bisa dipalsukan client. Parameter
-- p_user_id dipertahankan semata agar signature tidak berubah (aplikasi
-- tidak perlu diubah dan tidak ada jeda downtime), tetapi kini hanya boleh
-- berisi ID pemanggil sendiri. Diisi ID orang lain → ditolak dengan error,
-- bukan diam-diam dilayani.
--
-- Dengan begini celahnya tertutup secara struktural: sekalipun suatu saat
-- ada kode yang keliru mengirim ID orang lain, fungsinya menolak.
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
  v_caller    uuid;
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
  -- Identitas HANYA dari JWT. Jangan pernah percaya parameter dari client.
  v_caller := auth.uid();

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'check_profile_completeness: harus dipanggil oleh user yang sudah login'
      USING ERRCODE = '42501';
  END IF;

  -- Parameter dipertahankan demi kompatibilitas signature, tapi tidak boleh
  -- dipakai menengok profil orang lain.
  IF p_user_id IS NOT NULL AND p_user_id <> v_caller THEN
    RAISE EXCEPTION 'check_profile_completeness: hanya boleh memeriksa profil sendiri'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile   FROM auth_ext.profiles WHERE user_id = v_caller;
  SELECT * INTO v_auth_user FROM auth.users        WHERE id      = v_caller;

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

COMMENT ON FUNCTION public.check_profile_completeness(UUID, SMALLINT) IS
'Menghitung kelengkapan profil PEMANGGIL. Parameter p_user_id dipertahankan demi kompatibilitas signature dan harus berisi ID pemanggil sendiri (atau NULL); ID milik user lain ditolak. Identitas sebenarnya selalu diambil dari auth.uid().';

-- ============================================================================
-- HAK AKSES
--
-- Pola yang benar, sesuai pelajaran dari 025/028/029: cabut dari PUBLIC DAN
-- dari role eksplisit, baru berikan hanya ke role yang memang perlu.
-- CREATE OR REPLACE tidak mengatur ulang hak akses, tapi ditulis ulang di
-- sini supaya file ini tetap benar bila dijalankan di database baru.
-- ============================================================================

REVOKE ALL ON FUNCTION public.check_profile_completeness(UUID, SMALLINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_profile_completeness(UUID, SMALLINT) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_profile_completeness(UUID, SMALLINT) TO authenticated;

COMMIT;
