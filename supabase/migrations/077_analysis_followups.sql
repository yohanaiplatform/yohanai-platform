-- ============================================================================
-- 077_analysis_followups.sql
-- Yohan.AI Platform -- daftar lead tindak lanjut di analisis mingguan (15 Oktober 2026)
--
-- ai.analysis_reports.followups: daftar lead (nama, Temperature, kapan terakhir ada pesan) yang layak ditindaklanjuti.
-- Memuat NAMA lead, jadi dipisah dari kolom metrics (metrics dikirim ke LLM; followups TIDAK PERNAH). Tetap hanya
-- service_role (tabel yang sama); Master Admin membaca lewat service-role setelah cek akses di server.
-- ============================================================================

BEGIN;

ALTER TABLE ai.analysis_reports ADD COLUMN IF NOT EXISTS followups JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN ai.analysis_reports.followups IS
'Daftar lead tindak lanjut (waiting/stalled/objection + totals). Memuat nama lead: jangan dikirim ke LLM.';

COMMIT;
