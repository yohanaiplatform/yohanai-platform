-- ============================================================================
-- 048_notifications_and_access_requests.sql
-- Yohan.AI Platform -- Notifikasi in-app + permintaan akses Google Contacts
-- (29 September 2026)
--
-- Google OAuth consent screen masih mode "Testing" -- user baru HARUS
-- ditambahkan manual sebagai test user oleh admin di Google Cloud Console
-- sebelum bisa Sambungkan Google Contacts (batasan Google, bukan sesuatu
-- yang bisa diotomasi dari sisi aplikasi kita). Tabel
-- google_contacts_access_requests jadi jalur "ajukan akses" di app: user
-- yang gagal connect bisa minta, admin dapat notifikasi, admin tandai
-- approved setelah menambahkan manual di Google Console.
--
-- core.notifications adalah tabel notifikasi in-app generik pertama di
-- project ini -- NotificationMenu.tsx sebelumnya cuma dummy/hardcode.
-- INSERT sengaja TIDAK di-grant ke authenticated: menulis notifikasi
-- untuk USER LAIN (mis. user biasa -> semua admin) harus lewat
-- service-role client di route handler, bukan langsung dari sesi user.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- core.notifications
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS core.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipient_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
    ON core.notifications (recipient_id, created_at DESC)
    WHERE read_at IS NULL;

ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own notifications"   ON core.notifications;
DROP POLICY IF EXISTS "users can update own notifications" ON core.notifications;

CREATE POLICY "users can read own notifications"
ON core.notifications
FOR SELECT TO authenticated
USING (auth.uid() = recipient_id);

CREATE POLICY "users can update own notifications"
ON core.notifications
FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

GRANT SELECT, UPDATE ON core.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON core.notifications TO service_role;

-- ---------------------------------------------------------------------------
-- auth_ext.google_contacts_access_requests
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auth_ext.google_contacts_access_requests (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved')),

    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE auth_ext.google_contacts_access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own access request"      ON auth_ext.google_contacts_access_requests;
DROP POLICY IF EXISTS "admin can read all access requests"     ON auth_ext.google_contacts_access_requests;
DROP POLICY IF EXISTS "users can insert own access request"    ON auth_ext.google_contacts_access_requests;
DROP POLICY IF EXISTS "admin can update any access request"    ON auth_ext.google_contacts_access_requests;

CREATE POLICY "users can read own access request"
ON auth_ext.google_contacts_access_requests
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "admin can read all access requests"
ON auth_ext.google_contacts_access_requests
FOR SELECT TO authenticated
USING (core.is_admin_or_above());

CREATE POLICY "users can insert own access request"
ON auth_ext.google_contacts_access_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "admin can update any access request"
ON auth_ext.google_contacts_access_requests
FOR UPDATE TO authenticated
USING (core.is_admin_or_above())
WITH CHECK (core.is_admin_or_above());

GRANT SELECT, INSERT, UPDATE ON auth_ext.google_contacts_access_requests TO authenticated;
GRANT SELECT ON auth_ext.google_contacts_access_requests TO service_role;

COMMIT;
