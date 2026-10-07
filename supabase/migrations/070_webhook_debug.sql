-- 070: log diagnostik SEMENTARA event webhook WhatsApp (7 Oktober 2026).
-- Dipakai untuk melihat apa yang dikirim Kapso saat pesan diketik manusia dari WhatsApp Web/HP (echo).
-- Hanya metadata ringkas (event, tipe, arah, origin, hasil pencocokan lead) -- TANPA isi pesan atau nomor.
-- HAPUS tabel ini + kode pencatatnya setelah masalah echo selesai.
CREATE TABLE IF NOT EXISTS chat.webhook_debug (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event TEXT,
    info JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS webhook_debug_created_idx ON chat.webhook_debug (created_at DESC);
ALTER TABLE chat.webhook_debug ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON chat.webhook_debug TO service_role;
COMMENT ON TABLE chat.webhook_debug IS 'SEMENTARA: diagnostik event webhook WhatsApp (tanpa isi pesan). Hapus setelah masalah echo selesai.';
