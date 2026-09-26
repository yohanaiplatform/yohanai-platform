-- ============================================================================
-- 040_enable_realtime_chat.sql
-- Yohan.AI Platform — aktifkan Supabase Realtime untuk schema chat
--
-- Dipakai fitur live chat (Lead Detail "Percakapan WhatsApp" + Recent Chats
-- interaktif di dashboard) -- keduanya subscribe INSERT baru di
-- chat.messages lewat postgres_changes, dan chat.conversations dipakai
-- untuk tahu kapan conversation baru dibuat (lead yang belum pernah chat).
-- Publication supabase_realtime kosong secara default di project ini,
-- tabelnya harus ditambahkan eksplisit.
-- ============================================================================

BEGIN;

ALTER PUBLICATION supabase_realtime ADD TABLE chat.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat.conversations;

COMMIT;
