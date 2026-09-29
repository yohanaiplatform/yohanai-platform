-- ============================================================================
-- 047_google_contacts_per_user.sql
-- Yohan.AI Platform -- Google Contacts per user (29 September 2026)
--
-- Desain awal (semalam) pakai satu refresh token global (akun
-- yohan.ai.platform@gmail.com) buat semua lead. Yohan minta diubah: tiap
-- user sambungkan akun Google PRIBADI mereka sendiri, supaya lead yang
-- mereka input masuk ke Contacts & HP mereka masing-masing -- bukan satu
-- akun terpusat. Tabel ini simpan refresh token per user_id.
--
-- RLS: user cuma boleh baca/tulis baris miliknya sendiri (pola sama
-- seperti notification_preferences, 026). Tidak ada akses service_role di
-- sini -- sync kontak jalan lewat sesi login user yang bikin lead
-- (POST /api/leads/[id]/sync-contact), bukan cron/machine.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS auth_ext.google_contacts_connections (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    refresh_token TEXT NOT NULL,
    google_email TEXT,

    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auth_ext.google_contacts_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own google contacts connection"   ON auth_ext.google_contacts_connections;
DROP POLICY IF EXISTS "users can insert own google contacts connection" ON auth_ext.google_contacts_connections;
DROP POLICY IF EXISTS "users can update own google contacts connection" ON auth_ext.google_contacts_connections;
DROP POLICY IF EXISTS "users can delete own google contacts connection" ON auth_ext.google_contacts_connections;

CREATE POLICY "users can read own google contacts connection"
ON auth_ext.google_contacts_connections
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users can insert own google contacts connection"
ON auth_ext.google_contacts_connections
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own google contacts connection"
ON auth_ext.google_contacts_connections
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own google contacts connection"
ON auth_ext.google_contacts_connections
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON auth_ext.google_contacts_connections TO authenticated;

COMMIT;
