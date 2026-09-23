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
supabase/migrations/          001–018 skema dasar, lalu migration bernomor per fitur
docs/                         Sumber halaman Mintlify (docs.yohanai.id)
project-docs/                 Arsip dokumen era pra-Claude (ChatGPT/Qwen). Historis saja
```

---

# Aturan kerja dengan Yohan

**Selalu berikan perintah untuk dijalankan sendiri, jangan dijalankan untuk dia.** Build, commit, push, install — tulis dalam blok kode siap-copy dengan sintaks **cmd.exe**, satu perintah per blok. Perintah baca-saja untuk diagnosis (git status, lint, typecheck) boleh dijalankan sendiri.

Bahasa: Indonesia.

Commit: pesan berbahasa Indonesia, `feat:` / `fix:` / `docs:` / `chore:`. Pecah per topik, jangan satu commit besar.

Setiap milestone selesai, perbarui `docs/status.mdx`. Push ke `main` otomatis men-deploy Vercel **dan** Mintlify sekaligus.

---

# Jebakan yang sudah pernah memakan waktu

**RLS dan GRANT itu dua lapisan berbeda.** Policy RLS yang benar tetap tidak berguna kalau role `authenticated` belum diberi `GRANT SELECT/UPDATE` pada tabelnya. Pernah menghabiskan satu sesi penuh di Edit Profile. Tulis `GRANT` eksplisit di migration sejak awal, bersama `DROP POLICY IF EXISTS` supaya idempotent.

**RLS aktif tanpa policy = semua akses ditolak.** `public.profile_completeness_rules` ada dalam kondisi ini — pembacaan langsung dari client selalu mengembalikan nol baris, sementara RPC `check_profile_completeness()` tetap jalan karena `SECURITY DEFINER`. Gejalanya menipu: fiturnya tampak hidup padahal sebagian diam-diam kosong.

**Tabel `customer.*` punya policy tapi tanpa GRANT.** Policy `authenticated_all` sudah ada di database, tetapi role `authenticated` tidak diberi GRANT apa pun — query tetap ditolak sebelum RLS dievaluasi. Harus dibereskan sebelum modul CRM. Perbaikannya sudah ditulis di `supabase/migrations/027_fix_missing_grants.sql`.

**Isi database tidak sama dengan isi repo.** Policy RLS untuk seluruh schema domain ada di database tapi tidak ada di `017_rls.sql`. Jangan pernah menyimpulkan keadaan database hanya dari membaca file migration — verifikasi langsung lewat connector Supabase.

**Schema harus di-expose di Data API.** Supabase hanya mengekspos `public` + `graphql_public` secara default. Schema `auth_ext`, `core`, `customer`, `chat`, `property` sudah ditambahkan manual di Settings → Data API.

**Windows Controlled Folder Access.** Project ada di `C:\Users\User\Documents`, folder yang dilindungi Defender Ransomware Protection. Pernah memblokir `node.exe` dan `git.exe` sehingga build gagal dengan error menyesatkan (`os error 2`, "lockfile") dan commit gagal diam-diam. Kalau muncul error tulis-file aneh atau file 0 byte, cek event log Defender ID 1123 sebelum menyalahkan Next.js.

**Kredensial git repo ini di-set `--local`.** Git Credential Manager menyimpan akun `flobamoraptk` yang tidak punya akses tulis; repo ini diarahkan memakai token `gh` (akun `yohanaiplatform`) lewat config lokal. Clone baru akan kena 403 dan perlu di-set ulang.

**ESLint punya 8 error pre-existing** di `useDashboard.ts`, `EditProfileForm.tsx`, `WilayahSelector.tsx`, dan beberapa file lain (mayoritas `react-hooks/set-state-in-effect`). Bukan dari perubahan baru — jangan panik, tapi jangan tambah yang baru.

---

# Perintah verifikasi

```
npx tsc --noEmit --incremental false
npx eslint src
npm run build
```

Definisi selesai: TypeScript PASS, tidak menambah error ESLint, production build PASS, dan perilaku terverifikasi di runtime — bukan cuma "UI-nya sukses", tapi datanya benar-benar tersimpan di database.
