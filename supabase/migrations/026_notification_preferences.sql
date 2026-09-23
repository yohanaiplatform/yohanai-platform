-- ============================================================================
-- 026_notification_preferences.sql
-- Yohan.AI Platform — Preferensi notifikasi (Sprint 011)
--
-- REKONSTRUKSI dari struktur database production, 23 September 2026.
-- Lihat catatan di 022_business_roles.sql.
--
-- Sengaja TIDAK table-driven seperti profile_completeness_rules: kategori
-- notifikasi bersifat tetap dan tidak berubah per role, jadi kolom boolean
-- datar lebih sederhana dan lebih murah dibaca.
--
-- Kategori "Keamanan Akun" sengaja TIDAK punya kolom di sini — notifikasi
-- keamanan selalu aktif dan tidak boleh bisa dimatikan user.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS auth_ext.notification_preferences (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Lead baru masuk
    new_lead_email  BOOLEAN NOT NULL DEFAULT TRUE,
    new_lead_inapp  BOOLEAN NOT NULL DEFAULT TRUE,

    -- Pesan / chat
    message_email   BOOLEAN NOT NULL DEFAULT TRUE,
    message_inapp   BOOLEAN NOT NULL DEFAULT TRUE,

    -- Update properti
    property_update_email BOOLEAN NOT NULL DEFAULT TRUE,
    property_update_inapp BOOLEAN NOT NULL DEFAULT TRUE,

    -- Marketing / promo — email saja, tidak ada varian in-app
    marketing_email BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auth_ext.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS + GRANT
--
-- INSERT diperlukan karena form memakai upsert dengan onConflict user_id —
-- baris dibuat saat user pertama kali menyimpan, bukan saat registrasi.
-- ============================================================================

DROP POLICY IF EXISTS "users can read own notification preferences"   ON auth_ext.notification_preferences;
DROP POLICY IF EXISTS "users can insert own notification preferences" ON auth_ext.notification_preferences;
DROP POLICY IF EXISTS "users can update own notification preferences" ON auth_ext.notification_preferences;

CREATE POLICY "users can read own notification preferences"
ON auth_ext.notification_preferences
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users can insert own notification preferences"
ON auth_ext.notification_preferences
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own notification preferences"
ON auth_ext.notification_preferences
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON auth_ext.notification_preferences TO authenticated;

COMMIT;
