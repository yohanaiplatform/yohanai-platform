-- ============================================================================
-- 056_whatsapp_numbers.sql
-- Yohan.AI Platform -- pemetaan nomor WhatsApp (Kapso phone_number_id) ke
-- pemilik default, persiapan multi-nomor/multi-agent untuk SaaS.
--
-- Sebelumnya satu env var tunggal (WHATSAPP_DEFAULT_ASSIGNEE_USER_ID) dipakai
-- buat tentukan siapa pemilik lead baru dari WA masuk -- cukup untuk 1 nomor,
-- tapi begitu agent lain (mis. Ramlan) sambungkan nomor WA-nya sendiri,
-- SEMUA lead baru (dari nomor manapun) tetap ke 1 user yang sama, dan
-- balasan keluar juga tetap terkirim dari 1 nomor yang sama (salah nomor
-- pengirim -- WhatsApp Business API mengharuskan balasan dari nomor yang
-- sama dengan yang di-chat customer).
--
-- Tabel ini jadi sumber kebenaran "nomor X -> pemilik default Y" untuk:
-- (1) assignment lead baru dari WA masuk tanpa lead (webhook/route.ts), dan
-- (2) fallback pilih nomor pengirim saat balas ke lead yang belum pernah
--     punya percakapan sebelumnya (send/route.ts) -- kalau percakapan sudah
--     ada, nomor pengirim diambil dari chat.conversations.metadata.phone_
--     number_id (nomor yang memang dipakai lead chat duluan), bukan dari
--     tabel ini.
--
-- phone_number_id dari Kapso dipakai apa adanya (bukan UUID kita) --
-- didapat dari payload webhook ("phone_number_id" di top level, dikonfirmasi
-- lewat docs.kapso.ai) dan dari env var KAPSO_PHONE_NUMBER_ID yang sudah ada.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS chat.whatsapp_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    phone_number_id TEXT NOT NULL UNIQUE,
    label TEXT,

    assigned_to UUID NOT NULL REFERENCES auth.users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE chat.whatsapp_numbers ENABLE ROW LEVEL SECURITY;

-- Admin-only -- ini konfigurasi routing WhatsApp, bukan data lead/listing
-- yang perlu dilihat agent biasa.
DROP POLICY IF EXISTS whatsapp_numbers_admin_only ON chat.whatsapp_numbers;

CREATE POLICY whatsapp_numbers_admin_only ON chat.whatsapp_numbers
FOR ALL
TO authenticated
USING (core.is_admin_or_above())
WITH CHECK (core.is_admin_or_above());

DROP TRIGGER IF EXISTS trg_whatsapp_numbers_updated_at ON chat.whatsapp_numbers;

CREATE TRIGGER trg_whatsapp_numbers_updated_at
BEFORE UPDATE
ON chat.whatsapp_numbers
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- GRANT -- authenticated butuh hak tabel dasar (RLS di atas yang batasi ke
-- admin), service_role butuh SELECT buat lookup dari webhook (tidak perlu
-- tulis dari situ, pengelolaan cuma lewat UI admin).
GRANT SELECT, INSERT, UPDATE, DELETE ON chat.whatsapp_numbers TO authenticated;
GRANT SELECT ON chat.whatsapp_numbers TO service_role;

-- Seed nomor produksi yang sudah aktif sekarang (2 Oktober 2026).
INSERT INTO chat.whatsapp_numbers (phone_number_id, label, assigned_to)
VALUES (
  '1007716855765820',
  'Griya Indonesia - Rumah Murah Pontianak',
  'fba8a248-d30c-4ec3-99ee-02b11bf74d6a'
)
ON CONFLICT (phone_number_id) DO NOTHING;

COMMENT ON TABLE chat.whatsapp_numbers IS
'Pemetaan nomor WhatsApp (Kapso phone_number_id) -> pemilik default untuk lead baru dari nomor itu + fallback nomor pengirim balasan. Kelola lewat UI admin di Settings, bukan env var.';

COMMIT;
