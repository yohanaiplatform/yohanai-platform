-- ============================================================================
-- 061_knowledge_gaps.sql
-- Yohan.AI Platform -- Knowledge Loop: celah pengetahuan AI Agent (4 Oktober 2026)
--
-- Topik yang sering membuat AI mentok (dikelompokkan harian dari
-- ai.follow_up_queue oleh src/lib/knowledge/generateGaps.ts). Agen MENJAWAB
-- topik itu dari Settings, lalu jawabannya jadi entri knowledge.entries lewat
-- POST /api/knowledge/gaps/resolve. AI tidak pernah menulis pengetahuan sendiri
-- tanpa jawaban manusia.
--
-- Juga: GRANT INSERT/UPDATE knowledge.entries ke service_role (sebelumnya cuma
-- SELECT -- belum ada kode server yang menulis entri).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS knowledge.gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    sample_questions TEXT[] NOT NULL DEFAULT '{}',
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    suggested_keywords TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'dismissed')),
    answer TEXT,
    entry_id UUID REFERENCES knowledge.entries(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS gaps_status_idx ON knowledge.gaps (status, occurrence_count DESC);

ALTER TABLE knowledge.gaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gaps_authenticated_read ON knowledge.gaps;
CREATE POLICY gaps_authenticated_read ON knowledge.gaps
FOR SELECT TO authenticated
USING (core.is_authenticated());

GRANT SELECT ON knowledge.gaps TO authenticated;
GRANT SELECT, INSERT, UPDATE ON knowledge.gaps TO service_role;
GRANT INSERT, UPDATE ON knowledge.entries TO service_role;

COMMENT ON TABLE knowledge.gaps IS
'Celah pengetahuan AI Agent (topik yang sering membuat AI mentok), dibuat harian dari ai.follow_up_queue; agen menjawab lalu jawaban jadi entri knowledge.entries (Knowledge Loop).';

COMMIT;
