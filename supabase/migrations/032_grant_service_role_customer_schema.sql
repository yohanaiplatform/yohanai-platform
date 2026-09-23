-- ============================================================================
-- 032_grant_service_role_customer_schema.sql
-- Yohan.AI Platform — beri service_role akses ke schema customer
--
-- Ketemu saat verifikasi runtime endpoint POST /api/leads/intake:
-- "permission denied for schema customer". service_role ternyata TIDAK
-- pernah diberi USAGE ke schema domain manapun (customer, core, chat,
-- property, auth_ext) -- cuma `public` yang otomatis dapat.
--
-- Pola yang sama dengan pelajaran 027 (RLS dan GRANT itu dua lapisan
-- berbeda), kali ini menimpa service_role, bukan authenticated/anon.
-- service_role punya atribut BYPASSRLS di Postgres, tapi itu cuma
-- membuatnya lolos dari evaluasi RLS policy -- tanpa GRANT dasar
-- (USAGE + hak tabel), query tetap ditolak sebelum RLS sempat relevan.
--
-- Scope migration ini SENGAJA dipersempit ke schema customer saja --
-- yang dipakai endpoint ini -- bukan ke lima schema domain sekaligus.
-- core/chat/property/auth_ext punya celah yang sama untuk service_role,
-- tapi belum ada endpoint yang butuh itu hari ini; dibereskan nanti saat
-- endpoint pertama yang butuh ditulis, sekalian diverifikasi runtime-nya
-- seperti migration ini.
-- ============================================================================

BEGIN;

GRANT USAGE ON SCHEMA customer TO service_role;
GRANT SELECT, INSERT, UPDATE ON customer.leads, customer.lead_sources TO service_role;

COMMIT;
