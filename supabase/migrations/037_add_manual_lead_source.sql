-- ============================================================================
-- 037_add_manual_lead_source.sql
-- Yohan.AI Platform -- sumber lead baru untuk input manual dari dashboard
--
-- Sampai sekarang satu-satunya jalur masuk lead adalah Google Form (Fase 1).
-- Yohan minta ada jalur tambahan: form "Tambah Lead" manual di dashboard
-- (untuk lead dari telepon langsung/walk-in di luar Google Form), plus
-- nanti agent AI dari WhatsApp (belum dibangun, menunggu keputusan
-- WAHA vs Fonnte). Baris ini supaya lead manual bisa dibedakan sumbernya
-- dari yang masuk lewat Google Form -- pola sama seperti 031 menambah
-- baris "Google Form".
-- ============================================================================

BEGIN;

INSERT INTO customer.lead_sources (name, description)
VALUES ('Input Manual', 'Lead diinput langsung oleh admin/agent dari dashboard, bukan dari Google Form')
ON CONFLICT (name) DO NOTHING;

COMMIT;
