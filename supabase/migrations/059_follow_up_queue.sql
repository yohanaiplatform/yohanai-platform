-- ============================================================================
-- 059_follow_up_queue.sql
-- Yohan.AI Platform -- antrian follow-up AI Agent (debounce notifikasi),
-- + kolom nomor WA notifikasi personal per user (2 Oktober 2026)
--
-- Sebelumnya tiap kali AI Agent set needsFollowUp:true, 1 notifikasi
-- langsung dibuat (createNotification() di applyAgentDecision.ts) --
-- percakapan panjang yang berkali-kali mentok bisa bikin bubble notifikasi
-- menumpuk (ditemukan Yohan: >10 notifikasi terpisah untuk 1 lead dalam
-- <1 jam). Sekarang follow-up note DITAMPUNG dulu di tabel ini, lalu
-- di-flush jadi SATU notifikasi gabungan (format markdown ringan) oleh
-- job terjadwal setelah percakapan sepi >=5 menit -- lihat
-- POST /api/ai/flush-follow-ups + .github/workflows/flush-follow-ups.yml.
--
-- notification_whatsapp_number di auth_ext.profiles SENGAJA terpisah dari
-- nomor WA bisnis (chat.whatsapp_numbers, dipakai AI Agent balas lead) --
-- user yang pakai AI Agent otomatisasi WAJIB pakai nomor HP pribadi yang
-- BEDA untuk terima notifikasi follow-up, supaya tidak campur dengan
-- percakapan customer di nomor bisnisnya.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ai.follow_up_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES customer.leads(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES chat.conversations(id) ON DELETE SET NULL,

    note TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    flushed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS follow_up_queue_pending_idx
ON ai.follow_up_queue (lead_id)
WHERE flushed_at IS NULL;

ALTER TABLE ai.follow_up_queue ENABLE ROW LEVEL SECURITY;

-- Tidak ada UI yang baca langsung (sama seperti ai.agent_runs) -- cuma
-- service_role (webhook tulis, cron job baca+flush).
GRANT SELECT, INSERT, UPDATE ON ai.follow_up_queue TO service_role;

ALTER TABLE auth_ext.profiles ADD COLUMN IF NOT EXISTS notification_whatsapp_number TEXT;

COMMENT ON TABLE ai.follow_up_queue IS
'Antrian follow-up AI Agent -- ditampung dulu, di-flush jadi 1 notifikasi gabungan setelah percakapan sepi >=5 menit (debounce, hindari spam notifikasi per-pesan).';

COMMENT ON COLUMN auth_ext.profiles.notification_whatsapp_number IS
'Nomor WA pribadi user untuk terima notifikasi follow-up AI Agent -- SENGAJA terpisah dari nomor WA bisnis (chat.whatsapp_numbers) yang dipakai AI Agent balas lead.';

COMMIT;
