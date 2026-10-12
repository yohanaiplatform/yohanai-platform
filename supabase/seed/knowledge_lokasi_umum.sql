-- Seed pengetahuan: "Jawaban lokasi umum" (12 Oktober 2026)
-- Dipakai AI Agent saat lead hanya bertanya "lokasi/posisi/ini di mana/dekat mana" tanpa menyebut tempat tertentu:
-- jawab lokasi unit iklan lalu tawarkan lokasi lain dari daftar resmi di bawah. Daftar lokasi lain = sumber kebenaran;
-- ubah di sini (atau langsung di tabel knowledge.entries) kalau stok lokasi berubah. Sudah diterapkan ke database produksi.
insert into knowledge.entries (title, content, keywords, related_listing_terms, review_status, is_active)
values (
  'Jawaban lokasi umum (lead hanya tanya "lokasi/posisi/ini di mana/dekat mana")',
  E'JAWABAN LOKASI UMUM -- dipakai saat lead hanya bertanya lokasi tanpa menyebut tempat tertentu (mis. "lokasi?", "lkasi", "ini di mana?", "posisi?", "dekat mana?", "letaknya di mana?").\n\nLokasi unit yang diiklankan: untuk iklan/lead Kapur Mas = DESA KAPUR (sebut nama kawasannya saja, tanpa alamat persis/pin/jarak).\n\nLokasi LAIN yang tersedia di seputaran Pontianak (daftar resmi dari agen -- sebut persis, jangan menambah/mengurangi):\n- Parit Mayor (Pontianak Timur)\n- Wonodadi 2\n- Kotabaru ujung\n- Pal 7\n- Ampera Raya (Ambawang)\n- Siantan (Pontianak Utara)\n- Sungai Rengas (Kubu Raya)\n\nContoh bentuk jawaban (sesuaikan sapaan dengan aturan nama): "Untuk lokasi yang Kakak lihat di iklan itu ada di Desa Kapur. Kalau sekiranya kurang cocok, kami juga ada di lokasi lain di seputaran Pontianak, seperti: Parit Mayor (Pontianak Timur), Wonodadi 2, Kotabaru ujung, Pal 7, Ampera Raya (Ambawang), Siantan (Pontianak Utara), dan Sungai Rengas (Kubu Raya). Lokasi mana yang paling cocok untuk Kakak?"\n\nJangan menyebut harga/DP/detail tiap lokasi sebelum lead memilih satu lokasi. Kalau lead memilih lokasi, lanjutkan dengan data listing di bagian Listing Tersedia.',
  array['lokasi','lkasi','lokasinya','dimana','di mana','dimna','posisi','posisinya','letak','letaknya','alamat','dekat mana','daerah mana','wilayah mana','ini dimana','ada dimana'],
  array['kapur mas'],
  'approved',
  true
);
