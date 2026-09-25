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

**Lead Intake Fase 1 dan CRM Foundation Fase 2 sudah SELESAI** (Lead List, Lead Detail, ubah status dari UI, assign lead ke agent, filter Sumber Informasi — semua terverifikasi end-to-end di production, terakhir 25 September 2026). Jangan bangun ulang, baca dulu `docs/modules/crm.mdx` bagian "Rencana Lead Intake dari Google Form" dan "Fase 2 — CRM Foundation" untuk lihat apa yang sudah ada.

**Kerjaan sekarang: keputusan WAHA vs Fonnte untuk Communication Automation.** Belum dibahas sama sekali — jangan mulai bangun integrasi WA apa pun sebelum ini diputuskan eksplisit bareng Yohan.

Setelah itu: Property Module, lalu AI Foundation (baru ada 1 insight nyata: Follow-up Backlog).

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
supabase/migrations/          001–021 skema dasar, 022–026 Sprint 011, 027–030 perbaikan akses, 031–034 Lead Intake Fase 1 + CRM Foundation, 035 pemisahan akses lead per akun, 036 fungsi list_assignable_users, 037 sumber lead "Input Manual", 038 tabel customer.notes (append-only)
src/app/api/leads/intake/     POST endpoint lead intake (Fase 1, selesai)
src/app/(dashboard)/crm/[id]/ Lead Detail — lihat, ubah status, assign agent (Fase 2, selesai)
src/app/(dashboard)/crm/new/  Tambah Lead manual — dashboard/CRM "Add Lead" button (selesai 26 Sep 2026)
src/lib/crm/                  getLeads()/getLeadById()/createLead() dan helper CRM Foundation (Fase 2, selesai)
src/components/crm/           Lead List, Lead Detail, Add Lead form, status/assign select (Fase 2, selesai)
src/components/shared/        WhatsAppButton — dipakai CRM + dashboard
src/lib/i18n/                 Bi-lingual ID/EN — kamus (dictionaries.ts), baca locale dari cookie (getLocale.ts). Baru cakupan modul CRM (selesai 26 Sep 2026), modul lain masih Indonesia tetap
docs/                         Sumber halaman Mintlify (docs.yohanai.id)
project-docs/                 Arsip dokumen era pra-Claude (ChatGPT/Qwen). Historis saja
```

---

# Aturan kerja dengan Yohan

**Selalu berikan perintah untuk dijalankan sendiri, jangan dijalankan untuk dia.** Build, commit, push, install — tulis dalam blok kode siap-copy dengan sintaks **cmd.exe**, satu perintah per blok. Perintah baca-saja untuk diagnosis (git status, lint, typecheck) boleh dijalankan sendiri.

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

**Isi database tidak sama dengan isi repo — jangan menyimpulkan dari file migration saja.** Policy RLS untuk seluruh schema domain ternyata ada di database padahal tidak ada di `017_rls.sql`. Audit 23 September 2026 sudah menutup celah ini (migration kini `001`–`036`, terverifikasi sinkron), tapi kebiasaannya tetap berlaku: verifikasi langsung lewat connector Supabase sebelum menyimpulkan.

**Pola yang sama juga kena `src/types/database.ts`, dan berulang 2x.** Migration `035` menambah kolom `customer.leads.assigned_to` tapi tipe TypeScript-nya tidak pernah di-regenerate — ketemu 24 September saat mulai kerja Lead Detail. Lalu ketemu lagi 25 September: fungsi `is_authenticated()`/`is_admin_or_above()` (dari `034`/`035`) ternyata juga tidak pernah masuk tipe sejak awal dibuat, baru ketahuan pas `list_assignable_users()` (`036`) butuh dipanggil dari client via `.rpc()` dan perlu tipe yang benar. **Tool `generate_typescript_types` lewat Supabase MCP cuma balikin schema `public`** — tidak berguna buat project ini yang schema utamanya (`core`/`customer`/`auth_ext`/dst) semua di luar `public`. Cara yang benar: cek kolom/fungsi asli lewat `information_schema.columns` atau `pg_proc`, lalu tambal manual di `database.ts` mengikuti pola yang sudah ada di file itu — bukan percaya isi file types mencerminkan migration terbaru.

**`created_by` nyaris tidak pernah diisi di seluruh aplikasi.** Ketemu 26 September 2026 saat bikin `customer.notes`: kolom `created_by` (ada di hampir semua tabel, `REFERENCES auth.users(id)`, tapi TANPA default) ternyata tidak pernah di-set eksplisit oleh kode manapun di `src/` — `grep created_by src/` nol hasil di kode aplikasi, cuma muncul di tipe TypeScript. Diperbaiki cuma di `createLead.ts` dan insert notes baru (yang ditulis sesi itu); tabel/insert lain kemungkinan masih kosong dan belum diaudit menyeluruh. **Kalau insert ke tabel yang punya kolom `created_by`, selalu isi eksplisit dari `(await supabase.auth.getUser()).data.user?.id`** — jangan asumsikan ada trigger/default yang mengisinya.

**Schema harus di-expose di Data API.** Supabase hanya mengekspos `public` + `graphql_public` secara default. Schema `auth_ext`, `core`, `customer`, `chat`, `property` sudah ditambahkan manual di Settings → Data API.

**Windows Controlled Folder Access.** Project ada di `C:\Users\User\Documents`, folder yang dilindungi Defender Ransomware Protection. Pernah memblokir `node.exe` dan `git.exe` sehingga build gagal dengan error menyesatkan (`os error 2`, "lockfile") dan commit gagal diam-diam. Kalau muncul error tulis-file aneh atau file 0 byte, cek event log Defender ID 1123 sebelum menyalahkan Next.js.

**Kredensial git repo ini di-set `--local`.** Git Credential Manager menyimpan akun `flobamoraptk` yang tidak punya akses tulis; repo ini diarahkan memakai token `gh` (akun `yohanaiplatform`) lewat config lokal. Clone baru akan kena 403 dan perlu di-set ulang.

**ESLint punya 8 error pre-existing** di `useDashboard.ts`, `EditProfileForm.tsx`, `WilayahSelector.tsx`, dan beberapa file lain (mayoritas `react-hooks/set-state-in-effect`). Bukan dari perubahan baru — jangan panik, tapi jangan tambah yang baru.

**Komponen `Select` (Base UI, `src/components/ui/select.tsx`) tidak otomatis menampilkan label kalau `value` item beda dari teks tampilannya.** Ketemu di dropdown "Ditugaskan ke" (`AddLeadForm.tsx`) — value-nya UUID user, tapi yang seharusnya tampil nama. Tanpa penanganan khusus, `SelectValue` fallback menampilkan UUID mentah. Solusinya: hitung label yang sesuai dari value yang dipilih, lalu taruh sebagai `children` di `SelectValue` (`<SelectValue placeholder="...">{label}</SelectValue>`) — pola ini sudah lebih dulu dipakai di `WilayahSelector.tsx`, cuma luput di-follow saat bikin dropdown baru. **Kalau value dropdown bukan teks yang sama dengan label (ID/UUID/kode), selalu resolve label-nya sendiri, jangan andalkan default rendering.**

**Objek yang dilewatkan sebagai prop dari Server Component ke Client Component harus 100% serializable — jangan taruh fungsi di dalamnya.** Ketemu 26 September 2026 saat bikin kamus i18n (`src/lib/i18n/dictionaries.ts`): beberapa field kamus awalnya berbentuk fungsi (`pageOf(page, total)`, `leadIn(date)`, dst, buat interpolasi kalimat). Begitu objek kamus utuh (`t`) dilewatkan sebagai prop ke Client Component (`LeadStatusSelect`, `AddLeadForm`, dkk — semua yang punya `"use client"`), React gagal serialize: *"Functions cannot be passed directly to Client Components"*, bikin `/crm/[id]` dan `/crm/new` 500 error di production build (lolos di `tsc`/build check biasa karena ini runtime error, bukan type error). React CUMA melihat apakah prop yang dilewatkan mengandung fungsi di mana pun dalam struktur objeknya — cuma dipakai satu field STRING saja dari objek itu di Client Component tidak menyelamatkan, seluruh objek tetap gagal serialize. Solusinya: field kamus/dictionary apa pun yang berpotensi mengalir ke Client Component harus string/number/boolean/object-polos murni — kalau perlu interpolasi kalimat, susun stringnya di Server Component (misal `${t.detail.leadInPrefix} ${tanggal}`), jangan simpan fungsi di kamusnya.

**Flex item tetangga `flex-1` bisa "mencuri" ruang dari flex item lain kalau tidak diberi `min-width:0`.** Ketemu di `Header.tsx`: logo (dalam grup tanpa `shrink-0`) ke-squeeze jadi ~separuh lebar semestinya di viewport mobile, bukan karena aset gambarnya jelek, tapi karena `SearchCommand.tsx` di tengahnya (flex-1) tidak punya `min-w-0` — defaultnya `min-width: auto` bikin browser mempertahankan ukuran min-content search bar dengan cara menyusutkan sibling lain. Pola benar untuk header seperti ini: elemen yang ukurannya harus tetap (logo, ikon) dikasih `shrink-0`, elemen yang boleh menyusut (search, teks panjang) dikasih `min-w-0`. Diverifikasi numerik lewat `getBoundingClientRect()` di browser, bukan cuma kelihatan "kayaknya udah bener" dari screenshot.

---

# Perintah verifikasi

```
npx tsc --noEmit --incremental false
npx eslint src
npm run build
```

Definisi selesai: TypeScript PASS, tidak menambah error ESLint, production build PASS, dan perilaku terverifikasi di runtime — bukan cuma "UI-nya sukses", tapi datanya benar-benar tersimpan di database.
