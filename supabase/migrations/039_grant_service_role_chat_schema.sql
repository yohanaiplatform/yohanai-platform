-- ============================================================================
-- 039_grant_service_role_chat_schema.sql
-- Yohan.AI Platform — grant service_role ke schema chat
--
-- POST /api/whatsapp/webhook (dipanggil Kapso pakai service role key, lewat
-- createAdminClient()) perlu tulis ke chat.conversations/chat.messages.
-- Pola yang sama persis dengan 032 (service_role ke schema customer) --
-- service_role cuma otomatis punya USAGE di schema public, dan BYPASSRLS
-- cuma melewati evaluasi RLS policy, bukan pengganti GRANT dasar.
-- ============================================================================

BEGIN;

GRANT USAGE ON SCHEMA chat TO service_role;
GRANT SELECT, INSERT, UPDATE ON chat.conversations, chat.messages TO service_role;

COMMIT;
