-- ============================================================================
-- 031_add_google_form_lead_source.sql
-- Yohan.AI Platform — tambah 'Google Form' ke customer.lead_sources
--
-- Bagian dari Fase 1 Lead Intake (docs/modules/crm.mdx). Endpoint
-- POST /api/leads/intake butuh baris ini untuk mengisi lead_source_id pada
-- lead yang masuk dari Apps Script legacy.
-- ============================================================================

BEGIN;

INSERT INTO customer.lead_sources (name, description)
VALUES (
  'Google Form',
  'Lead dari Google Form legacy (Database Konsumen Property), disalurkan lewat Apps Script ke /api/leads/intake'
)
ON CONFLICT (name) DO NOTHING;

COMMIT;
