-- ============================================================================
-- 060_nurture_sends.sql
-- Yohan.AI Platform -- log pengiriman template nurturing otomatis (4 Oktober 2026)
--
-- Satu baris per percobaan kirim template follow-up otomatis ke lead yang diam
-- (lihat src/lib/nurture/runNurture.ts + /api/cron/hourly). Dipakai untuk:
-- (1) menghitung step ke berapa lead ini (maks 2), (2) menjaga jeda antar kirim,
-- (3) audit. Hanya service_role (cron) yang menulis/membaca -- sama seperti
-- ai.agent_runs / ai.follow_up_queue.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ai.nurture_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES customer.leads(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES chat.conversations(id) ON DELETE SET NULL,

    step INTEGER NOT NULL,
    template_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    wa_message_id TEXT,
    error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nurture_sends_lead_idx
ON ai.nurture_sends (lead_id, created_at DESC);

ALTER TABLE ai.nurture_sends ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON ai.nurture_sends TO service_role;

COMMENT ON TABLE ai.nurture_sends IS
'Log pengiriman template nurturing otomatis ke lead yang diam (step 1 = 48 jam, step 2 = 5 hari setelahnya, maks 2). Hanya service_role.';

COMMIT;
