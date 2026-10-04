// src/lib/panduan/sections.tsx
//
// WAJIB diupdate tiap kali ada fitur baru/berubah di aplikasi (bagian dari
// perintah "Update Docs" Yohan, bukan cuma docs/ developer -- lihat memory
// update-docs-command). Dua aturan penulisan yang sudah ditegaskan Yohan
// (1 Okt 2026):
//   1. Tulis JUJUR soal status fitur (ready/partial/coming_soon) -- jangan
//      fabrikasi instruksi untuk fitur yang belum ada.
//   2. JANGAN bocorkan detail backend/admin-only ke konten yang dibaca user
//      biasa (mis. "role diatur manual admin lewat Supabase Dashboard" itu
//      terlalu teknis/internal -- cukup bilang "hubungi admin"). Konten
//      ditulis dari sudut pandang END USER, bukan developer.

import type { ReactNode } from "react";

export type PanduanStatus = "ready" | "partial" | "coming_soon";

export interface PanduanSection {
  slug: string;
  title: string;
  description: string;
  status: PanduanStatus;
  /** Link YouTube -- isi kalau sudah ada rekaman, kosongkan dulu kalau belum (halaman detail otomatis sembunyikan blok video). */
  videoUrl?: string;
  Content: () => ReactNode;
}

function GuideHeading({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-sm font-semibold text-foreground first:mt-0">{children}</h3>;
}

function GuideP({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

function GuideList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function GuideNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      {children}
    </div>
  );
}

export const PANDUAN_SECTIONS: PanduanSection[] = [
  {
    slug: "mulai-menggunakan-platform",
    title: "Mulai Menggunakan Platform",
    description: "Cara masuk ke platform, verifikasi email, dan login.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Yohan.AI bisa diakses lewat email/password atau Google. Begitu akun dibuat, sistem mengirim email
          verifikasi.
        </GuideP>
        <GuideHeading>Login</GuideHeading>
        <GuideP>
          Buka <code>yohanai.id</code>, masuk pakai email/password yang sudah terdaftar, atau tombol
          &quot;Login dengan Google&quot; kalau akunnya terhubung ke Google.
        </GuideP>
        <GuideHeading>Lupa password</GuideHeading>
        <GuideP>
          Halaman login punya link &quot;Lupa Password&quot; -- masukkan email, link reset dikirim lewat email.
        </GuideP>
        <GuideNote>
          <strong>Pendaftaran mandiri sedang ditutup sementara.</strong> Platform masih dalam mode pemakaian
          personal -- akun baru dibuat manual oleh admin (bukan daftar sendiri lewat form). Kalau butuh akun
          baru, minta admin buatkan dulu, baru login pakai kredensial yang diberikan.
        </GuideNote>
      </>
    ),
  },
  {
    slug: "dashboard",
    title: "Membaca Dashboard",
    description: "Arti tiap kartu statistik dan tombol di halaman utama.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Halaman <strong>Dashboard</strong> adalah halaman pertama yang muncul setelah login -- ringkasan
          cepat kondisi lead, listing, dan percakapan WhatsApp milik Anda sendiri (admin melihat versi agregat
          semua akun).
        </GuideP>

        <GuideHeading>Kartu Statistik</GuideHeading>
        <GuideList
          items={[
            <><strong>Total Leads</strong> -- jumlah lead aktif yang di-assign ke Anda.</>,
            <><strong>Active Chats</strong> -- jumlah percakapan WhatsApp yang sedang berjalan.</>,
            <><strong>Properties</strong> -- jumlah listing properti milik Anda.</>,
            <><strong>Today&apos;s New Leads</strong> -- lead baru yang masuk hari ini saja (reset tiap tengah malam).</>,
          ]}
        />

        <GuideHeading>Lead Funnel</GuideHeading>
        <GuideP>
          Grafik batang yang menunjukkan distribusi lead Anda per status Temperature (Hot/Warm/Cold/Closing/
          Batal) -- sekilas kelihatan mana yang butuh perhatian lebih dulu.
        </GuideP>

        <GuideHeading>Recent Leads & Recent Chats</GuideHeading>
        <GuideP>
          Dua kartu ini menampilkan lead dan percakapan WhatsApp paling baru. Klik salah satu chat di{" "}
          <strong>Recent Chats</strong> untuk langsung buka thread percakapannya tanpa pindah halaman -- update
          pesan baru muncul otomatis (real-time), tidak perlu refresh.
        </GuideP>

        <GuideHeading>Buyer Behavior Insight</GuideHeading>
        <GuideP>
          Panel ini meringkas pola perilaku calon pembeli dari data lead Anda (mis. area yang paling banyak
          diminati, lead yang butuh follow-up) -- insight otomatis, bukan isian manual.
        </GuideP>

        <GuideHeading>Ringkasan Listing (Available/Booked/Sold/Hold)</GuideHeading>
        <GuideP>
          Menunjukkan berapa listing Anda yang masih tersedia, sudah di-booking, sudah terjual, atau sedang
          ditahan (hold) -- status ini diatur manual di tiap halaman detail listing.
        </GuideP>

        <GuideHeading>Quick Actions</GuideHeading>
        <GuideList
          items={[
            <><strong>Tambah Listing</strong> -- buka form tambah listing properti baru.</>,
            <><strong>Lihat Listing</strong> -- buka daftar semua listing Anda.</>,
            <><strong>Tambah Lead</strong> -- buka form tambah lead manual.</>,
            <><strong>Buka CRM</strong> -- buka daftar semua lead Anda.</>,
          ]}
        />
      </>
    ),
  },
  {
    slug: "peran-dan-hak-akses",
    title: "Peran & Hak Akses (Role)",
    description: "Siapa bisa lihat data apa, dan bagaimana role ditentukan.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Setiap akun punya satu <em>role</em> yang menentukan data apa yang bisa dilihat. Role yang tersedia di
          sistem: <code>super_admin</code>, <code>admin</code>, <code>manager</code>, <code>agent</code>,{" "}
          <code>marketing</code>, <code>customer_service</code>.
        </GuideP>
        <GuideHeading>Yang membedakan akses</GuideHeading>
        <GuideP>
          Role lain (manager, agent, marketing, dst) cuma lihat lead/listing yang di-<em>assign</em> ke akun itu
          sendiri -- tidak bisa lihat data milik akun lain.
        </GuideP>
        <GuideHeading>Cara role ditentukan</GuideHeading>
        <GuideP>
          Role tidak dipilih sendiri saat mendaftar -- diatur manual oleh admin lewat database setelah akun
          dibuat. Kalau role terasa salah atau Anda butuh akses berbeda, hubungi admin.
        </GuideP>
      </>
    ),
  },
  {
    slug: "update-profil",
    title: "Update Profil",
    description: "Lengkapi data diri dan lihat progres kelengkapan profil.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Halaman <strong>Profil</strong> (ikon akun di kanan atas) menampilkan progress bar kelengkapan profil
          dan form edit data diri. Progress bar naik otomatis begitu field terisi -- tidak ada tombol
          &quot;simpan kelengkapan&quot; terpisah, cukup isi lalu klik &quot;Simpan Perubahan&quot;.
        </GuideP>

        <GuideHeading>Data Dasar (Tier 1 -- wajib)</GuideHeading>
        <GuideList
          items={[
            <>
              <strong>Anda seorang...</strong> -- pilih kategori yang paling cocok: <em>Agen dari Kantor
              Agen</em>, <em>Agen Freelance</em>, <em>Developer</em>, atau <em>Pemilik Properti Pribadi</em>.
              Pilihan ini menentukan field tambahan apa yang muncul di bagian &quot;Detail Tambahan&quot; di
              bawah.
            </>,
            <><strong>Nama Lengkap</strong> -- tampil di seluruh platform sebagai identitas Anda.</>,
            <>
              <strong>Nomor Telepon/WA</strong> -- statusnya cuma informasi (terverifikasi/belum), belum bisa
              diisi/diubah dari form ini -- fitur verifikasi nomor telepon sendiri belum aktif.
            </>,
            <><strong>Alamat</strong> dan <strong>Wilayah</strong> (Provinsi sampai Desa) -- lokasi domisili Anda.</>,
          ]}
        />

        <GuideHeading>Lengkapi Profil (Tier 2 -- umum untuk semua)</GuideHeading>
        <GuideList
          items={[
            <>
              <strong>Nama Brand</strong> -- nama yang tampil di header <strong>Laporan Pemasaran</strong> yang
              Anda generate untuk vendor/pemilik listing (mis. &quot;Rizal Property&quot;). Kosongkan untuk
              pakai nama lengkap Anda sebagai gantinya.
            </>,
            <><strong>Foto Profil</strong> -- isi dengan link URL foto (bukan upload langsung).</>,
            <><strong>Facebook</strong> dan <strong>Instagram</strong> -- link profil media sosial Anda, opsional tapi membantu lead percaya Anda agen sungguhan.</>,
            <>
              <strong>Nomor WhatsApp untuk Notifikasi Follow-up</strong> -- isi kalau Anda mau ringkasan follow-up
              dari AI Agent (lihat panduan AI Agent Otomatis) ikut dikirim ke WhatsApp pribadi Anda, bukan cuma
              notifikasi di dalam aplikasi. <strong>Harus nomor yang berbeda</strong> dari nomor WhatsApp bisnis
              yang dipakai untuk membalas lead.
            </>,
          ]}
        />

        <GuideHeading>Detail Tambahan (beda-beda sesuai &quot;Anda seorang...&quot;)</GuideHeading>
        <GuideP>Field di bagian ini cuma muncul sesuai kategori yang Anda pilih di Data Dasar:</GuideP>
        <GuideList
          items={[
            <>
              <strong>Agen dari Kantor Agen</strong> -- Nama Kantor/Agensi, Jabatan, apakah punya Sertifikasi
              Broker Properti (kalau Ya, muncul field No. Sertifikat Broker), dan apakah Member AREBI (Asosiasi
              Real Estate Broker Indonesia).
            </>,
            <>
              <strong>Agen Freelance</strong> -- Spesialisasi Properti (mis. rumah subsidi, tanah komersial),
              Area Layanan, dan Sertifikasi Broker Properti (sama seperti di atas).
            </>,
            <><strong>Developer</strong> -- Nama Perusahaan dan NIB/Legalitas.</>,
            <>
              <strong>Pemilik Properti Pribadi</strong> -- Tipe Aset yang dimiliki, dan jumlah properti yang mau
              dijual/disewakan.
            </>,
          ]}
        />
        <GuideP>
          Field-field ini membantu platform (dan lead yang nanti chat dengan Anda) tahu latar belakang &amp;
          kredibilitas Anda -- semakin lengkap, semakin baik.
        </GuideP>
      </>
    ),
  },
  {
    slug: "pengaturan",
    title: "Pengaturan (Settings)",
    description: "Integrasi akun pribadi yang bisa dihubungkan ke platform.",
    status: "partial",
    Content: () => (
      <>
        <GuideP>
          Halaman <strong>Settings</strong> berisi integrasi akun pribadi (Google Contacts) dan, khusus untuk
          komunikasi WhatsApp, pengaturan nomor yang Anda pakai.
        </GuideP>
        <GuideHeading>Kenapa hubungkan Google Contacts</GuideHeading>
        <GuideP>
          Begitu terhubung, lead yang Anda tambah manual lewat &quot;Add Lead&quot; di CRM otomatis tersimpan
          juga sebagai kontak di Google Contacts/HP Anda sendiri -- jadi nomor lead langsung ada di kontak HP
          tanpa input dua kali.
        </GuideP>
        <GuideHeading>Kalau gagal connect</GuideHeading>
        <GuideP>
          Google masih dalam mode &quot;Testing&quot; untuk integrasi ini -- kalau muncul error akses ditolak,
          klik tombol &quot;Ajukan Akses&quot; di halaman yang sama. Admin akan dapat notifikasi dan menambahkan
          email Anda sebagai test user secara manual.
        </GuideP>
        <GuideHeading>Nomor WhatsApp & Pemilik</GuideHeading>
        <GuideP>
          Admin bisa daftarkan nomor WhatsApp bisnis (satu atau lebih) dan tentukan siapa pemiliknya -- lead
          baru yang chat ke nomor itu otomatis jadi milik orang yang ditentukan, dan balasan AI/manual terkirim
          dari nomor yang sesuai.
        </GuideP>
        <GuideP>
          <strong>Kalau Anda bukan admin</strong>, bagian ini menampilkan status nomor WhatsApp Anda sendiri
          (kalau sudah ada), atau form untuk mengajukan nomor baru -- ketik nomor WhatsApp Anda, klik &quot;Tambah
          Nomor&quot;, lalu tunggu. Nomor WA bisnis butuh pendaftaran manual (bukan sesuatu yang bisa langsung
          otomatis dari sini), jadi setelah mengajukan, statusnya akan menampilkan &quot;Menunggu Verifikasi&quot;
          sampai admin menyelesaikan pendaftarannya dan menyetujui -- Anda akan dapat notifikasi begitu nomor
          Anda aktif.
        </GuideP>
        <GuideNote>
          Fitur Settings lain masih akan ditambahkan -- termasuk rencana <strong>watermark foto milik
          sendiri</strong> (saat ini watermark logo Yohan.AI terpasang otomatis di semua foto listing yang
          diupload, belum bisa diganti per user). Halaman ini akan terus berkembang.
        </GuideNote>
      </>
    ),
  },
  {
    slug: "mengelola-lead",
    title: "Mengelola Lead (CRM)",
    description: "Tambah, cari, assign, dan chat dengan lead lewat WhatsApp.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Menu <strong>CRM</strong> menampilkan daftar lead (calon pembeli). Lead masuk otomatis dari WhatsApp
          (begitu nomor baru chat ke sistem) atau ditambah manual lewat tombol &quot;Add Lead&quot;.
        </GuideP>
        <GuideHeading>Lead baru dari WhatsApp</GuideHeading>
        <GuideP>
          Nama lead tersimpan sebagai nama profil WhatsApp diikuti <strong>(NN)</strong> selama konsumen belum
          menyebutkan namanya sendiri; begitu ia menyebutkannya di chat, nama otomatis diganti nama
          aslinya, dan jika masih (NN) asisten menanyakannya dengan sopan. Untuk lead yang datang dari
          iklan, kolom Sumber, Kategori, dan Minat Lokasi terisi otomatis, Sudah Survey diisi
          &quot;Belum&quot;, dan Minat Lokasi diperbarui mengikuti isi percakapan. Catatan ringkasan otomatis
          berbentuk poin topik. Kalau konsumen menekan tombol WhatsApp dari sebuah postingan atau iklan di
          Facebook/Instagram, di Lead Detail muncul kolom <strong>Datang dari</strong> berisi platform, judul,
          isi singkat, dan tautan postingannya.
        </GuideP>
        <GuideHeading>Mencari & menyaring</GuideHeading>
        <GuideP>
          Kolom pencarian di atas daftar lead mencari nama, nomor HP, DAN istilah lokasi/minat yang pernah
          dicatat (mis. ketik &quot;Serdam&quot; untuk nemu lead yang minatnya di area itu). Filter Temperature
          (Hot/Warm/Cold/Closing/Batal) ada di samping.
        </GuideP>
        <GuideHeading>Buka Lead Detail</GuideHeading>
        <GuideList
          items={[
            <>
              <strong>Link halaman pakai nama lead</strong> (mis. <code>/crm/bang-yohan</code>), bukan kode
              acak -- gampang diingat/dibagikan kalau di-copy.
            </>,
            <>
              <strong>Edit Nama/Kontak</strong> -- tombol di bagian atas untuk koreksi manual nama, email, atau
              nomor HP lead (mis. kalau nama aslinya baru diketahui dari percakapan WhatsApp).
            </>,
            <>
              <strong>Hapus Lead</strong> -- tombol di sebelah Edit Nama/Kontak untuk membuang lead yang tidak
              relevan (mis. pesan otomatis atau salah nomor). Selalu ada konfirmasi dulu. Lead hilang dari
              daftar, tapi datanya tidak dihapus permanen sehingga masih bisa dipulihkan lewat database kalau
              salah hapus.
            </>,
            "Ubah Temperature dan siapa yang ditugaskan (assigned) ke lead itu.",
            "Percakapan WhatsApp tampil live di bagian bawah -- bisa balas langsung dari situ, update real-time tanpa refresh halaman.",
            "Catatan (notes) bisa ditambahkan untuk mencatat detail penting yang tidak masuk field standar.",
            <>
              <strong>Kaitkan ke Listing</strong> -- kaitkan lead ini manual ke satu listing tertentu, dipakai
              untuk Laporan Pemasaran listing itu (lihat panduan terpisah). Berguna kalau Kategori lead ini
              terlalu umum untuk otomatis cocok ke listing manapun.
            </>,
          ]}
        />
        <GuideHeading>Export</GuideHeading>
        <GuideP>
          Tombol Export mengunduh hasil filter/pencarian yang sedang aktif sebagai CSV -- bukan seluruh data,
          cuma yang cocok filter saat itu.
        </GuideP>
      </>
    ),
  },
  {
    slug: "follow-up-dan-closing",
    title: "Follow-up & Proses Closing (Sales)",
    description: "Prioritas follow-up Hot/Warm, dan checklist lead yang sudah closing.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Menu <strong>Sales</strong> punya dua topik: daftar lead yang butuh follow-up segera, dan checklist
          proses closing untuk lead yang sudah deal. Begitu masuk halaman ini, yang tampil cuma 2 kartu pilihan
          topik -- klik salah satu untuk buka isinya, klik &quot;Kembali&quot; untuk balik pilih topik lain.
          Daftar lead yang panjang tidak langsung dirender semua sekaligus dari atas ke bawah.
        </GuideP>

        <GuideHeading>Follow-up Hot Lead</GuideHeading>
        <GuideP>
          Menampilkan lead yang belum di-follow-up dalam 48 jam terakhir, dipisah jadi 2 kelompok terpisah --{" "}
          <strong>Hot</strong> dan <strong>Warm</strong> -- masing-masing diurutkan dari yang paling lama tidak
          disentuh. Tiap kelompok dibatasi ke 20 lead paling mendesak -- kalau lebih banyak, ada link
          &quot;lihat semua di CRM&quot; buat daftar lengkap kelompok itu saja.
        </GuideP>

        <GuideHeading>Proses Closing</GuideHeading>
        <GuideP>
          Semua lead Temperature <strong>Closing</strong> tampil sebagai daftar ringkas (nama, No. HP, progres
          singkat) supaya tidak makan tempat -- <strong>klik nama lead</strong> untuk buka detail lengkap kartu
          itu: dropdown &quot;Metode Pembayaran&quot; dan status bar 3 langkah (lingkaran biru, ada efek hover
          supaya jelas bisa diklik):
        </GuideP>
        <GuideHeading>Metode Pembayaran</GuideHeading>
        <GuideP>
          Pilih dulu salah satu dari 4 metode: <strong>KPR Subsidi</strong>, <strong>KPR Non-Subsidi</strong>,{" "}
          <strong>Cash</strong>, atau <strong>Cash Bertahap</strong>. Pilihan ini menentukan daftar dokumen yang
          otomatis terisi di langkah &quot;Berkas Lengkap&quot; (KPR Subsidi paling lengkap termasuk Tapera
          Mobile dan Surat Keterangan Belum Menikah; KPR Non-Subsidi sama tapi tanpa dua dokumen itu; Cash dan
          Cash Bertahap cuma perlu 3 dokumen dasar) -- dan juga mengubah label langkah BAST Kunci (&quot;Akad
          Notaris &amp; Bank&quot; untuk KPR, &quot;Akad Notaris&quot; saja untuk Cash/Cash Bertahap).
        </GuideP>
        <GuideList
          items={[
            <><strong>PPJB Ditandatangani</strong> -- klik lingkaran langkah 1 begitu PPJB (Perjanjian Pengikatan Jual Beli) sudah ditandatangani konsumen.</>,
            <>
              <strong>Berkas Lengkap</strong> -- klik lingkaran langkah 2 untuk buka/tutup detail checklist
              dokumen (kalau checklist-nya sudah pernah diisi sebelumnya, otomatis langsung terbuka, tidak perlu
              diklik ulang). <strong>Begitu Metode Pembayaran dipilih, daftar dokumen yang sesuai langsung
              otomatis terisi</strong> -- tinggal centang yang sudah lengkap dan klik &quot;Hapus&quot; untuk
              dokumen yang ternyata tidak relevan ke lead itu (mis. dokumen khusus Wiraswasta kalau pemohonnya
              Karyawan), atau tambah dokumen lain di luar daftar standar lewat kolom di bawahnya. Centang juga
              &quot;Berkas sudah disubmit&quot;. Langkah ini baru dianggap selesai (lingkaran jadi biru penuh)
              kalau berkas sudah disubmit DAN ada minimal 1 dokumen di checklist DAN semua dokumennya sudah
              tercentang -- centang &quot;sudah disubmit&quot; saja tanpa checklist dokumen apa pun TIDAK
              dianggap selesai.
            </>,
            <>
              <strong>BAST Kunci</strong> -- serah terima kunci, artinya sudah akad. Langkah ini cuma bisa
              ditandai selesai setelah PPJB dan Berkas Lengkap beres duluan.
            </>,
          ]}
        />
        <GuideNote>
          Checklist ini murni pencatatan progres di platform -- belum menghasilkan dokumen PPJB/BAST/Form KPR
          secara otomatis. Dokumennya sendiri masih dibuat lewat proses terpisah seperti biasa. Daftar syarat
          dokumen per metode pembayaran yang sama juga sudah diajarkan ke AI Agent, jadi kalau lead tanya
          &quot;syarat KPR apa saja?&quot; (termasuk soal KPR Subsidi/Non-Subsidi/Cash) lewat WhatsApp, AI bisa
          langsung jawab tanpa perlu eskalasi ke agen.
        </GuideNote>
      </>
    ),
  },
  {
    slug: "mengelola-listing",
    title: "Mengelola Listing Properti",
    description: "Tambah listing baru, kelola foto, dan atur visibilitasnya.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Menu <strong>Properties</strong> menampilkan semua listing. Tombol &quot;+ Tambah Listing&quot; buka
          form judul, harga, alamat, spesifikasi, dan field <strong>Tag / Info AI</strong> (lihat panduan
          terpisah -- wajib diisi).
        </GuideP>
        <GuideHeading>Foto listing</GuideHeading>
        <GuideList
          items={[
            "Upload lewat halaman detail listing, otomatis dikompres + diberi watermark logo.",
            "Foto pertama di daftar = foto sampul, dipakai di grid list.",
            <>
              <strong>Hapus foto itu PERMANEN</strong> -- begitu dikonfirmasi, file-nya benar-benar hilang dari
              penyimpanan (R2), tidak bisa dipulihkan lagi. Selalu ada konfirmasi dulu sebelum terhapus.
            </>,
          ]}
        />
        <GuideHeading>Standar foto yang bagus</GuideHeading>
        <GuideList
          items={[
            <>
              <strong>Upload foto ASLI properti</strong> (hasil jepretan kamera/HP biasa) -- BUKAN desain
              promosi jadi yang sudah ada teks harga/judul/logo sendiri di atasnya. Watermark Yohan.AI otomatis
              ditambahkan di tengah foto -- kalau fotonya sudah penuh teks promosi sendiri, hasilnya jadi
              bertabrakan dan sulit dibaca.
            </>,
            "Pencahayaan cukup terang (siang hari/lampu menyala), tidak blur, dan orientasi foto yang benar (tidak terbalik/miring).",
            "Utamakan foto tampak depan rumah/bangunan sebagai foto sampul (foto pertama) -- itu yang paling dilihat orang di daftar listing.",
            "Resolusi cukup besar (jangan screenshot dari aplikasi chat/medsos -- biasanya sudah terkompres rendah) supaya tetap tajam setelah ikut dikompres otomatis sistem.",
          ]}
        />
        <GuideHeading>Link Google Maps (opsional)</GuideHeading>
        <GuideP>
          Di bagian Spesifikasi ada field <strong>&quot;Link Google Maps&quot;</strong> (1 Oktober 2026) -- opsional,
          tidak wajib diisi, saat ini untuk referensi internal tim saja (tombol &quot;Buka Maps&quot; di halaman
          listing). AI Agent <strong>belum</strong> membagikan link ini ke lead -- untuk permintaan lokasi
          persis/pin Maps, AI selalu menjawab bahwa agen lapangan akan mengirim lokasinya langsung saat
          menghubungi, supaya tidak ada link yang salah/mengarang dikirim otomatis.
        </GuideP>
        <GuideHeading>Sembunyikan vs Hapus</GuideHeading>
        <GuideP>
          &quot;Sembunyikan&quot; itu sementara -- listing hilang dari daftar publik tapi datanya tetap utuh,
          bisa ditampilkan lagi kapan saja. &quot;Hapus&quot; itu beda: listingnya sendiri masih bisa dipulihkan
          lewat database kalau salah hapus, TAPI semua fotonya langsung terhapus permanen dari penyimpanan saat
          itu juga -- tidak ikut bisa dipulihkan.
        </GuideP>
        <GuideHeading>Data Pemilik & Komisi</GuideHeading>
        <GuideP>
          Bagian ini rahasia -- cuma admin dan agent yang ditugaskan ke listing itu yang bisa lihat, dan tidak
          pernah ikut ke flyer/export promosi. Keduanya juga yang bisa mengubah nama pemilik, nomor HP, dan
          nilai komisi lewat tombol Edit.
        </GuideP>
        <GuideHeading>Simulasi KPR</GuideHeading>
        <GuideP>
          Di halaman detail listing ada kartu <strong>Simulasi KPR</strong>: isi DP yang dibayar konsumen untuk
          melihat perkiraan angsuran per bulan (tenor 10, 15, dan 20 tahun) untuk KPR subsidi (kalau listing
          bersubsidi) dan non-subsidi. Ini hanya simulasi, angka pasti ditentukan bank. Asisten otomatis memakai
          hitungan yang sama saat konsumen menyebut nominal DP lewat chat.
        </GuideP>
        <GuideHeading>Video listing</GuideHeading>
        <GuideP>
          Di bagian Video ada tombol <strong>Edit</strong> (atau <strong>Tambah Video</strong> kalau belum ada)
          untuk mengisi link YouTube atau Google Drive. Kosongkan kolomnya untuk menghapus video.
        </GuideP>
      </>
    ),
  },
  {
    slug: "laporan-pemasaran-listing",
    title: "Laporan Pemasaran Listing",
    description: "Laporan untuk vendor/pemilik, otomatis dari data lead -- nomor HP disamarkan.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Tiap listing punya halaman laporan sendiri -- tombol <strong>&quot;Laporan Pemasaran&quot;</strong>{" "}
          di halaman detail listing. Laporan ini dirancang untuk dikirim ke vendor/pemilik properti, format
          mirip laporan manual yang dulu dipakai, tapi sekarang otomatis terisi dari data lead.
        </GuideP>

        <GuideHeading>Langkah 1: Tentukan lead mana yang terkait listing ini</GuideHeading>
        <GuideP>
          Belum ada cara otomatis sepenuhnya -- lead dikaitkan ke listing lewat salah satu dari 2 cara:
        </GuideP>
        <GuideList
          items={[
            <>
              <strong>Kategori Lead</strong> -- di halaman laporan, centang Kategori yang sesuai listing ini
              (mis. &quot;Calon Konsumen Kapur Mas&quot;). Lead dengan Kategori itu otomatis masuk laporan.
              Cocok kalau Kategori-nya sudah spesifik ke satu listing.
            </>,
            <>
              <strong>Kaitkan ke Listing manual</strong> -- untuk lead dengan Kategori yang terlalu umum (mis.
              &quot;Kons. Cari Rumah Murah&quot;, bisa untuk listing manapun), buka halaman Lead Detail lead
              itu, pilih listing yang sesuai lewat dropdown &quot;Kaitkan ke Listing&quot; berdasarkan hasil
              percakapan WhatsApp dengan lead tersebut.
            </>,
          ]}
        />

        <GuideHeading>Langkah 2: Atur periode & cetak</GuideHeading>
        <GuideP>
          Pilih rentang tanggal (default 30 hari terakhir), klik &quot;Terapkan&quot;. Isi &quot;Catatan
          Agent&quot; dan &quot;Rekomendasi&quot; kalau perlu (teks bebas, tidak tersimpan -- isi ulang tiap kali
          generate laporan baru). Klik <strong>&quot;Cetak / Simpan PDF&quot;</strong> -- browser akan buka
          dialog print, pilih &quot;Save as PDF&quot; untuk menyimpan sebagai file.
        </GuideP>

        <GuideNote>
          <strong>Tabel Data Prospek cuma tampilkan 10 lead paling baru</strong> di periode yang dipilih,
          supaya laporan tetap muat 1 halaman cetak. Bagian &quot;Sumber Informasi&quot; di bawahnya tetap
          menghitung SEMUA lead di periode itu, bukan cuma yang 10 ditampilkan -- kalau butuh daftar lengkap,
          persempit dulu rentang tanggalnya.
        </GuideNote>
        <GuideNote>
          <strong>Nomor HP lead di laporan ini otomatis disamarkan</strong> (6 digit terakhir diganti titik-titik)
          -- laporan ini keluar ke pihak luar (vendor/pemilik), beda dari tampilan nomor HP lengkap di CRM yang
          cuma untuk tim internal.
        </GuideNote>
        <GuideNote>
          <strong>Header laporan pakai &quot;Nama Brand&quot; dari Profil Anda</strong> (lihat panduan Update
          Profil) -- kosongkan field itu untuk pakai nama lengkap Anda sebagai gantinya. Website yang tertera
          masih &quot;yohanai.id&quot; untuk semua user -- akan jadi halaman pribadi per user begitu fitur
          landing page dibangun.
        </GuideNote>
        <GuideNote>
          Bagian &quot;Sumber Informasi&quot; di laporan pakai kategori sumber yang sama dengan yang dipakai di
          CRM sekarang (Iklan Meta/Google, Ketemu di Lokasi, dst). Laporan ini belum menghitung jumlah
          telepon/kunjungan per lead -- platform belum punya data itu.
        </GuideNote>
      </>
    ),
  },
  {
    slug: "tag-ai-dan-deskripsi",
    title: "Tag / Info AI & Deskripsi untuk AI Agent",
    description: "Supaya AI Agent bisa jawab pertanyaan lead dengan benar.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Dua field di listing ini yang paling menentukan apakah AI Agent bisa menjawab pertanyaan lead dengan
          tepat lewat WhatsApp -- bukan sekadar field administratif biasa.
        </GuideP>
        <GuideHeading>Tag / Info AI (wajib diisi)</GuideHeading>
        <GuideP>
          Isi dengan istilah yang masyarakat BENERAN pakai sehari-hari, dipisah koma -- BUKAN alamat resmi.
          Boleh istilah lokasi informal (&quot;Kotabaru&quot;, &quot;Kobar&quot;, &quot;dekat Untan&quot;,
          &quot;Paris 2&quot;) MAUPUN kategori/ciri listing (&quot;rumah subsidi&quot;, &quot;rumah second&quot;).
          Kalau lead tanya &quot;ada subsidi di Kobar?&quot; lewat WhatsApp, AI Agent mencocokkan pertanyaan itu
          ke tag ini -- tanpa tag yang tepat, AI tidak akan nemu listingnya walau datanya ada.
        </GuideP>
        <GuideHeading>Deskripsi</GuideHeading>
        <GuideP>
          AI Agent membaca isi Deskripsi untuk jawab pertanyaan detail -- DP akad, harga KPR vs cash per
          blok/tipe, promo, cicilan. Kalau detail itu cuma ditulis di Deskripsi (tidak ada field terpisah),
          pastikan ditulis jelas di situ supaya AI bisa mengutipnya saat menjawab lead.
        </GuideP>
        <GuideNote>
          Listing lama hasil migrasi (sebelum field ini ada) belum semuanya terisi Tag / Info AI -- kalau AI
          Agent kelihatan &quot;tidak tahu&quot; soal listing tertentu, cek dulu apakah tag-nya sudah diisi.
        </GuideNote>
      </>
    ),
  },
  {
    slug: "whatsapp-komunikasi",
    title: "Menyambungkan WhatsApp (Komunikasi)",
    description: "Cara kerja chat WhatsApp dan status koneksinya saat ini.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Pesan WhatsApp yang masuk otomatis dicocokkan ke lead lewat nomor HP, lalu AI Agent (lihat panduan
          terpisah) membaca & membalas kalau relevan.
        </GuideP>
        <GuideHeading>Balas manual</GuideHeading>
        <GuideP>
          Dari halaman Lead Detail, ketik balasan di kolom chat -- terkirim lewat nomor WhatsApp yang sama,
          muncul langsung (real-time) di layar siapa pun yang sedang buka percakapan itu juga.
        </GuideP>
        <GuideHeading>Template follow-up untuk lead yang sudah lama diam</GuideHeading>
        <GuideP>
          WhatsApp hanya mengizinkan pesan bebas dalam 24 jam setelah lead terakhir membalas. Untuk lead yang
          sudah lebih lama diam, di bawah kolom chat ada pilihan <strong>template follow-up</strong> dan tombol{" "}
          <strong>&quot;Kirim Template Follow-up&quot;</strong>. Pesan template terkirim setelah konfirmasi, dan
          lead bisa membalas lewat tombol (mis. &quot;Sudah dapat rumah&quot; / &quot;Belum dapat rumah&quot;) --
          balasan itu ikut diproses otomatis. Template baru hanya bisa dipakai setelah disetujui, dan pesan
          template bisa dikenai biaya per pesan.
        </GuideP>
        <GuideHeading>Follow-up otomatis (nurturing)</GuideHeading>
        <GuideP>
          Lead yang sempat chat lalu diam 48 jam bisa otomatis dikirimi template follow-up (dan sekali lagi 5 hari
          kemudian), maksimal 2 kali, hanya antara pukul 08.00 dan 20.00. Pengiriman berhenti kalau lead membalas
          atau menolak (mis. &quot;Belum saat ini&quot;), dan tidak berlaku untuk lead Hot, Closing, atau Batal. Fitur ini
          baru tahap percobaan dan hanya berjalan setelah admin mengaktifkannya.
        </GuideP>
        <GuideNote>
          <strong>Status saat ini: nomor WhatsApp produksi sudah aktif</strong> (sejak 2 Oktober 2026) -- bukan
          nomor uji coba lagi, balasan AI Agent terkirim ke lead/customer sungguhan.
        </GuideNote>
      </>
    ),
  },
  {
    slug: "ai-agent-otomatis",
    title: "AI Agent Otomatis",
    description: "Cara kerja balasan WhatsApp otomatis, dan batasannya.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Begitu pesan WhatsApp masuk dari lead, AI Agent otomatis membaca konteks (riwayat chat, data lead,
          listing yang relevan) lalu memutuskan: perlu balas apa, apakah status Temperature lead perlu berubah,
          dan apakah perlu dikirim foto listing.
        </GuideP>
        <GuideHeading>Yang bisa dilakukan AI Agent</GuideHeading>
        <GuideList
          items={[
            <>
              <strong>Membalas lead BARU yang belum pernah terdaftar</strong> (mis. dari iklan/baliho yang chat
              duluan) -- otomatis dicatat sebagai lead baru di CRM, bukan cuma didiamkan.
            </>,
            "Membalas pertanyaan umum (harga, lokasi, spesifikasi, DP/cicilan) pakai data listing yang benar-benar ada di sistem.",
            "Mengirim foto listing asli lewat WhatsApp -- TAPI cuma kalau lead eksplisit minta foto/gambar/video (termasuk singkatan seperti \"gbr\") (AI sengaja tidak menawarkan sendiri supaya tidak terkesan memaksa, sekalian hemat biaya).",
            "Menampilkan indikator \"sedang mengetik...\" di WhatsApp lead selama memproses.",
            <>
              Menilai status <strong>Temperature</strong> otomatis dari obrolan: <strong>Cold</strong> untuk lead baru
              yang baru tanya hal dasar (mis. lokasi), <strong>Warm</strong> kalau sudah tanya DP+akad, harga,
              angsuran, syarat KPR, atau lokasi lain, <strong>Hot</strong> kalau sudah mengatur jadwal survey.
              AI hanya menaikkan (tidak menurunkan). <strong>Closing</strong> selalu diisi manual oleh agen setelah
              booking -- AI hanya memberi tahu Anda. <strong>Batal</strong> diisi AI hanya kalau lead eksplisit
              menolak atau sudah dapat rumah lain.
            </>,
          ]}
        />
        <GuideHeading>Yang TIDAK dilakukan AI Agent</GuideHeading>
        <GuideList
          items={[
            "Tidak pernah mengarang detail yang tidak ada di sistem (harga, ketersediaan, dll) -- kalau tidak tahu, dia akui jujur dan catat buat ditindaklanjuti manual.",
            "Tidak membuat janji/komitmen atas nama perusahaan (diskon khusus, jadwal pasti).",
            <>
              <strong>Tidak menyepakati jadwal survey, nego harga, atau bagikan lokasi/pin Maps persis sendiri</strong>{" "}
              (1 Oktober 2026) -- untuk tiga hal ini AI selalu jawab bahwa agen lapangan akan menghubungi langsung,
              supaya tidak ada janji yang sulit dipenuhi agen di lapangan (jarak & lalu lintas tidak bisa dipastikan
              AI). Lead yang menunjukkan minat ini otomatis tercatat sebagai butuh follow-up.
            </>,
          ]}
        />
        <GuideHeading>Konfirmasi Nama & Sapaan</GuideHeading>
        <GuideP>
          Kalau nama lead di sistem belum jelas (kosong, atau masih nama sementara), AI akan menanyakan dengan
          sopan siapa namanya -- tapi baru setelah beberapa pesan pertama (tidak langsung di awal, supaya tidak
          terkesan interogatif), dan tidak pernah asal menyapa &quot;Bapak&quot;/&quot;Ibu&quot; sebelum
          dikonfirmasi. Begitu lead menjawab, nama itu otomatis tersimpan ke data lead -- menggantikan nama
          sementara, bukan menimpa nama asli yang sudah ada.
        </GuideP>
        <GuideHeading>Butuh Follow-up</GuideHeading>
        <GuideP>
          Kalau AI mentok karena data yang ditanya lead memang tidak ada di sistem, dia tetap balas sopan ke
          lead DAN mencatat itu sebagai hal yang perlu ditindaklanjuti manual -- supaya tidak hilang begitu
          saja, agen yang ditugaskan (atau semua admin kalau lead belum ditugaskan) akan dikasih tahu.
        </GuideP>
        <GuideP>
          <strong>Notifikasinya dirangkum, bukan satu-satu.</strong> Kalau dalam 1 sesi chat yang sama AI
          beberapa kali mentok, semua itu digabung jadi SATU notifikasi setelah lead berhenti chat sebentar --
          supaya tidak banjir notifikasi terpisah untuk percakapan yang sama. Notifikasinya bisa diklik langsung
          ke halaman lead itu, dan kalau Anda sudah isi nomor WhatsApp untuk notifikasi di halaman Profil, ikut
          dikirim ke sana juga.
        </GuideP>
        <GuideHeading>Ringkasan Percakapan Otomatis</GuideHeading>
        <GuideP>
          Tiap kali membalas, AI juga menulis/memperbarui 1 catatan ringkasan singkat per lead (muncul di
          Catatan Lead sebagai penulis &quot;AI Agent (ringkasan otomatis)&quot;) -- berisi inti percakapan
          sejauh ini (preferensi, listing yang sudah dibahas, status follow-up). Ini jadi memori AI untuk
          balasan berikutnya, supaya tetap nyambung walau riwayat chat panjang atau ada pesan WhatsApp lama
          yang hilang.
        </GuideP>
      </>
    ),
  },
  {
    slug: "notifikasi",
    title: "Notifikasi In-App",
    description: "Ikon lonceng di kanan atas, kapan muncul notifikasi baru.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Ikon lonceng di pojok kanan atas menampilkan notifikasi yang relevan untuk akun Anda. Titik merah
          muncul kalau ada yang belum dibaca.
        </GuideP>
        <GuideHeading>Yang memicu notifikasi saat ini</GuideHeading>
        <GuideList
          items={[
            "AI Agent butuh follow-up manusia -- muncul ke agen yang ditugaskan ke lead itu (atau semua admin).",
            "Permintaan akses Google Contacts dari user lain -- muncul ke admin, dengan tombol \"Setujui\" langsung di notifikasinya.",
            "Permintaan nomor WhatsApp baru dari user lain, dan kabar nomor Anda sudah aktif setelah diajukan -- lihat panduan Pengaturan.",
          ]}
        />
        <GuideHeading>Rangkuman chat 3x sehari di WhatsApp</GuideHeading>
        <GuideP>
          Kalau Nomor WhatsApp untuk Notifikasi sudah diisi di Profil, Anda menerima satu pesan rangkuman pada
          pukul 08.00, 13.00, dan 21.00 WIB. Isinya semua konsumen yang chat di jendela waktu itu, satu baris
          per konsumen (nama, nomor, inti singkat). Tanda ⚠️ berarti perlu tindak lanjut Anda. Pesan tidak
          dikirim kalau tidak ada chat baru. Catatan: pesan ini baru sampai kalau Anda sudah berkirim pesan
          ke nomor WhatsApp bisnis dalam 24 jam terakhir.
        </GuideP>
      </>
    ),
  },
  {
    slug: "laporan-harian",
    title: "Laporan Harian & Platform",
    description: "Email ringkasan aktivitas yang terkirim tiap pagi.",
    status: "ready",
    Content: () => (
      <>
        <GuideP>
          Setiap pagi jam <strong>07:00 WIB</strong>, sistem otomatis mengirim email ringkasan aktivitas{" "}
          <strong>hari sebelumnya</strong> (00:00-23:59 WIB) ke email login Anda -- tidak perlu setting apa pun,
          aktif secara default.
        </GuideP>
        <GuideHeading>Isi laporan personal</GuideHeading>
        <GuideP>
          Total lead & listing, lead baru kemarin, distribusi Temperature, listing yang butuh perhatian
          (Follow-up Backlog, Lead Beku), aktivitas WhatsApp, dan pemakaian AI Agent -- semuanya di-scope ke
          data milik Anda sendiri (admin dapat versi agregat semua data).
        </GuideP>
        <GuideHeading>Mematikan laporan</GuideHeading>
        <GuideP>
          Preferensi notifikasi (termasuk toggle laporan harian) ada di halaman terpisah, bisa dimatikan kapan
          saja.
        </GuideP>
      </>
    ),
  },
  {
    slug: "berlangganan-ai-model",
    title: "Berlangganan AI Model",
    description: "Status fitur subscription AI untuk pengguna -- belum tersedia.",
    status: "coming_soon",
    Content: () => (
      <>
        <GuideNote>
          <strong>Fitur ini belum dibangun.</strong> Belum ada sistem berlangganan/billing per pengguna di
          platform ini.
        </GuideNote>
        <GuideP>
          Saat ini AI Agent berjalan memakai kapasitas milik pemilik platform (bukan akun/API key pribadi tiap
          user) -- jadi semua user yang pakai AI Agent otomatis ikut memakai kapasitas itu bersama, tanpa perlu
          daftar/bayar terpisah ke pihak manapun. Rencana ke depan: tiap user bisa punya pengaturan/kuota
          sendiri, dengan pembayaran dikelola lewat platform -- panduan ini akan diperbarui begitu fitur ini
          dibangun.
        </GuideP>
      </>
    ),
  },
];

export function getPanduanSection(slug: string): PanduanSection | undefined {
  return PANDUAN_SECTIONS.find((s) => s.slug === slug);
}
