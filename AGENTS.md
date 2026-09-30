# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Konvensi Next 16 yang sudah menggigit project ini:** `middleware.ts` sudah di-deprecate menjadi `proxy.ts`, dan karena project memakai direktori `src/`, file-nya harus berada di `src/proxy.ts` — sejajar dengan `src/app/`. File di root project diabaikan Next **tanpa peringatan apa pun**. Runtime `proxy` adalah `nodejs` dan tidak bisa dikonfigurasi ke `edge`.

---

# Yohan.AI Platform

Property Buyer Behavior Intelligence Platform untuk industri properti Indonesia. Membantu agen properti memahami perilaku calon pembeli, mengelola lead, dan mengotomatiskan komunikasi. WhatsApp hanya salah satu channel, bukan produk utama.

Pemilik: Yohan Benyamin Betty (NIB 1709210039303). Merek "YohanAI" bernaung di bawah usaha pribadi tersebut — mismatch nama legal ini yang membuat verifikasi bisnis Meta gagal dan Facebook Login dibatalkan permanen.

## Status saat ini — BACA INI DULU

Project **ON HOLD** sejak 23 September 2026, turun ke mode pemakaian personal sebelum dilanjutkan sebagai SaaS.

Platform terkunci: semua route dibelokkan ke `/under-development`. Detail lengkap ada di `docs/status.mdx` — **dokumen itu selalu menggambarkan kondisi terkini, baca setiap awal sesi.**

Jangan menghapus komponen landing page atau form register selama hold. Keduanya sengaja dibiarkan utuh, cuma tidak terjangkau. Membuka lock = ubah env var, bukan ubah kode.

## Pekerjaan berikutnya

**Lead Intake Fase 1, CRM Foundation Fase 2, Communication Automation (sandbox), dan Property Module Fase 1 sudah SELESAI** (terakhir 26 September 2026). Jangan bangun ulang — baca dulu `docs/modules/crm.mdx`, `docs/modules/property.mdx`, dan bagian Task 008-009 di `docs/status.mdx` untuk lihat apa yang sudah ada.

**Communication Automation: Kapso yang dipilih** (bukan WAHA/Fonnte) — BSP resmi di atas WhatsApp Cloud API Meta, alasannya official (bukan WhatsApp Web tidak resmi seperti WAHA/Fonnte, jadi tidak ada risiko nomor banned) dan native terhubung ke tooling AI. Sudah jalan penuh di **sandbox** Kapso: `POST /api/whatsapp/webhook` (terima pesan, cocokkan ke lead lewat nomor HP), `POST /api/whatsapp/send` (balas dari Lead Detail), live chat lewat Supabase Realtime di Lead Detail & Recent Chats dashboard. **Nomor produksi (Griya Indonesia Real Estate) — urutan berubah 27-28 Sep 2026, dimajukan jadi ~1-2 hari** (sebelumnya ditunda sampai paling akhir): Yohan mau segera follow-up manual insight "Lead Beku"/"Follow-up Backlog" pakai nomor asli, jadi ini jalan paralel dengan diskusi AI Agent, bukan menunggunya selesai dulu.

**Cloudflare R2 (storage foto), Google Contacts (sync per user), Daily Report (personal per user), dan Platform Report (developer) juga sudah SELESAI** (29 September 2026, Task 021 di `docs/status.mdx`). Jangan bangun ulang — R2 sudah aktif penuh (272/272 foto dimigrasi), Google Contacts sudah per-user OAuth (bukan 1 akun terpusat), Daily/Platform Report sudah terkirim via cron GitHub Actions harian.

**Notifikasi in-app (`core.notifications`), fitur "Ajukan Akses" Google Contacts, dan AI Agent otomatis (Claude API) juga sudah SELESAI dibangun** (29 September 2026 malam, Task 023 di `docs/status.mdx`) — **urutan prioritas diubah Yohan malam itu**: bukan lagi sambungkan nomor WA produksi duluan, tapi AI Agent dimajukan. Jangan bangun ulang — baca Task 023 dulu. AI Agent (`src/lib/ai/`, webhook `POST /api/whatsapp/webhook`) interpretasi balasan WA masuk lewat Claude API (fetch langsung, tanpa SDK), update Temperature lead & auto-reply, audit trail di `ai.agent_runs` (migration 049, schema `ai` baru dipakai pertama kali). **Aktivasi masih butuh 2 langkah manual Yohan**: isi `ANTHROPIC_API_KEY` di Vercel, dan expose schema `ai` di Supabase Settings → Data API (pola sama seperti schema lain) — tanpa expose ini, `ai.agent_runs` tidak bisa diakses PostgREST walau GRANT-nya benar.

**Foto lama di Supabase Storage bucket `properties` sudah SELESAI dihapus** (29 September 2026 malam, 298/298 file, 0 gagal) — Yohan jalankan sendiri lewat skrip sementara (penghapusan permanen data tidak boleh dijalankan langsung oleh Claude). R2 satu-satunya storage foto listing sekarang.

**Claude Console outage sudah PULIH** (30 September 2026 pagi, cek status.claude.com) — dan **AI Agent effort sudah dioptimasi ke `"low"`** (`ANTHROPIC_EFFORT` env var, hemat estimasi 40-60% biaya per pesan dibanding default `high`, lihat Task 025 di `docs/status.mdx`) — jangan ubah balik ke default tanpa alasan.

**Alur dokumen tanda tangan lead closing SUDAH DIRISET PENUH** (29 Sep 2026 malam, read-only, Task 023/024) — spreadsheet "List Penjualan" + Apps Script "Form Otomatis" (generate BAST/Form KPR BSN/PPJB, sudah dukung multi-developer). Detail lengkap: `docs/modules/crm.mdx` bagian "Alur Dokumen Tanda Tangan (Lead Closing)". **Belum diintegrasikan ke platform** — Yohan konfirmasi simpan dulu sebagai referensi, jangan mulai bangun tanpa arahan baru.

**AI Agent sudah live-tested & 2 bug besar sudah diperbaiki** (30 September 2026 siang-malam, Task 026 di `docs/status.mdx`) — jangan bangun ulang, baca Task 026 dulu. (1) AI sempat diam total setelah 1 balasan kalau tidak ada data — diperbaiki: sekarang selalu balas (variasi kalimat) + field `needsFollowUp`/`followUpNote` kirim notifikasi in-app ke agen yang di-assign kalau AI mentok karena celah data. (2) AI tidak tahu listing yang sebenarnya available walau lead pakai istilah lokal ("Kotabaru" dst) — diperbaiki lewat `knowledge.entries` (migration 050, istilah area → nama jalan) + akses `property.listings` asli (`relevantListings.ts`) + field wajib baru **"Tag Lokasi (AI Info)"** (`metadata.ai_tags`) per listing. **AI Agent sekarang juga bisa kirim foto listing asli lewat WhatsApp** (bukan cuma link teks) — pakai `photo_urls`/`video_url` dari metadata listing, dikirim via Kapso `type: "image"`.

**Data Pemilik & Nilai Komisi 83/84 listing existing sudah SELESAI di-backfill** (30 September 2026, Task 026) — sumber: tab "Input Data" spreadsheet "Listing Baru 2024 Terbaru" (bukan "List Penjualan"), dicocokkan lewat tag `GDI/2026/<n>` di `description`. Tersimpan di `metadata.owner`/`metadata.commission`, tampil di `PropertyConfidentialFields.tsx` (khusus admin/agent yang di-assign).

**Live-test kedua AI Agent + total 6 bug ditemukan & diperbaiki** (30 September 2026 malam, Task 027 di `docs/status.mdx`) — jangan bangun ulang, baca Task 027 dulu sebelum sentuh `src/lib/ai/`. Ringkasan: AI sempat "lupa" listing yang dibahas di follow-up singkat (pencarian sekarang ikut baca riwayat chat), tag lokasi (`ai_tags`) tidak pernah sampai ke LLM + belum ada ranking pencocokan (sekarang dikirim + dibobot 2x), AI tidak baca kolom `description` listing sama sekali (detail DP/harga per blok jadi tidak terjawab — sekarang ikut dikirim, dibatasi 1500 karakter), dan AI sempat terlalu "buru-buru" menawarkan foto/video (sekarang digating kata kunci di pesan lead, sekalian hemat token). **Field "Tag Lokasi (AI Info)" direlabel "Tag / Info AI (Lokasi & Kategori)"** — sudah dikonfirmasi bisa diisi kategori (mis. "rumah subsidi"), bukan cuma istilah lokasi.

**Hapus foto & hapus listing sekarang benar-benar hapus dari Cloudflare R2** (30 September 2026 malam) — sebelumnya cuma buang referensi di `metadata.photo_urls`, file-nya tetap menumpuk selamanya. `POST /api/properties/delete-photo` (baru) dipanggil dari `PropertyPhotoManager.tsx` (hapus 1 foto) dan `PropertyMainFieldsEditable.tsx` (hapus listing → loop hapus semua fotonya) — keduanya wajib konfirmasi eksplisit dulu ("TIDAK BISA dipulihkan"). 6 foto orphan lama juga sudah dibersihkan manual lewat skrip sekali-pakai — **lihat jebakan baru di bagian bawah AGENTS.md ini soal `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID` yang gampang ketuker** kalau nanti butuh kredensial R2 buat skrip lokal lagi.

**Cloudflare "AI Crawl Control" ditemukan** (30 Sep 2026 malam) — dashboard siap pakai (`dash.cloudflare.com/.../ai/overview`, domain `yohanai.id`) yang sudah menghitung request AI crawler (OpenAI/Google/Microsoft/Anthropic/dll) per domain, gratis, tanpa kode tambahan. **Belum diintegrasikan ke Platform Report** — Yohan minta ditambahkan sesi berikutnya (Task 028 poin 1).

**Yohan pause development** — sementara update data lead & listing existing yang masih aktif secara manual dulu lewat UI, baru lanjut development lagi setelah itu. Jangan mulai kerjaan baru tanpa diminta ulang.

**Kerjaan sekarang (lihat Task 028 di `docs/status.mdx` untuk checklist lengkap):**
1. Integrasikan Cloudflare AI Crawl Control ke Platform Report — perlu API token Cloudflare baru (scope belum dicek), belum ada kode.
2. Sambungkan nomor WhatsApp produksi Griya Indonesia ke Kapso — AI Agent sudah live-tested 2x & total 6 bug besar sudah diperbaiki.
3. Verifikasi biaya AI Agent asli (`response.usage` di `ai.agent_runs.llm_raw_response`) vs estimasi simulasi Task 025.
4. Isi `ai_tags`/Deskripsi untuk 91 listing migrasi lama — field tag baru wajib untuk listing baru/diedit ulang, belum retroaktif.
5. Multi-tenant SaaS, instrumentasi tracking sisanya (visitor/download), dan item lain — lihat Task 028 lengkap.

**Multi-tenant SaaS masa depan** juga mulai dibahas (27-28 Sep) — dipetakan Model A (SaaS multi-tenant sungguhan, re-arsitektur besar) vs Model B (duplikasi instance per pelanggan, nol perubahan kode), belum dipilih. Detail: `docs/modules/crm.mdx` bagian "Multi-Tenant untuk SaaS". **Mulai 29 Sep 2026, Yohan menegaskan: semua fitur baru (bukan cuma nanti) harus dibangun dengan KESADARAN ini** — bukan berarti mulai bangun infrastruktur `tenant_id` sekarang, tapi hindari desain yang diam-diam mengasumsikan "cuma 1 bisnis di seluruh database" kalau gampang dihindari. Lihat memory `multi-tenant-forward-compat`.

Satu hal yang wajib diingat kalau nanti menyentuh Apps Script legacy Yohan lagi: **bukan sekadar penangan form**. Menurut `docs/migration/migration-blueprint.mdx` di dalamnya ada AI Processor, Decision Engine, CRM Engine, dan integrasi WAHA/n8n — 2 dari trigger AI-nya (`batchDetectConsumerIntent`, `batchExtractBudget`) sudah diketahui error rate 100%, dan API key AI-nya plaintext di kode. Pisahkan dulu mana yang memindahkan data dan mana yang mengandung logika bisnis sebelum memutuskan apa pun. **Hati-hati navigasi keyboard di editor Apps Script web** — tombol seperti "Page Down" bisa kepencet jadi teks literal di kode kalau fokus salah taruh (pernah nyaris mengubah kode production Yohan tanpa sengaja); pakai klik berbasis referensi elemen (`find` + `ref`) atau `ctrl+End`/panah biasa, bukan tombol non-standar.

---

# Stack

| Lapis | Teknologi |
|-------|-----------|
| Frontend | Next.js 16.2.10 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, shadcn/ui + Base UI |
| Backend | Supabase (PostgreSQL 17), `@supabase/ssr` |
| Auth | Supabase Auth — Google OAuth + Email/Password |
| Email | Resend (SMTP outbound), domain `send.yohanai.id` |
| Deployment | Vercel, domain `yohanai.id` |
| Dokumentasi | Mintlify, domain `docs.yohanai.id` |
| Source control | GitHub `yohanaiplatform/yohanai-platform` |

---

# Struktur penting

```
src/proxy.ts                  Gate request (Next 16 proxy, dulu middleware.ts)
src/lib/platform-lock.ts      Logika penguncian platform
src/lib/supabase/middleware.ts  updateSession() — refresh sesi + panggil gate
src/config/platform.ts        Flag lock versi client (UI saja)
src/app/(auth)/               Login, register, forgot/reset password, verify email
src/app/(dashboard)/          Dashboard, CRM, property, sales, communication, settings
supabase/migrations/          001–021 skema dasar, 022–026 Sprint 011, 027–030 perbaikan akses, 031–034 Lead Intake Fase 1 + CRM Foundation, 035 pemisahan akses lead per akun, 036 fungsi list_assignable_users, 037 sumber lead "Input Manual", 038 tabel customer.notes, 039 grant service_role ke chat, 040 enable Realtime chat, 041 fondasi Property Module (grant + seed kategori), 042 kolom slug property.listings, 043 pemisahan akses listing per agent (assigned_to + listings_owner_or_admin, pola sama seperti 035), 044 grant service_role ke schema property (pola sama seperti 032/039), 045 daily_report_email + grant service_role ke auth_ext/core, 046 fungsi core.get_platform_stats() (Platform Report), 047 tabel auth_ext.google_contacts_connections (Google Contacts per user), 048 core.notifications + auth_ext.google_contacts_access_requests (notifikasi in-app, fitur Ajukan Akses), 049 ai.agent_runs (audit trail AI Agent, schema `ai` baru dipakai pertama kali — WAJIB expose di Data API sebelum dipakai, lihat jebakan di bawah) — rentang ini bergerak terus, cek `ls supabase/migrations` untuk angka terkini. 91 listing dimigrasikan dari spreadsheet legacy (28 Sep 2026), `metadata.hidden` ditambahkan untuk fitur sembunyikan listing (tanpa migration baru, JSONB), 272 foto listing dimigrasikan dari Supabase Storage ke Cloudflare R2 (29 Sep 2026)
src/app/api/leads/intake/     POST endpoint lead intake (Fase 1, selesai)
src/app/api/whatsapp/webhook/ POST terima pesan WA masuk (Kapso sandbox, selesai 26 Sep 2026) — HMAC signature, cocokkan ke lead lewat nomor HP
src/app/api/whatsapp/send/    POST kirim balasan WA keluar dari Lead Detail (sesi login, bukan secret header)
src/lib/chat/                 findOrCreateLeadConversation() — dipakai webhook & send, satu thread per lead
src/lib/whatsapp/             sendWhatsAppText() (Kapso REST API), youtube.ts (dipakai Property, bukan WA)
src/app/(dashboard)/crm/[id]/ Lead Detail — lihat, ubah status, assign agent, Percakapan WhatsApp live (Realtime)
src/app/(dashboard)/crm/new/  Tambah Lead manual — dashboard/CRM "Add Lead" button (selesai 26 Sep 2026)
src/lib/crm/                  getLeads()/getLeadById()/createLead()/getLeadConversation() dan helper CRM Foundation
src/components/crm/           Lead List, Lead Detail, Add Lead form, status/assign select, LeadWhatsApp (chat live)
src/components/dashboard/     RecentChats interaktif (klik lead -> thread inline, live via Realtime)
src/components/shared/        WhatsAppButton, ChatMessageList (dipakai CRM + dashboard, bareng)
src/app/(dashboard)/properties/  List, Tambah, Detail, Kelola Kategori listing (Property Fase 1, selesai 26 Sep 2026)
src/lib/property/             getListings()/getListingById()/createListing()/uploadListingPhoto()/exportFlyer()/categories.ts dkk
src/components/property/      AddListingForm, ListingGrid, PropertyPhotoManager, PropertyFlyer (export JPG/PDF), CategoryManager
src/lib/i18n/                 Bi-lingual ID/EN — kamus (dictionaries.ts), baca locale dari cookie (getLocale.ts). Baru cakupan modul CRM (selesai 26 Sep 2026), modul lain masih Indonesia tetap
src/lib/storage/r2.ts         uploadToR2()/deleteFromR2() (S3Client, Cloudflare R2) — storage foto listing, pengganti Supabase Storage bucket `properties`
src/app/api/properties/upload-photo/  POST server-side upload foto ke R2 (secret R2 tidak boleh sampai ke browser)
src/lib/google/               contacts.ts (OAuth2 refresh-token flow, Google People API), syncLeadContact.ts — lead manual (/crm/new) auto-sync ke Google Contacts milik user yang connect
src/app/api/google-contacts/  authorize/callback/disconnect — alur OAuth per user, refresh token disimpan di auth_ext.google_contacts_connections
src/components/settings/      GoogleContactsConnection.tsx — UI connect/disconnect di halaman Settings
src/lib/reports/              getDailyReport.ts (personal per user, admin lihat agregat), getPlatformReport.ts (developer, kesehatan infra + biaya), sendDailyReportEmail.ts/sendPlatformReportEmail.ts (dashboard HTML), aiAgentRoadmap.ts (KPI AI Agent ilustratif)
src/app/api/reports/daily/    GET endpoint (secret header), dipanggil cron GitHub Actions .github/workflows/daily-report.yml tiap 07:00 WIB — kirim Daily Report ke tiap user + Platform Report ke admin@yohanai.id
src/lib/notifications/        createNotification()/getAdminUserIds() — notifikasi in-app (core.notifications), dipakai fitur "Ajukan Akses" Google Contacts
src/app/api/google-contacts/request-access/, approve-access/  Alur "Ajukan Akses" test user Google OAuth (Google tidak bisa diotomasi dari sisi app, cuma bisa notify admin)
src/lib/ai/                   interpretLeadReply.ts (panggil Claude API, fetch langsung tanpa SDK) + applyAgentDecision.ts (terapkan hasil: update Temperature, auto-reply WA, audit ai.agent_runs) — AI Agent otomatis (Task 015)
docs/                         Sumber halaman Mintlify (docs.yohanai.id)
project-docs/                 Arsip dokumen era pra-Claude (ChatGPT/Qwen). Historis saja
```

---

# Aturan kerja dengan Yohan

**Build, commit, dan push boleh dijalankan langsung** (diizinkan permanen 26 September 2026, sebelumnya harus selalu berupa perintah copy-paste). Tetap pecah commit per topik dengan pesan berbahasa Indonesia (lihat konvensi di bawah), dan tetap jalankan verifikasi (`tsc`/`eslint`/`build`) sebelum commit. **Install package baru (`npm install <paket>`) tetap harus berupa perintah siap-copy untuk Yohan jalankan sendiri** — menambah dependency dianggap lebih berisiko/susah dibalik daripada build/commit/push ke branch yang sudah ada.

**Kalau ada kode untuk sistem di luar repo ini yang harus ditempel manual oleh Yohan** (Apps Script legacy, dashboard pihak ketiga, dll) — selalu kasih isi file LENGKAP siap copy-paste-save, jangan potongan kode atau instruksi "ganti fungsi X dengan ini". Ditegur eksplisit 24 September 2026 setelah kasih instruksi ganti-satu-fungsi yang berujung Yohan salah paste (nyisa karakter `}` dari kode lama, jadi syntax error). Pengecualian: perbaikan 1 karakter yang lokasinya sudah jelas ditunjuk boleh dijelaskan saja tanpa tulis ulang seluruh file.

Bahasa: Indonesia.

Commit: pesan berbahasa Indonesia, `feat:` / `fix:` / `docs:` / `chore:`. Pecah per topik, jangan satu commit besar.

Setiap milestone selesai, perbarui `docs/status.mdx`. Push ke `main` otomatis men-deploy Vercel **dan** Mintlify sekaligus.

---

# Jebakan yang sudah pernah memakan waktu

**RLS dan GRANT itu dua lapisan berbeda.** Policy RLS yang benar tetap tidak berguna kalau role `authenticated` belum diberi `GRANT SELECT/UPDATE` pada tabelnya. Pernah menghabiskan satu sesi penuh di Edit Profile. Tulis `GRANT` eksplisit di migration sejak awal, bersama `DROP POLICY IF EXISTS` supaya idempotent.

**Policy `authenticated_all` (`USING true`) itu "semua yang login lihat semua data" — jangan pakai untuk tabel yang bisa dipakai lebih dari satu akun.** Baru ketahuan 23 September 2026: kedua ada akun (`admin@yohanai.id` dan rekan Yohan di Griya Indonesia yang daftar sendiri lewat Google OAuth sebelum platform lock aktif), `customer.leads` pakai `authenticated_all` sejak awal — akun kedua otomatis kebagian akses penuh ke 1968 lead tanpa direncanakan siapa pun. Diganti ke `leads_owner_or_admin` di `035`: kolom `assigned_to` + fungsi `core.is_admin_or_above()` (cek `auth_ext.profiles.role_id` ke `core.roles`, pola sama seperti `core.is_authenticated()`) — admin/super_admin lihat semua, role lain cuma lihat `assigned_to = auth.uid()`. `core.roles` (`super_admin`/`admin`/`manager`/`marketing`/`agent`/`customer_service`/`ai_service`) sudah ada dari migration awal tapi baru dipakai sekarang; `core.permissions`/`core.role_permissions` masih 0 baris, sengaja tidak disentuh dulu. **Kalau bikin tabel baru yang datanya sensitif per-user/per-agen, jangan default ke `authenticated_all` — tanya dulu apakah datanya memang boleh dilihat semua akun.** Verifikasi RLS scoped seperti ini paling akurat lewat simulasi langsung: `SET LOCAL role authenticated; SET LOCAL request.jwt.claims = '{"sub":"<uuid>"}';` lalu query — jangan cuma baca kode policy-nya.

**GRANT yang hilang bukan cuma soal `authenticated`+`customer` — polanya berulang di kombinasi role/schema lain, dan kemungkinan masih ada yang belum ketahuan.** Tiga kejadian terpisah, tiga kombinasi berbeda:

1. `authenticated` × `customer.*` — `027`.
2. `service_role` × `customer` — `service_role` cuma otomatis punya `USAGE` di schema `public`, sama sekali tidak di `customer`/`core`/`chat`/`property`/`auth_ext`. `BYPASSRLS` yang dipunya `service_role` cuma bikin lolos dari evaluasi RLS policy, bukan pengganti GRANT dasar. Ketemu 23 September 2026 saat endpoint pertama yang pakai service-role key (`POST /api/leads/intake`) ditulis, diperbaiki **cuma untuk schema `customer`** di `032` — `service_role` masih belum punya `USAGE` di `auth_ext`/`chat`/`core`/`property` sampai sekarang, karena belum ada kode yang butuh.
3. `authenticated` × `chat.conversations`/`chat.messages` — bikin widget "Recent Chats" di dashboard selalu `Error`. Diperbaiki di `034`.

Audit 23 September 2026 juga menemukan `authenticated` belum punya `SELECT` di beberapa tabel `core.*` (RBAC: `roles`, `permissions`, `role_permissions`, `settings`, `audit_logs`) dan `property.categories`/`property.listings` — **sengaja belum diperbaiki** karena belum ada kode yang menyentuhnya. **Sebelum menulis kode yang query tabel/schema baru** (terutama RBAC atau Property Module), cek dulu `has_schema_privilege(role, 'schema', 'USAGE')` dan `has_table_privilege(role, 'schema.table', 'SELECT')` — jangan asumsikan GRANT otomatis ada hanya karena RLS policy-nya ada, dan jangan asumsikan schema yang sudah beres untuk satu role otomatis beres untuk role lain.

**Perintah `GRANT` lewat Supabase MCP selalu ditahan classifier permission Claude Code**, apa pun tool-nya (`execute_sql` maupun `apply_migration`) — butuh konfirmasi eksplisit dari Yohan di chat setiap kali, tidak bisa di-allow permanen. Kadang satu `GRANT` tunggal lolos tanpa ditahan (tidak konsisten), tapi jangan andalkan itu — selalu siap untuk berhenti dan minta konfirmasi kalau kena tahan.

**Apps Script mengirim tanggal sebagai `String(dateObject)` (format `Date.prototype.toString()` V8), bukan ISO.** Contoh: `"Wed Jan 14 2026 20:56:02 GMT+0700 (Western Indonesia Time)"`. `new Date(...)` di Node.js/Vercel bisa parse ini langsung (sama-sama V8). Postgres **tidak bisa** cast langsung (`time zone "gmt+0700" not recognized`) — buang bagian `" GMT..."` lewat `regexp_replace(value, ' GMT.*$', '')`, lalu `::timestamp AT TIME ZONE 'Asia/Jakarta'` (WIB selalu UTC+7, tidak kenal DST). Dipakai di migration `033`.

**Fungsi SECURITY DEFINER tidak boleh mempercayai parameter identitas dari client.** Ambil identitas dari `auth.uid()` — nilai dari JWT yang tidak bisa dipalsukan — dan tolak parameter yang menunjuk user lain. `check_profile_completeness` dulu menerima `p_user_id` apa adanya, sehingga user yang login bisa mengintip kelengkapan profil orang lain. Diperbaiki di `030`.

**Mengunci EXECUTE fungsi perlu dua pencabutan, bukan satu.** `CREATE FUNCTION` otomatis memberi EXECUTE ke `PUBLIC`, dan Supabase menambahkan hak eksplisit ke `anon` serta `authenticated` lewat default privileges. Mencabut dari salah satunya saja menyisakan yang lain — sudah dua kali salah di project ini (`025` cabut dari PUBLIC saja, `028` cabut dari anon saja). Pola benar: `REVOKE ... FROM PUBLIC`, lalu `GRANT` eksplisit hanya ke role yang perlu, lalu verifikasi dengan `has_function_privilege()`.

**Jangan cabut EXECUTE `core.is_authenticated()`.** Fungsi ini dipanggil dari policy RLS seluruh tabel domain dan bersifat SECURITY INVOKER, jadi dievaluasi memakai hak role pemanggil. Mencabutnya melumpuhkan RLS di seluruh database sekaligus, sementara imbalannya nol — fungsi itu hanya mengembalikan boolean tentang sesi pemanggil sendiri.

**RLS aktif tanpa policy = semua akses ditolak, dan gejalanya menipu.** `public.profile_completeness_rules` pernah begini: pembacaan langsung dari client mengembalikan nol baris sehingga daftar field wajib diam-diam kosong, sementara progress bar tetap tampak benar karena dihitung RPC `SECURITY DEFINER` yang menembus RLS. Fitur tampak hidup padahal separuhnya mati. Sudah diperbaiki di `025`, tapi polanya patut diwaspadai di tempat lain.

**Isi database tidak sama dengan isi repo — jangan menyimpulkan dari file migration saja.** Policy RLS untuk seluruh schema domain ternyata ada di database padahal tidak ada di `017_rls.sql`. Audit 23 September 2026 sudah menutup celah ini (migration kini `001`–`038`, terverifikasi sinkron — rentang ini bergerak terus tiap sesi, cek `ls supabase/migrations` untuk angka terkini alih-alih percaya angka yang tertulis di sini), tapi kebiasaannya tetap berlaku: verifikasi langsung lewat connector Supabase sebelum menyimpulkan.

**Pola yang sama juga kena `src/types/database.ts`, dan berulang 2x.** Migration `035` menambah kolom `customer.leads.assigned_to` tapi tipe TypeScript-nya tidak pernah di-regenerate — ketemu 24 September saat mulai kerja Lead Detail. Lalu ketemu lagi 25 September: fungsi `is_authenticated()`/`is_admin_or_above()` (dari `034`/`035`) ternyata juga tidak pernah masuk tipe sejak awal dibuat, baru ketahuan pas `list_assignable_users()` (`036`) butuh dipanggil dari client via `.rpc()` dan perlu tipe yang benar. **Tool `generate_typescript_types` lewat Supabase MCP cuma balikin schema `public`** — tidak berguna buat project ini yang schema utamanya (`core`/`customer`/`auth_ext`/dst) semua di luar `public`. Cara yang benar: cek kolom/fungsi asli lewat `information_schema.columns` atau `pg_proc`, lalu tambal manual di `database.ts` mengikuti pola yang sudah ada di file itu — bukan percaya isi file types mencerminkan migration terbaru.

**`created_by` nyaris tidak pernah diisi di seluruh aplikasi.** Ketemu 26 September 2026 saat bikin `customer.notes`: kolom `created_by` (ada di hampir semua tabel, `REFERENCES auth.users(id)`, tapi TANPA default) ternyata tidak pernah di-set eksplisit oleh kode manapun di `src/` — `grep created_by src/` nol hasil di kode aplikasi, cuma muncul di tipe TypeScript. Diperbaiki cuma di `createLead.ts` dan insert notes baru (yang ditulis sesi itu); tabel/insert lain kemungkinan masih kosong dan belum diaudit menyeluruh. **Kalau insert ke tabel yang punya kolom `created_by`, selalu isi eksplisit dari `(await supabase.auth.getUser()).data.user?.id`** — jangan asumsikan ada trigger/default yang mengisinya.

**Schema harus di-expose di Data API.** Supabase hanya mengekspos `public` + `graphql_public` secara default. Schema `auth_ext`, `core`, `customer`, `chat`, `property` sudah ditambahkan manual di Settings → Data API. **Schema `ai` (dipakai pertama kali migration `049`, tabel `ai.agent_runs`) BELUM ditambahkan per 29 September 2026 malam** — GRANT sudah benar tapi kalau expose-nya belum dilakukan, `service_role` client tetap akan gagal akses lewat PostgREST (bukan soal GRANT lagi, tapi schema-nya sendiri tidak "kelihatan" oleh Data API). Cek dulu status expose-nya sebelum menyimpulkan AI Agent rusak gara-gara kode.

**Windows Controlled Folder Access.** Project ada di `C:\Users\User\Documents`, folder yang dilindungi Defender Ransomware Protection. Pernah memblokir `node.exe` dan `git.exe` sehingga build gagal dengan error menyesatkan (`os error 2`, "lockfile") dan commit gagal diam-diam. Kalau muncul error tulis-file aneh atau file 0 byte, cek event log Defender ID 1123 sebelum menyalahkan Next.js.

**Kredensial git repo ini di-set `--local`.** Git Credential Manager menyimpan akun `flobamoraptk` yang tidak punya akses tulis; repo ini diarahkan memakai token `gh` (akun `yohanaiplatform`) lewat config lokal. Clone baru akan kena 403 dan perlu di-set ulang.

**ESLint punya 8 error pre-existing** di `useDashboard.ts`, `EditProfileForm.tsx`, `WilayahSelector.tsx`, dan beberapa file lain (mayoritas `react-hooks/set-state-in-effect`). Bukan dari perubahan baru — jangan panik, tapi jangan tambah yang baru.

**Komponen `Select` (Base UI, `src/components/ui/select.tsx`) tidak otomatis menampilkan label kalau `value` item beda dari teks tampilannya.** Ketemu di dropdown "Ditugaskan ke" (`AddLeadForm.tsx`) — value-nya UUID user, tapi yang seharusnya tampil nama. Tanpa penanganan khusus, `SelectValue` fallback menampilkan UUID mentah. Solusinya: hitung label yang sesuai dari value yang dipilih, lalu taruh sebagai `children` di `SelectValue` (`<SelectValue placeholder="...">{label}</SelectValue>`) — pola ini sudah lebih dulu dipakai di `WilayahSelector.tsx`, cuma luput di-follow saat bikin dropdown baru. **Kalau value dropdown bukan teks yang sama dengan label (ID/UUID/kode), selalu resolve label-nya sendiri, jangan andalkan default rendering.**

**Objek yang dilewatkan sebagai prop dari Server Component ke Client Component harus 100% serializable — jangan taruh fungsi di dalamnya.** Ketemu 26 September 2026 saat bikin kamus i18n (`src/lib/i18n/dictionaries.ts`): beberapa field kamus awalnya berbentuk fungsi (`pageOf(page, total)`, `leadIn(date)`, dst, buat interpolasi kalimat). Begitu objek kamus utuh (`t`) dilewatkan sebagai prop ke Client Component (`LeadStatusSelect`, `AddLeadForm`, dkk — semua yang punya `"use client"`), React gagal serialize: *"Functions cannot be passed directly to Client Components"*, bikin `/crm/[id]` dan `/crm/new` 500 error di production build (lolos di `tsc`/build check biasa karena ini runtime error, bukan type error). React CUMA melihat apakah prop yang dilewatkan mengandung fungsi di mana pun dalam struktur objeknya — cuma dipakai satu field STRING saja dari objek itu di Client Component tidak menyelamatkan, seluruh objek tetap gagal serialize. Solusinya: field kamus/dictionary apa pun yang berpotensi mengalir ke Client Component harus string/number/boolean/object-polos murni — kalau perlu interpolasi kalimat, susun stringnya di Server Component (misal `${t.detail.leadInPrefix} ${tanggal}`), jangan simpan fungsi di kamusnya.

**Flex item tetangga `flex-1` bisa "mencuri" ruang dari flex item lain kalau tidak diberi `min-width:0`.** Ketemu di `Header.tsx`: logo (dalam grup tanpa `shrink-0`) ke-squeeze jadi ~separuh lebar semestinya di viewport mobile, bukan karena aset gambarnya jelek, tapi karena `SearchCommand.tsx` di tengahnya (flex-1) tidak punya `min-w-0` — defaultnya `min-width: auto` bikin browser mempertahankan ukuran min-content search bar dengan cara menyusutkan sibling lain. Pola benar untuk header seperti ini: elemen yang ukurannya harus tetap (logo, ikon) dikasih `shrink-0`, elemen yang boleh menyusut (search, teks panjang) dikasih `min-w-0`. Diverifikasi numerik lewat `getBoundingClientRect()` di browser, bukan cuma kelihatan "kayaknya udah bener" dari screenshot.

**Field boolean dari API pihak ketiga (Kapso) tidak selalu bisa dipercaya, walau didokumentasikan ada.** `message.kapso.has_media` di webhook Kapso didokumentasikan selalu `true` untuk pesan media, tapi di produksi ternyata kosong/tidak terkirim untuk pesan gambar sungguhan walau `message.type` (`"image"`) sudah benar. Solusinya: turunkan `has_media` dari `message.type` (himpunan `image/video/audio/document/sticker`) sebagai sumber kebenaran, bukan percaya flag yang didokumentasikan API pihak ketiga begitu saja — terutama kalau ada field lain yang lebih reliable untuk menyimpulkan hal yang sama.

**Jangan asumsikan "foto yang diupload" itu foto mentah.** Fitur auto-generate flyer promosi (Download JPG/PDF di Property Detail) ditolak Yohan 2x setelah dibangun dengan asumsi foto listing = foto polos properti, lalu kode menimpa judul/harga/badge sendiri di atasnya dan crop paksa ke rasio kolase. Kenyataannya foto yang Yohan upload sudah berupa desain promosi jadi (post Instagram dengan teks/denah sendiri) — overlay & crop otomatis jadi tabrakan/motong konten penting. **Jangan bangun ulang/desain ulang fitur ini tanpa arahan baru** — lihat memory `property-flyer-autogen-failed` untuk detail lengkap sebelum menyentuh `PropertyFlyer.tsx` lagi.

**Deployment Vercel bisa gagal total gara-gara SATU dependency belum di-install, dan gejalanya menipu (bukan error 500, tapi redirect diam-diam).** Ketemu 28-29 September 2026: commit yang menambah `@aws-sdk/client-s3` di-push sebelum Yohan sempat `npm install` di lokal, jadi `next build` gagal total di Vercel (satu module-not-found mematikan SELURUH build, bukan cuma fitur yang memakainya). Karena platform masih terkunci (`PLATFORM_LOCKED`), Vercel otomatis tetap menyajikan **deployment lama** yang sukses — dan deployment lama itu belum punya route baru (`/api/reports/daily` dkk) di `PUBLIC_PATHS`, jadi request ke situ kena redirect ke `/under-development` alih-alih 404 atau error yang jelas. Gejala di curl: cuma balas teks `Redirecting...`, bukan pesan error yang masuk akal — sempat bikin bingung dikira bug di kode `platform-lock.ts` padahal sebenarnya kode barunya belum pernah ter-deploy sama sekali. **Kalau route baru balas "Redirecting..." padahal sudah ada di `PUBLIC_PATHS`, cek dulu status deployment terakhir di Vercel (tab Deployments) sebelum menyalahkan kode** — kemungkinan besar build sebelumnya gagal dan yang live masih versi lama.

**Environment variable ber-tipe "Secret" di Vercel TIDAK BISA dilihat lagi setelah disimpan — write-only permanen, beda dari tipe "Config".** Baru ketahuan 29 September 2026 saat coba ambil ulang nilai `DAILY_REPORT_SECRET` buat testing lewat curl: UI-nya cuma bilang "You can't reveal this value after saving", tidak ada tombol reveal/eye icon sama sekali (bukan disembunyikan di balik klik, memang tidak pernah bisa ditampilkan lagi). Kalau nilai secret hilang/lupa dicatat, **satu-satunya jalan adalah generate nilai baru dan timpa (overwrite)** — bukan "reveal", replace langsung, lalu redeploy. Konsekuensi: setiap kali bikin secret baru (`*_SECRET` untuk header otentikasi machine-to-machine, pola sama seperti `LEADS_INTAKE_SECRET`/`KAPSO_WEBHOOK_SECRET`), **catat nilainya di tempat lain dulu (password manager Yohan) sebelum disimpan ke Vercel** — jangan andalkan bisa lihat lagi nanti dari dashboard.

**`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` di Vercel JUGA "Sensitive"/write-only, sama seperti `*_SECRET` — pelajaran mahal 30 September 2026 (hampir 2 jam debug skrip cleanup foto R2).** Bukan cuma variabel bernama `*_SECRET` yang kena ini. `vercel env pull` menulis literal string `"[SENSITIVE]"` sebagai placeholder untuk 13 variabel termasuk dua ini, DAN dashboard Vercel-nya sendiri sempat kelihatan "ada tombol reveal" tapi nilai yang berhasil dilihat/di-copy tetap tidak match dengan token asli yang aktif di Cloudflare (kemungkinan reveal itu nunjuk ke draft/state lama, bukan nilai tersimpan yang sebenarnya) — jadi jangan percaya begitu saja walau UI kelihatan bisa reveal. **Kalau butuh kredensial R2 buat skrip/testing lokal, jangan coba ambil ulang dari Vercel sama sekali** — langsung buat R2 API token BARU di Cloudflare (R2 → Manage API Tokens → Create Account API token, scope ke bucket yang perlu, TTL pendek kalau cuma sekali pakai), pakai token baru itu, lalu hapus lagi setelah selesai. Tidak perlu sentuh/timpa kredensial produksi di Vercel untuk kebutuhan sekali pakai seperti ini.

**`R2_ACCOUNT_ID` dan `R2_ACCESS_KEY_ID` sama-sama string hex 32 karakter — gampang sekali ketuker pas copy-paste, dan itu yang sebenarnya bikin debugging di atas molor lama.** Root cause asli sesi 30 Sep: kedua nilai itu ke-tuker di `.env.local` (isi baris `R2_ACCOUNT_ID` sebenarnya Access Key ID, dan sebaliknya) — errornya selalu general "401 Unauthorized" dari Cloudflare, sama sekali tidak menyebut endpoint/account salah, jadi kelihatan seperti masalah kredensial/permission padahal murni salah taruh baris. **Cara verifikasi cepat:** cetak/cek `R2_ACCOUNT_ID` yang dipakai harus SAMA PERSIS dengan ID yang muncul di URL dashboard Cloudflare (`dash.cloudflare.com/<account_id>/r2/...`) — itu satu-satunya nilai R2 yang "publik"/gampang dicocokkan tanpa bongkar secret. Kalau keduanya sudah dicek benar tapi tetap 401, curiga ke sini duluan sebelum curiga ke hal lain (permission token, IP filter, jaringan, dll — semua sudah dicoba dan BUKAN itu penyebabnya kali ini).

**AWS SDK v3 (`@aws-sdk/client-s3`) versi baru (>=3.1141.0 dikonfirmasi) defaultnya nambah checksum trailer otomatis ke request, yang belum didukung penuh Cloudflare R2 -- tetap ditambal preventif di `r2.ts` (`requestChecksumCalculation`/`responseChecksumValidation: "WHEN_REQUIRED"`) walau ternyata BUKAN penyebab kasus 401 di atas** (root cause-nya kredensial ketuker, lihat poin di atas). Tetap dipertahankan sebagai pencegahan karena ini incompatibility yang nyata terdokumentasi terpisah, cuma bukan yang terjadi di kasus ini.

---

# Perintah verifikasi

```
npx tsc --noEmit --incremental false
npx eslint src
npm run build
```

Definisi selesai: TypeScript PASS, tidak menambah error ESLint, production build PASS, dan perilaku terverifikasi di runtime — bukan cuma "UI-nya sukses", tapi datanya benar-benar tersimpan di database.
