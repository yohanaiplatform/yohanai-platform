-- ============================================================================
-- 052_kpr_requirements_by_payment_method.sql
-- Yohan.AI Platform -- Perluas knowledge entry syarat dokumen (1 Oktober 2026)
--
-- Migration 051 cuma mencakup KPR/KPA secara umum. Yohan klarifikasi ada
-- 4 metode pembayaran dengan kebutuhan dokumen berbeda-beda (KPR Subsidi,
-- KPR Non-Subsidi, Cash, Cash Bertahap) -- entry ini diupdate supaya AI
-- Agent bisa jawab FAQ "syarat KPR apa saja?" dengan detail yang benar
-- sesuai metode pembayaran yang ditanyakan lead, bukan cuma versi umum.
-- Daftar dokumen sama persis dengan BERKAS_ITEMS_BY_PAYMENT_METHOD di
-- src/lib/sales/getSalesData.ts -- kalau salah satu diubah, ubah juga
-- yang satunya supaya tidak drift.
-- ============================================================================

BEGIN;

UPDATE knowledge.entries
SET
    content = 'Griya Indonesia Real Estate melayani 4 metode pembayaran, masing-masing beda kebutuhan dokumennya:

KPR SUBSIDI (dokumen paling lengkap):
Syarat umum: WNI, usia minimal 21 tahun atau sudah menikah, karyawan tetap/profesional/wiraswasta, usia maksimal 55 tahun (karyawan) atau 60 tahun (profesional/wiraswasta) saat kredit lunas.
Dokumen: Down Payment (DP), Fotokopi KTP Pemohon, Fotokopi KTP Suami/Istri (bagi yang sudah menikah) atau Surat Keterangan Belum Menikah dari Desa/Lurah (bagi yang belum menikah), Fotokopi Kartu Keluarga, Fotokopi Akta Nikah/Akta Cerai/Akta Pisah Harta, Fotokopi NPWP/SPT PPh21, Data Keuangan dan/atau Rekening Koran/Tabungan 3 bulan terakhir, Pas Foto 3x4 suami istri masing-masing 2 lembar, Foto tempat kerja, Sket lokasi tempat kerja, Materai 6000 sebanyak 12 lembar, Registrasi Tapera Mobile.
Tambahan sesuai pekerjaan: Karyawan perlu Slip Gaji dan Surat Keterangan Kerja asli dari perusahaan. Profesional perlu Fotokopi Surat Izin Praktek dan/atau Surat Pengangkatan. Wiraswasta/Pengusaha perlu Fotokopi Laporan Keuangan Usaha, Fotokopi SIUP dan TDP/Akta Perusahaan/Surat Keterangan Usaha.

KPR NON-SUBSIDI: sama persis seperti KPR Subsidi di atas, KECUALI tidak perlu Registrasi Tapera Mobile dan tidak perlu Surat Keterangan Belum Menikah dari Desa/Lurah.

CASH dan CASH BERTAHAP (dokumen paling sederhana, cuma 3): Fotokopi KTP Suami/Istri (yang sudah menikah), Fotokopi Kartu Keluarga, dan Fotokopi NPWP/SPT PPh21.

Catatan: persyaratan bisa berubah sesuai kebijakan bank penyedia kredit yang dipilih, dan khusus produk bersubsidi ada dokumen tambahan yang menyesuaikan kebutuhan. Hubungi agen untuk info lebih lengkap dan bantuan proses pengajuan sesuai metode pembayaran yang dipilih.',
    keywords = ARRAY['syarat kpr', 'dokumen kpr', 'berkas kpr', 'persyaratan kpr', 'syarat kredit rumah', 'apa saja syarat kpr', 'kpr butuh apa', 'dp kpr', 'syarat kpa', 'dokumen kpa', 'berkas kpa', 'syarat pengajuan kpr', 'kpr subsidi', 'kpr non subsidi', 'cash bertahap', 'bayar cash', 'beli cash', 'metode pembayaran', 'cara bayar', 'cicilan developer', 'tanpa bank']::text[],
    updated_at = NOW()
WHERE title = 'Syarat Dokumen Pengajuan KPR/KPA';

COMMIT;
