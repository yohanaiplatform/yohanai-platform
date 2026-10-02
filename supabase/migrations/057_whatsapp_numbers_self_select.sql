-- ============================================================================
-- 057_whatsapp_numbers_self_select.sql
-- Yohan.AI Platform -- perbaiki RLS chat.whatsapp_numbers (056)
--
-- Policy awal (056) admin-only untuk SEMUA operasi termasuk SELECT -- luput
-- memikirkan bahwa getPhoneNumberIdForUser() dipanggil dari sesi agent biasa
-- sendiri (POST /api/whatsapp/send, fallback nomor pengirim saat lead belum
-- pernah punya percakapan). Non-admin (semua agent kecuali admin@yohanai.id)
-- akan ditolak RLS baca baris MILIKNYA SENDIRI pun -- balasan pertama ke
-- lead baru jadi gagal kirim.
--
-- Perbaikan: SELECT boleh admin (lihat semua) ATAU user lihat baris
-- miliknya sendiri (assigned_to = auth.uid()). INSERT/UPDATE/DELETE tetap
-- admin-only (ini konfigurasi routing, dikelola dari 1 tempat terpusat).
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS whatsapp_numbers_admin_only ON chat.whatsapp_numbers;

CREATE POLICY whatsapp_numbers_select ON chat.whatsapp_numbers
FOR SELECT
TO authenticated
USING (core.is_admin_or_above() OR assigned_to = auth.uid());

CREATE POLICY whatsapp_numbers_admin_insert ON chat.whatsapp_numbers
FOR INSERT
TO authenticated
WITH CHECK (core.is_admin_or_above());

CREATE POLICY whatsapp_numbers_admin_update ON chat.whatsapp_numbers
FOR UPDATE
TO authenticated
USING (core.is_admin_or_above())
WITH CHECK (core.is_admin_or_above());

CREATE POLICY whatsapp_numbers_admin_delete ON chat.whatsapp_numbers
FOR DELETE
TO authenticated
USING (core.is_admin_or_above());

COMMIT;
