-- ============================================================================
-- 058_whatsapp_number_requests.sql
-- Yohan.AI Platform -- alur "Ajukan Nomor WhatsApp" untuk user non-admin,
-- + kolom webhook_secret per nomor (persiapan multi-nomor, 2 Oktober 2026)
--
-- Kapso (free tier Yohan) cuma izinkan 1 nomor WA aktif -- user non-admin
-- TIDAK bisa daftarkan nomor sendiri langsung (butuh setup manual admin di
-- Kapso + kemungkinan upgrade plan dulu). Pola sama persis seperti
-- auth_ext.google_contacts_access_requests (048): user ajukan, admin dapat
-- notifikasi + email, admin selesaikan setup manual di pihak ketiga, lalu
-- tandai approved di app (di sini sekalian isi phone_number_id asli dari
-- Kapso begitu sudah didaftarkan di sana).
--
-- webhook_secret ditambahkan ke chat.whatsapp_numbers karena Kapso
-- auto-generate secret BERBEDA tiap webhook/nomor (dikonfirmasi Yohan) --
-- verifySignature() di webhook/route.ts perlu tahu secret per nomor,
-- bukan cuma 1 env var global lagi begitu ada nomor kedua.
-- ============================================================================

BEGIN;

ALTER TABLE chat.whatsapp_numbers ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

CREATE TABLE IF NOT EXISTS chat.whatsapp_number_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved')),

    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS whatsapp_number_requests_pending_idx
ON chat.whatsapp_number_requests (requested_at DESC)
WHERE status = 'pending';

ALTER TABLE chat.whatsapp_number_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own whatsapp number request" ON chat.whatsapp_number_requests;
DROP POLICY IF EXISTS "admin can read all whatsapp number requests" ON chat.whatsapp_number_requests;
DROP POLICY IF EXISTS "users can insert own whatsapp number request" ON chat.whatsapp_number_requests;
DROP POLICY IF EXISTS "admin can update any whatsapp number request" ON chat.whatsapp_number_requests;

CREATE POLICY "users can read own whatsapp number request"
ON chat.whatsapp_number_requests
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "admin can read all whatsapp number requests"
ON chat.whatsapp_number_requests
FOR SELECT TO authenticated
USING (core.is_admin_or_above());

CREATE POLICY "users can insert own whatsapp number request"
ON chat.whatsapp_number_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "admin can update any whatsapp number request"
ON chat.whatsapp_number_requests
FOR UPDATE TO authenticated
USING (core.is_admin_or_above())
WITH CHECK (core.is_admin_or_above());

GRANT SELECT, INSERT, UPDATE ON chat.whatsapp_number_requests TO authenticated;
GRANT SELECT, UPDATE ON chat.whatsapp_number_requests TO service_role;

COMMENT ON TABLE chat.whatsapp_number_requests IS
'Pengajuan nomor WhatsApp baru dari user non-admin -- admin menyelesaikan setup manual di Kapso (+ kemungkinan upgrade plan), lalu isi phone_number_id asli saat approve (lihat chat.whatsapp_numbers).';

COMMIT;
