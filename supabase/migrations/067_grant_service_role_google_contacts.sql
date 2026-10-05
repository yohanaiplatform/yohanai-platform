-- 067: service_role boleh membaca koneksi Google Contacts per user.
-- Dibutuhkan agar sinkron kontak otomatis (webhook WhatsApp / AI Agent, tanpa sesi login)
-- bisa memakai refresh token agen yang ditugaskan ke lead.
GRANT SELECT ON auth_ext.google_contacts_connections TO service_role;
