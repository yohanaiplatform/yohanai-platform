---
title: Session Wrap-up — 22 Agustus 2026
description: Ringkasan sesi kerja Yohan.AI Platform
---

# Session Wrap-up — 22 Agustus 2026

## Konteks Masuk Sesi

Sesi dimulai dengan paste `docs/status.mdx` (Sprint 011, v0.1.0-alpha, progress ≈68%). Semua item Authentication (Google OAuth, Forgot Password, Register email, Email Verification) sudah confirmed jalan di production per 22 Agustus 2026. Facebook Login berfungsi teknis tapi masih Unpublished, menunggu Meta Business Verification (resubmitted).

## Yang Dikerjakan Sesi Ini

**Topik: Mitigasi Supabase Free Tier Auto-Pause**

- Keputusan: Yohan tetap pakai Supabase Free plan untuk sementara (alasan funding), menerima risiko auto-pause daripada upgrade ke Pro ($25/mo).
- Riset dikonfirmasi: Supabase Free tier auto-pause project setelah 7 hari tanpa aktivitas *query database* (bukan traffic web app). Free tier juga tidak punya backup retention sama sekali.
- Solusi diimplementasikan: GitHub Actions scheduled workflow untuk ping database tiap 3 hari, mencegah auto-pause.

**File dibuat:** `.github/workflows/supabase-keepalive.yml`

**Iterasi debugging (penting untuk referensi ke depan):**
1. Percobaan pertama pakai anon key + endpoint `/rest/v1/profiles` → gagal (404), karena tabel profile sebenarnya ada di schema `auth_ext.profiles`, bukan `public.profiles`.
2. Percobaan kedua pakai anon key + endpoint root `/rest/v1/` → gagal (401), karena endpoint ini hanya menerima `service_role` key.
3. **Solusi final (berhasil, HTTP 200):** pakai `service_role` key + endpoint `/auth/v1/admin/users?page=1&per_page=1`. Endpoint ini selalu tersedia di semua project Supabase tanpa bergantung skema tabel aplikasi.

**Secrets GitHub yang ditambahkan** (repo `yohanaiplatform/yohanai-platform`):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (sempat dipakai, sekarang tidak dipakai lagi di workflow final)
- `SUPABASE_SERVICE_ROLE_KEY` (dipakai di workflow final)

**Isi final `.github/workflows/supabase-keepalive.yml`:**

```yaml
name: Supabase Keep-Alive

on:
  schedule:
    - cron: "0 3 */3 * *"
  workflow_dispatch: {}

jobs:
  ping-database:
    runs-on: ubuntu-latest
    steps:
      - name: Query Supabase to reset inactivity timer
        run: |
          HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
            "${{ secrets.SUPABASE_URL }}/auth/v1/admin/users?page=1&per_page=1" \
            -H "apikey: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}")
          echo "HTTP Status: $HTTP_CODE"
          cat /tmp/response.json
          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "::error::Supabase ping failed with status $HTTP_CODE"
            exit 1
          fi
```

**Status akhir:** Workflow terverifikasi jalan (HTTP 200, run manual sukses). Commit terakhir terkait: "Use service_role key with auth admin endpoint for reliable keep-alive ping", branch `main`.

## Catatan Penting untuk Sesi Berikutnya

- Kalau service_role key di-regenerate di Supabase Dashboard, WAJIB update juga secret `SUPABASE_SERVICE_ROLE_KEY` di GitHub — kalau lupa, workflow akan diam-diam gagal terus (tapi GitHub akan kirim email notifikasi kegagalan job, jadi ada jaring pengaman).
- Jadwal cron: tiap 3 hari jam 03:00 UTC — margin aman dari batas 7 hari Supabase.
- `docs/status.mdx` BELUM diupdate dengan item ini — item "Supabase auto-pause mitigation" masih perlu dipindah dari Open Issues Medium ke status selesai pada update status.mdx berikutnya (sesuai konvensi: update tiap selesai sprint/milestone, bukan tiap sesi).

## Open Issues yang Belum Disentuh Sesi Ini (masih sama seperti status.mdx)

- Meta Business Verification masih menunggu review (resubmitted)
- SMTP masih pakai Gmail personal — rawan rate limit
- Password SMTP `admin@yohanai.id` di Outlook masih salah
- Dashboard Insight & Property Summary masih dummy/placeholder data
- Dead code belum sepenuhnya dibersihkan
- SPF, DKIM, DMARC belum disetel untuk `yohanai.id`

## Next Priority (belum berubah dari status.mdx)

1. Menunggu hasil Meta Business Verification → App Review Facebook → Publish
2. CRM Foundation
3. Property Module
4. Sales Pipeline
5. AI Intelligence
6. Communication Automation

---

**Instruksi untuk sesi berikutnya:** paste file ini di awal chat baru sebagai konteks awal, sebelum melanjutkan task apa pun.