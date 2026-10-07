-- ============================================================================
-- 069_nurture_settings.sql
-- Yohan.AI Platform -- aturan nurturing otomatis per akun (7 Oktober 2026)
--
-- Satu baris per user (agen pemilik lead). Tanpa baris = pakai default yang sama
-- dengan perilaku sebelumnya (48 jam, jeda 5 hari, maks 2, 08-20 WIB), jadi tidak
-- ada yang berubah sampai user menyimpan aturannya. Dibaca cron (service_role);
-- dibaca/ditulis user lewat /api/nurture/settings (sesi login + service_role),
-- bukan langsung dari browser -- schema ai tidak dibuka untuk role authenticated.
-- Saklar utama env NURTURE_ENABLED tetap berlaku di atas semua akun.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ai.nurture_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    silence_hours INTEGER NOT NULL DEFAULT 48 CHECK (silence_hours BETWEEN 24 AND 168),
    step_gap_days INTEGER NOT NULL DEFAULT 5 CHECK (step_gap_days BETWEEN 2 AND 14),
    max_steps INTEGER NOT NULL DEFAULT 2 CHECK (max_steps BETWEEN 1 AND 3),
    send_hour_start INTEGER NOT NULL DEFAULT 8 CHECK (send_hour_start BETWEEN 6 AND 21),
    send_hour_end INTEGER NOT NULL DEFAULT 20 CHECK (send_hour_end BETWEEN 7 AND 22),
    allowed_temperatures TEXT[] NOT NULL DEFAULT ARRAY['Belum ada', 'Cold', 'Warm'],
    default_template TEXT NOT NULL DEFAULT 'yohan_griya',
    template_rules JSONB NOT NULL DEFAULT '[{"keyword":"kapur mas","template":"follow_up_kapur_mas_t2"}]'::jsonb,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (send_hour_end > send_hour_start)
);

ALTER TABLE ai.nurture_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON ai.nurture_settings TO service_role;

COMMENT ON TABLE ai.nurture_settings IS
'Aturan nurturing otomatis per akun agen. Tanpa baris = default. Hanya service_role; user mengubah lewat /api/nurture/settings.';

COMMIT;
