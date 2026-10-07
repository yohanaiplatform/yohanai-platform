-- ============================================================================
-- 068_llm_usage.sql
-- Yohan.AI Platform -- log pemakaian token Claude di luar AI Agent chat (5 Oktober 2026)
--
-- AI Agent chat sudah mencatat usage di ai.agent_runs.llm_raw_response. Pemanggilan
-- Claude lain (mis. Celah Pengetahuan harian) tidak punya tempat catat, padahal ikut
-- masuk tagihan. Satu baris per panggilan; dibaca laporan pemakaian AI di Platform
-- Report. Hanya service_role.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ai.llm_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature TEXT NOT NULL,
    model TEXT,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS llm_usage_created_idx ON ai.llm_usage (created_at DESC);

ALTER TABLE ai.llm_usage ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON ai.llm_usage TO service_role;

COMMENT ON TABLE ai.llm_usage IS
'Pemakaian token Claude di luar AI Agent chat (feature = nama fitur, mis. knowledge_gaps). Hanya service_role.';

COMMIT;
