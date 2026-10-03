-- supabase/seed/knowledge_kpr_subsidi.sql
--
-- Salinan entri knowledge.entries (AI Agent) soal KPR & rumah subsidi, per 2 Oktober 2026.
-- Sumber kebenaran SEBENARNYA adalah isi database (entri diedit lewat SQL/dashboard);
-- file ini hanya cadangan kalau database perlu dibangun ulang. BUKAN migration --
-- jalankan manual lewat SQL editor. Idempotent per judul (hapus lalu isi ulang).
-- Aturan bisnis lengkap: docs/status.mdx item 00c-data. Data harga nasional juga ada
-- di src/lib/property/subsidyPriceLimits.ts (sumber: Memo MRF/SM/XII/2025, 30 Des 2025).

delete from knowledge.entries where title in (
  'Syarat Dokumen Pengajuan KPR/KPA',
  'Syarat Utama KPR, Batas Penghasilan, Subsidi vs Non-Subsidi, dan Angsuran Flat',
  'Tabel Simulasi Angsuran Kapur Mas Type 36 (Subsidi & Non-Subsidi) per DP',
  'Batas Harga Jual Rumah Subsidi Seluruh Indonesia (Rumah Tapak)'
);

insert into knowledge.entries (title, content, keywords, related_listing_terms, is_active) values
(
'Syarat Dokumen Pengajuan KPR/KPA',
$c$Griya Indonesia Real Estate melayani 4 metode pembayaran, masing-masing beda kebutuhan dokumennya:

KPR SUBSIDI (dokumen paling lengkap):
Syarat umum: WNI, usia minimal 21 tahun atau sudah menikah, karyawan tetap/profesional/wiraswasta, usia maksimal 55 tahun (karyawan) atau 60 tahun (profesional/wiraswasta) saat kredit lunas.
Dokumen: Down Payment (DP), Fotokopi KTP Pemohon, Fotokopi KTP Suami/Istri (bagi yang sudah menikah) atau Surat Keterangan Belum Menikah dari Desa/Lurah (bagi yang belum menikah), Fotokopi Kartu Keluarga, Fotokopi Akta Nikah/Akta Cerai/Akta Pisah Harta, Fotokopi NPWP/SPT PPh21, Data Keuangan dan/atau Rekening Koran/Tabungan 3 bulan terakhir, Pas Foto 3x4 suami istri masing-masing 2 lembar, Foto tempat kerja, Sket lokasi tempat kerja, Materai 6000 (jumlahnya sekitar 30-40 lembar, sesuai nilai angsuran -- bank yang menginfokan jumlah pastinya setelah pengajuan kredit disetujui), Registrasi Tapera Mobile.
Tambahan sesuai pekerjaan: Karyawan perlu Slip Gaji dan Surat Keterangan Kerja asli dari perusahaan. Profesional perlu Fotokopi Surat Izin Praktek dan/atau Surat Pengangkatan. Wiraswasta/Pengusaha perlu Fotokopi Laporan Keuangan Usaha, Fotokopi SIUP dan TDP/Akta Perusahaan/Surat Keterangan Usaha.

KPR NON-SUBSIDI: sama persis seperti KPR Subsidi di atas, KECUALI tidak perlu Registrasi Tapera Mobile dan tidak perlu Surat Keterangan Belum Menikah dari Desa/Lurah.

CASH dan CASH BERTAHAP (dokumen paling sederhana, cuma 3): Fotokopi KTP Suami/Istri (yang sudah menikah), Fotokopi Kartu Keluarga, dan Fotokopi NPWP/SPT PPh21.

Catatan: persyaratan bisa berubah sesuai kebijakan bank penyedia kredit yang dipilih, dan khusus produk bersubsidi ada dokumen tambahan yang menyesuaikan kebutuhan. Hubungi agen untuk info lebih lengkap dan bantuan proses pengajuan sesuai metode pembayaran yang dipilih.$c$,
array['syarat kpr','dokumen kpr','berkas kpr','persyaratan kpr','syarat kredit rumah','apa saja syarat kpr','kpr butuh apa','dp kpr','syarat kpa','dokumen kpa','berkas kpa','syarat pengajuan kpr','kpr subsidi','kpr non subsidi','cash bertahap','bayar cash','beli cash','metode pembayaran','cara bayar','cicilan developer','tanpa bank'],
array[]::text[], true
),
(
'Syarat Utama KPR, Batas Penghasilan, Subsidi vs Non-Subsidi, dan Angsuran Flat',
$c$SYARAT PALING KRUSIAL KPR: SLIK OJK (BI Checking) harus BERSIH -- tidak boleh ada kredit macet/tunggakan. Ini penentu utama disetujui atau tidaknya KPR, lebih penting dari syarat lain. Kalau lead cerita pernah punya cicilan/pinjol/kartu kredit menunggak, sarankan cek SLIK dulu sebelum lanjut dan arahkan ke agen. Setelah SLIK bersih, baru syarat umum lain (dokumen, usia, pekerjaan) dipenuhi.

BATAS PENGHASILAN KPR SUBSIDI (saat ini): lajang maksimal Rp8 juta per bulan, berkeluarga maksimal Rp11 juta per bulan. Penghasilan minimal sekitar Rp3,5 juta per bulan (sedikit di atas UMR Kalbar). Batas ini bisa berubah mengikuti kebijakan pemerintah/bank.

RUMAH SUBSIDI BISA DIBELI DENGAN KPR NON-SUBSIDI: JAWABANNYA BISA. Subsidi hanya fasilitas dari pemerintah, tidak membatasi developer menjual unitnya secara komersial. Cocok untuk konsumen yang tidak mau ribet dokumen subsidi atau penghasilannya di atas batas maksimum. Jadi untuk lead yang gajinya melebihi batas subsidi, tawarkan KPR non-subsidi (bunga/angsuran beda, hitungan detail oleh agen/bank), atau cash/cash bertahap.

ANGSURAN KPR SUBSIDI: bunga flat, sehingga angsuran flat (tetap) sampai lunas. Angka simulasi di deskripsi listing berasal dari Bank BSN dengan harga rumah Rp182 juta dan plafon KPR Rp176.180.000. Bank lain bisa berbeda tipis (selisih biasanya hanya puluhan ribu rupiah per bulan) -- selalu sebut itu SIMULASI/estimasi dan jelaskan perbedaan antar bank bisa ada; angka final ditentukan bank saat pengajuan.$c$,
array['slik','bi checking','kredit macet','gaji','penghasilan','batas penghasilan','minimal gaji','maksimal gaji','subsidi bisa non subsidi','kpr biasa','kpr non subsidi','kpr komersial','angsuran flat','bunga flat','angsuran','simulasi','materai','gaji berapa','gaji diatas'],
array['subsidi','kapur mas'], true
),
(
'Tabel Simulasi Angsuran Kapur Mas Type 36 (Subsidi & Non-Subsidi) per DP',
$c$ATURAN UTAMA (WAJIB): rincian cara hitung di bawah (1% dari harga, bantuan DP pemerintah Rp4 juta, rumus plafon) adalah PENGETAHUAN INTERNAL AI saja. JANGAN dijelaskan atau disebut ke konsumen -- mereka tidak perlu tahu dan itu membingungkan. DP/DP Akad setiap listing BERBEDA-BEDA (rumah subsidi bisa DP 1 jt, 5 jt, 10 jt, 25 jt, dst) karena kebijakan developer: mis. harga lahan lokasi tinggi sehingga selisihnya dibebankan ke konsumen sebagai DP, atau biaya akad (pajak, notaris, appraisal, dll) sudah ditanggung developer. Maka kalau konsumen tanya "DP / DP akad berapa", SELALU ambil dari DESKRIPSI listing yang dibahas -- JANGAN dihitung dari rumus di bawah. Suku bunga & angsuran rumah subsidi SAMA untuk semua rumah subsidi di Kalimantan Barat (keputusan pemerintah) -- jadi tabel di bawah berlaku untuk SEMUA listing subsidi di database ini yang harganya Rp182.000.000; yang berbeda antar listing hanya DP-nya (ambil dari Deskripsi listing). Tabel dipakai untuk simulasi ANGSURAN (terutama kalau konsumen mengusulkan DP berbeda dari yang tertulis, mis. DP lebih besar). Kalau harga listing subsidi BUKAN Rp182.000.000, atau lokasinya di luar Kalbar, jangan pakai tabel ini -- sebut agen yang akan menghitung simulasinya.

DATA ASLI untuk jawab pertanyaan DP & angsuran Kapur Mas Type 36 (harga subsidi Kalbar Rp182.000.000). JANGAN menghitung bunga sendiri -- baca dari tabel ini. Pengurangan sederhana boleh Anda hitung (harga - DP), lalu cari baris DP yang sama/terdekat di tabel.

ATURAN JAWAB:
- DP lebih kecil/besar dari normal: jawab "bisa", tapi sifatnya PENGAJUAN -- menunggu keputusan bank atas kelayakan konsumen. Jangan menjanjikan disetujui.
- Selalu akhiri simulasi dengan catatan: ini hanya hitungan simulasi, angka pastinya ditentukan pihak bank saat pengajuan KPR sudah disetujui. Perbedaan antar bank biasanya tipis (sekitar Rp10-20 ribu per bulan, karena biaya tambahan bank yang dibebankan ke angsuran).
- Kalau DP lead tidak ada di tabel, sebut angka dari DP TERDEKAT sebagai gambaran kasar dan katakan agen akan menghitung persisnya. JANGAN mengarang angka di luar tabel.
- Tenor yang tersedia: 10, 15, dan 20 tahun (subsidi & non-subsidi sama).

KPR SUBSIDI (bunga 5% flat sepanjang tenor, angsuran tetap sampai lunas). [INTERNAL, jangan diungkap ke konsumen: plafon kredit = 182.000.000 - DP konsumen - 4.000.000 bantuan DP pemerintah; baris pertama di bawah adalah angka simulasi Bank BSN dengan plafon Rp176.180.000.]
DP 1,82 jt (normal) | plafon 176,18 jt | 10 th Rp1.901.000 | 15 th Rp1.414.500 | 20 th Rp1.178.100
DP 5 jt | plafon 173 jt | 10 th Rp1.867.000 | 15 th Rp1.389.000 | 20 th Rp1.157.000
DP 10 jt | plafon 168 jt | 10 th Rp1.813.000 | 15 th Rp1.349.000 | 20 th Rp1.123.000
DP 20 jt | plafon 158 jt | 10 th Rp1.705.000 | 15 th Rp1.269.000 | 20 th Rp1.057.000
DP 30 jt | plafon 148 jt | 10 th Rp1.597.000 | 15 th Rp1.188.000 | 20 th Rp990.000
DP 40 jt | plafon 138 jt | 10 th Rp1.489.000 | 15 th Rp1.108.000 | 20 th Rp923.000
DP 50 jt | plafon 128 jt | 10 th Rp1.381.000 | 15 th Rp1.028.000 | 20 th Rp856.000

KPR NON-SUBSIDI (komersial): DP minimal 10% (Rp18.200.000), TANPA bantuan DP pemerintah. [INTERNAL: plafon = 182.000.000 - DP.] Simulasi memakai bunga 7% (asumsi tertinggi) tetap selama 3 tahun pertama; setelah itu bunga fluktuatif mengikuti bank -- angkanya TIDAK bisa diperkirakan sekarang, jelaskan itu. Keputusan akhir ada di bank.
DP 18,2 jt (10%) | plafon 163,8 jt | 10 th Rp1.902.000 | 15 th Rp1.472.000 | 20 th Rp1.270.000
DP 20 jt | plafon 162 jt | 10 th Rp1.881.000 | 15 th Rp1.456.000 | 20 th Rp1.256.000
DP 30 jt | plafon 152 jt | 10 th Rp1.765.000 | 15 th Rp1.366.000 | 20 th Rp1.178.000
DP 40 jt | plafon 142 jt | 10 th Rp1.649.000 | 15 th Rp1.276.000 | 20 th Rp1.101.000
DP 50 jt | plafon 132 jt | 10 th Rp1.533.000 | 15 th Rp1.186.000 | 20 th Rp1.023.000

CASH TEMPO (tanpa bank): DP awal Rp50 juta, tenor maksimal 12 bulan, sisa Rp132 juta = sekitar Rp11 juta per bulan. Harga belum termasuk BPHTB dan AJB.$c$,
array['dp 30','dp 20','dp 50','dp 10','dp 5','dp berapa','dp nya','dp minimal','angsuran berapa','angsurannya berapa','cicilan berapa','cicilannya','berapa sebulan','per bulan','sebulan','tenor','plafon','dp kecil','dp besar','simulasi angsuran','hitungan angsuran','bunga'],
array['kapur mas','subsidi'], true
),
(
'Batas Harga Jual Rumah Subsidi Seluruh Indonesia (Rumah Tapak)',
$c$Sumber: Lampiran FLPP BSN KPR Sejahtera, Memo MRF No. /M/MRF/SM/XII/2025 tanggal 30 Desember 2025. Batas HARGA JUAL PALING BANYAK rumah umum tapak (subsidi) per wilayah:
1. Jawa (kecuali Jakarta, Bogor, Depok, Tangerang, Bekasi) dan Sumatera (kecuali Kep. Riau, Bangka Belitung, Kep. Mentawai): Rp166.000.000
2. Kalimantan (kecuali Kab. Murung Raya dan Kab. Mahakam Ulu): Rp182.000.000 (termasuk Kalimantan Barat/Pontianak/Kubu Raya)
3. Sulawesi, Bangka Belitung, Kep. Mentawai, dan Kep. Riau (kecuali Kep. Anambas): Rp173.000.000
4. Maluku, Maluku Utara, Bali dan Nusa Tenggara, Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi), Kep. Anambas, Kab. Murung Raya, dan Kab. Mahakam Ulu: Rp185.000.000
5. Papua (Papua, Papua Barat, Papua Tengah, Papua Pegunungan, Papua Selatan, Papua Barat Daya): Rp240.000.000
Gunakan ini kalau konsumen tanya batas harga rumah subsidi di suatu daerah. Suku bunga & angsuran subsidi sama di seluruh Indonesia (keputusan pemerintah); yang beda per wilayah hanya batas harga. Tabel simulasi angsuran di entri lain hanya untuk harga Rp182.000.000 -- untuk harga lain, agen yang menghitung. Aturan bisa berubah, sebut ini acuan.$c$,
array['batas harga subsidi','harga maksimal subsidi','harga rumah subsidi','harga subsidi','plafon harga subsidi','rumah subsidi di','subsidi di jawa','subsidi di sumatera','subsidi di sulawesi','subsidi di papua','subsidi di bali','harga subsidi kalimantan'],
array['subsidi'], true
);

-- Ditambahkan 3 Okt 2026
delete from knowledge.entries where title = 'ASN / P3K / PNS membeli Rumah Subsidi';
insert into knowledge.entries (title, content, keywords, related_listing_terms, is_active) values (
'ASN / P3K / PNS membeli Rumah Subsidi',
$c$Pertanyaan: apakah ASN/P3K (PPPK)/PNS bisa KPR rumah subsidi? JAWABAN: Pada dasarnya BISA, dan mengikuti ketentuan penerima rumah subsidi dari pemerintah (KPR FLPP / Tapera), dengan beberapa penyesuaian khusus mengenai MASA KERJA dan BATAS PENGHASILAN. Syarat inti tetap berlaku: SLIK OJK bersih, penghasilan dalam batas subsidi (lajang maksimal Rp8 juta, berkeluarga maksimal Rp11 juta per bulan), belum pernah memiliki rumah/menerima subsidi. Untuk P3K/PPPK atau status kepegawaian khusus, detail masa kerja minimal dan dokumen (SK pengangkatan, slip gaji, dsb) mengikuti kebijakan bank penyedia kredit -- sampaikan bahwa agen akan membantu memastikan syarat pastinya. Boleh dijawab bahwa tidak terbatas satu lokasi: syarat ini berlaku untuk rumah subsidi di lokasi mana pun yang tersedia.$c$,
array['asn','p3k','pppk','pns','pegawai negeri','honorer','kontrak p3k','sk pengangkatan','masa kerja'],
array['subsidi'], true);

-- Ditambahkan 3 Okt 2026
delete from knowledge.entries where title = 'Iklan "Merdeka dari Kontrakan tiap bulan" = Kapur Mas Residence Tahap 1';
insert into knowledge.entries (title, content, keywords, related_listing_terms, is_active) values (
'Iklan "Merdeka dari Kontrakan tiap bulan" = Kapur Mas Residence Tahap 1',
$c$Iklan Facebook/Instagram dengan judul "Merdeka dari Kontrakan tiap bulan" (isi: "Mau Merdeka dengan Gaji UMR di rumah sendiri? segera hubungi kami!") mempromosikan perumahan subsidi KAPUR MAS RESIDENCE TAHAP 1 (Griya Indonesia Real Estate, Desa Kapur). Kalau lead datang dari iklan ini, anggap yang dimaksud adalah Kapur Mas Tahap 1. Untuk detail/ketersediaan unit Tahap 1, gunakan data listing yang ada; kalau tidak ada datanya, sampaikan bahwa agen akan mengonfirmasi ketersediaan unit (jangan menjawab dengan data Tahap 2 seolah itu Tahap 1).$c$,
array['merdeka dari kontrakan','kontrakan tiap bulan','gaji umr di rumah sendiri','merdeka dengan gaji umr'],
array['kapur mas','subsidi'], true);
