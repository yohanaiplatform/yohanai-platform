-- ============================================================================
-- 054_notes_service_role_grant.sql
-- Yohan.AI Platform -- GRANT service_role ke customer.notes
--
-- AI Agent (src/lib/ai/applyAgentDecision.ts, jalan lewat service_role key)
-- mulai menulis "ringkasan percakapan" otomatis ke customer.notes (rolling
-- summary per lead, 1 Oktober 2026 malam) -- butuh SELECT (baca ringkasan
-- lama sebagai konteks), INSERT (tulis ringkasan baru), dan UPDATE
-- (soft-delete ringkasan lama lewat deleted_at, bukan hapus beneran).
--
-- Pola yang sama berulang lagi seperti catatan di AGENTS.md: GRANT ke
-- service_role TIDAK otomatis ada walau RLS/policy-nya sudah benar, dan
-- USAGE di schema customer sudah ada dari migration 032 -- tapi tabel baru
-- (atau tabel lama yang baru pertama kali disentuh service_role) tetap
-- butuh GRANT eksplisit per tabel. customer.notes sebelumnya cuma di-GRANT
-- ke `authenticated` (038) karena cuma dipakai dari client browser.
-- ============================================================================

BEGIN;

GRANT SELECT, INSERT, UPDATE ON customer.notes TO service_role;

COMMIT;
