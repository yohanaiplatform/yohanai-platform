-- ============================================================================
-- 051_kpr_requirements_knowledge.sql
-- Yohan.AI Platform -- Knowledge entry syarat dokumen KPR/KPA (1 Oktober 2026)
--
-- Sumber: form resmi "Layanan KPR/KPA" Griya Indonesia Real Estate.
-- "Syarat KPR apa saja?" adalah salah satu FAQ paling umum dari lead lewat
-- WhatsApp -- entri ini bikin AI Agent bisa jawab langsung tanpa harus
-- eskalasi ke agen manusia tiap kali ditanya. Daftar dokumen yang sama
-- juga dipakai sebagai checklist default di halaman Sales (lihat
-- DEFAULT_BERKAS_ITEMS di src/lib/sales/getSalesData.ts).
-- ============================================================================

BEGIN;

INSERT INTO knowledge.entries (title, content, keywords, related_listing_terms)
SELECT
    'Syarat Dokumen Pengajuan KPR/KPA',
    'Syarat Umum Pengajuan KPR/KPA:
- Warga Negara Indonesia (WNI)
- Usia minimal 21 tahun atau sudah menikah
- Berstatus karyawan tetap, profesional, atau wiraswasta
- Usia maksimal 55 tahun untuk karyawan, 60 tahun untuk profesional/wiraswasta saat kredit lunas

Dokumen yang diperlukan (berlaku umum untuk semua jenis pemohon):
- Down Payment (DP)
- Fotokopi KTP Pemohon
- Fotokopi KTP Suami/Istri atau Surat Keterangan Belum Menikah
- Fotokopi Kartu Keluarga
- Fotokopi Akta Nikah / Akta Cerai / Akta Pisah Harta
- Fotokopi NPWP / SPT PPh21
- Data keuangan dan/atau Rekening Koran/Tabungan 3 bulan terakhir
- Pas foto 3x4 suami istri masing-masing 2 lembar
- Foto tempat kerja
- Sket lokasi tempat kerja
- Materai 6000 sebanyak 12 lembar

Dokumen tambahan sesuai jenis pekerjaan pemohon:
- Karyawan: Slip gaji dan Surat Keterangan Kerja asli dari perusahaan
- Profesional: Fotokopi Surat Izin Praktek dan/atau Surat Pengangkatan
- Wiraswasta/Pengusaha: Fotokopi Laporan Keuangan Usaha, Fotokopi SIUP dan TDP/Akta Perusahaan/Surat Keterangan Usaha

Catatan: persyaratan bisa berubah sesuai kebijakan bank penyedia kredit yang dipilih, dan khusus produk bersubsidi ada dokumen tambahan yang menyesuaikan kebutuhan. Hubungi agen untuk info lebih lengkap dan bantuan proses pengajuan.',
    ARRAY['syarat kpr', 'dokumen kpr', 'berkas kpr', 'persyaratan kpr', 'syarat kredit rumah', 'apa saja syarat kpr', 'kpr butuh apa', 'dp kpr', 'syarat kpa', 'dokumen kpa', 'berkas kpa', 'syarat pengajuan kpr']::text[],
    ARRAY[]::text[]
WHERE NOT EXISTS (
    SELECT 1 FROM knowledge.entries WHERE title = 'Syarat Dokumen Pengajuan KPR/KPA'
);

COMMIT;
