-- ============================================================================
-- 033_backfill_leads_created_at.sql
-- Yohan.AI Platform — perbaiki created_at lead hasil backfill Google Form
--
-- Backfill Fase 1 (Apps Script -> POST /api/leads/intake) menyisakan
-- created_at = waktu INSERT (hari backfill dijalankan), bukan tanggal
-- form aslinya disubmit -- karena insert sebelumnya tidak pernah
-- mengisi created_at secara eksplisit, jadi jatuh ke DEFAULT now().
-- Akibatnya "Today's New Leads" di dashboard selalu sama dengan Total
-- Leads, dan filter tanggal di Lead List tidak berguna sama sekali.
--
-- metadata->>submitted_at menyimpan tanggal submit ASLI, format
-- Date.prototype.toString() V8 (Apps Script mengirim String(dateObject)),
-- mis. "Wed Jan 14 2026 20:56:02 GMT+0700 (Western Indonesia Time)".
-- Bagian "GMT+0700 (...)" dibuang lalu sisanya diperlakukan sebagai jam
-- lokal Asia/Jakarta (WIB, selalu UTC+7, tidak kenal DST) untuk dikonversi
-- ke UTC.
--
-- route.ts (POST /api/leads/intake) sudah diperbaiki juga supaya insert
-- BARU langsung mengisi created_at yang benar sejak awal -- migration ini
-- cuma untuk baris yang sudah kadung salah.
-- ============================================================================

BEGIN;

UPDATE customer.leads
SET created_at = (
  regexp_replace(metadata->>'submitted_at', ' GMT.*$', '')::timestamp
    AT TIME ZONE 'Asia/Jakarta'
)
WHERE metadata->>'origin' = 'google_form_legacy'
  AND metadata->>'submitted_at' ~ '^[A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT';

COMMIT;
