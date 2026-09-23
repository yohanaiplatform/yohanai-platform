-- ============================================================================
-- 034_grant_authenticated_chat_schema.sql
-- Yohan.AI Platform — grant authenticated ke schema chat
--
-- Ketemu saat investigasi widget "Recent Chats" di dashboard yang selalu
-- menampilkan "Error: Unable to load conversations." Policy RLS
-- `authenticated_all` sudah ada dan benar di chat.conversations dan
-- chat.messages, tapi role `authenticated` tidak pernah diberi GRANT
-- SELECT/INSERT/UPDATE dasarnya -- pola yang sama persis dengan 027
-- (customer schema) dan 032 (service_role ke customer schema), kali ini
-- authenticated ke chat schema.
--
-- Setelah ini, Recent Chats akan tampil "No Chats" (state normal untuk
-- 0 baris), bukan Error -- integrasi WhatsApp/WAHA sungguhan masih
-- pekerjaan terpisah, ini cuma membuka akses baca/tulisnya.
-- ============================================================================

BEGIN;

GRANT SELECT, INSERT, UPDATE ON chat.conversations, chat.messages TO authenticated;

COMMIT;
