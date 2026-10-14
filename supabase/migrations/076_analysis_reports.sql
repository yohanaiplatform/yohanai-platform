-- ============================================================================
-- 076_analysis_reports.sql
-- Yohan.AI Platform -- hasil Data Analysis Agent (15 Oktober 2026)
--
-- Satu baris per analisis mingguan: angka agregat (metrics, dihitung kode SQL/TypeScript) dan ringkasan
-- yang ditulis AI dari angka itu (narrative). Agen ini HANYA membaca data lain; satu-satunya tulisan
-- adalah tabel ini. Tidak berisi nomor HP / identitas pemilik -- hanya agregat. Hanya service_role
-- (halaman Master Admin membaca lewat service-role setelah cek akses di server).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ai.analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL DEFAULT 'weekly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    headline TEXT,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    emailed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (kind, period_end)
);

CREATE INDEX IF NOT EXISTS analysis_reports_created_idx ON ai.analysis_reports (created_at DESC);

ALTER TABLE ai.analysis_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON ai.analysis_reports TO service_role;

COMMENT ON TABLE ai.analysis_reports IS
'Hasil Data Analysis Agent (analisis mingguan): metrics = angka agregat dari kode, headline/findings = ringkasan AI. Hanya service_role.';

COMMIT;
