-- ============================================================================
-- FILE: project-docs/sql/019_storage.sql
-- Yohan.AI Platform
-- Supabase Storage Buckets
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets
(id, name, public)
VALUES
('avatars',      'avatars',      true),
('properties',   'properties',   true),
('customers',    'customers',    false),
('documents',    'documents',    false),
('chat-media',   'chat-media',   false),
('knowledge',    'knowledge',    false),
('marketing',    'marketing',    false),
('temp',         'temp',         false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated Read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

CREATE POLICY "Authenticated Read"
ON storage.objects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated Insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated Update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated Delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

COMMIT;