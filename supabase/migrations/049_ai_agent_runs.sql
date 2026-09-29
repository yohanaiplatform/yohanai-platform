-- ============================================================================
-- 049_ai_agent_runs.sql
-- Yohan.AI Platform -- AI Agent otomatis (29 September 2026, Task 015)
--
-- Audit log tiap kali AI Agent dipanggil untuk interpretasi balasan WA
-- masuk. Business Rule yang sudah ditulis di docs/modules/ai.mdx: "Setiap
-- hasil AI harus dapat ditelusuri kembali ke sumber datanya" -- tabel ini
-- itu jejaknya: snapshot konteks yang dikirim ke LLM, respons mentahnya,
-- dan keputusan yang diambil (ubah status funnel dan/atau auto-reply).
--
-- Cuma diakses service_role (dipanggil dari POST /api/whatsapp/webhook
-- pakai createAdminClient(), bukan sesi login) -- tidak ada UI baca
-- langsung untuk sekarang, jadi tidak perlu policy authenticated dulu.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ai.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID REFERENCES customer.leads(id),
    conversation_id UUID REFERENCES chat.conversations(id),
    trigger_message_id UUID REFERENCES chat.messages(id),

    input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    llm_raw_response JSONB,

    previous_temperature TEXT,
    decided_temperature TEXT,

    reply_text TEXT,
    reply_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reply_message_id UUID REFERENCES chat.messages(id),

    confidence TEXT,
    status TEXT NOT NULL DEFAULT 'success'
        CHECK (status IN ('success', 'skipped', 'error')),
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_runs_lead_id_idx ON ai.agent_runs (lead_id, created_at DESC);

ALTER TABLE ai.agent_runs ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA ai TO service_role;
GRANT SELECT, INSERT ON ai.agent_runs TO service_role;

COMMIT;
