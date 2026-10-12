-- ============================================================================
-- 071_ai_credit_balance.sql
-- Yohan.AI Platform -- catatan manual saldo kredit Claude Console (12 Oktober 2026)
--
-- Saldo kredit Console tidak bisa dibaca lewat API tanpa Admin key (butuh akun organisasi), jadi admin mencatat
-- saldo terakhir secara manual (Settings). Platform Report menaksir sisa saldo = saldo tercatat - pemakaian AI
-- sejak waktu pencatatan, lalu memperingatkan bila diperkirakan habis dalam <= 7 hari. Hanya service_role.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ai.credit_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance_usd NUMERIC(10, 2) NOT NULL CHECK (balance_usd >= 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS credit_balance_recorded_idx ON ai.credit_balance (recorded_at DESC);

ALTER TABLE ai.credit_balance ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON ai.credit_balance TO service_role;

COMMENT ON TABLE ai.credit_balance IS
'Catatan manual saldo kredit Claude Console (USD) -- dasar pengingat saldo di Platform Report. Hanya service_role.';

-- Saldo awal dari screenshot Console 12 Oktober 2026 ~09.30 WIB (US$3,63, auto-reload mati).
INSERT INTO ai.credit_balance (balance_usd, recorded_at) VALUES (3.63, '2026-10-12 02:30:00+00');

COMMIT;
