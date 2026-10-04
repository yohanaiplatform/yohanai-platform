-- ============================================================================
-- 065_knowledge_curator_review.sql
-- Yohan.AI Platform -- kurator pengetahuan AI + antrean persetujuan (4 Oktober 2026)
--
-- Pengetahuan AI tetap SATU kumpulan bersama, tapi user biasa hanya bisa
-- MENAMBAH usulan (review_status = 'pending', tidak dipakai AI); kurator
-- (auth_ext.profiles.is_knowledge_curator) yang menyetujui/menolak. Hanya
-- review_status = 'approved' yang dibaca AI Agent (knowledge.entries) / dipakai
-- untuk jarak (knowledge.places).
--
-- Trigger trg_protect_curator_flag: user biasa TIDAK bisa menjadikan dirinya
-- kurator lewat Edit Profile (hanya admin/service_role) -- diuji 4 Okt 2026.
-- ============================================================================

BEGIN;

ALTER TABLE auth_ext.profiles ADD COLUMN IF NOT EXISTS is_knowledge_curator BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE knowledge.entries
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved' CHECK (review_status IN ('approved', 'pending', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

ALTER TABLE knowledge.places
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved' CHECK (review_status IN ('approved', 'pending', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION auth_ext.protect_curator_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_ext, core, public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT core.is_admin_or_above() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_knowledge_curator := false;
    ELSIF NEW.is_knowledge_curator IS DISTINCT FROM OLD.is_knowledge_curator THEN
      NEW.is_knowledge_curator := OLD.is_knowledge_curator;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION auth_ext.protect_curator_flag() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_curator_flag ON auth_ext.profiles;
CREATE TRIGGER trg_protect_curator_flag
BEFORE INSERT OR UPDATE ON auth_ext.profiles
FOR EACH ROW
EXECUTE FUNCTION auth_ext.protect_curator_flag();

-- Kurator awal: akun harian Yohan dan akun developer.
UPDATE auth_ext.profiles SET is_knowledge_curator = true
WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('yohanbenyamin@gmail.com', 'admin@yohanai.id'));

COMMENT ON COLUMN auth_ext.profiles.is_knowledge_curator IS
'Kurator pengetahuan AI: boleh menyetujui/menolak usulan pengetahuan dan titik peta dari user lain. Hanya admin/service_role yang bisa mengubahnya (trigger trg_protect_curator_flag).';

COMMIT;
