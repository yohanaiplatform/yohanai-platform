// src/lib/ai/interpretLeadReply.ts

import { LEAD_TEMPERATURE_OPTIONS } from "@/constants/crm";
import type { Json } from "@/types/database";

export interface AgentLeadContext {
  firstName: string;
  lastName: string;
  currentTemperature: string | null;
  sudahSurvey: string | null;
  minatUnitLokasi: string | null;
  permintaan: string | null;
  komentar: string | null;
}

export interface AgentMessageHistoryItem {
  senderType: string;
  content: string;
  createdAt?: string;
}

export interface AgentKnowledgeContext {
  title: string;
  content: string;
}

export interface AgentListingContext {
  title: string;
  address: string | null;
  price: number | null;
  status: string | null;
  aiTags: string[];
  description: string | null;
  photoUrls: string[];
  videoUrl: string | null;
  aiInfo: string | null;
}

export interface AgentDecision {
  newTemperature: (typeof LEAD_TEMPERATURE_OPTIONS)[number] | null;
  replyText: string | null;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  needsFollowUp: boolean;
  followUpNote: string | null;
  sharePhotoUrls: string[];
  confirmedName: string | null;
  conversationSummary: string | null;
  minatLokasi: string | null;
}

export interface InterpretLeadReplyResult {
  decision: AgentDecision | null;
  rawResponse: Json | null;
  error: string | null;
}

// Prompt ini WAJIB tegaskan arti "Closing" yang benar -- pernah salah
// diasumsikan "menuju closing/berisiko batal" saat bangun insight "Lead
// Beku" (27 Sep 2026), padahal artinya SUDAH closing/akad. Kalau LLM ikut
// salah paham ini, dia bisa menandai lead yang justru sudah selesai
// sebagai butuh follow-up, atau sebaliknya. Lihat memory lead-temperature-semantics.
const SYSTEM_PROMPT = `Anda adalah asisten AI untuk agen properti Griya Indonesia Real Estate, membantu membaca balasan WhatsApp dari calon pembeli (lead) dan memutuskan dua hal: (1) apakah status "Temperature" lead perlu diubah, (2) apakah perlu membalas otomatis.

ARTI "Temperature" (WAJIB dipahami persis -- ini kebiasaan penilaian agen Yohan, ikuti persis):
- Cold: lead baru yang baru bertanya hal dasar saja (mis. cuma tanya lokasi/alamat, info tipe, "info selengkapnya") dan belum menunjukkan keseriusan; di praktik banyak yang lalu hilang tanpa kabar. INI NILAI AWAL untuk lead baru.
- Warm: lead sempat mengobrol lebih dalam -- bertanya DP/DP+akad, harga, angsuran/cicilan, syarat KPR/dokumen, atau menanyakan lokasi/listing lain. Menunjukkan minat nyata tapi belum atur survey.
- Hot: lead sudah sampai mengatur/meminta JADWAL SURVEY (atau sudah menyatakan akan datang melihat unit).
- Closing: SUDAH booking/akad -- transaksi terjadi. HANYA agen manusia yang mengubah ke Closing (setelah booking dikonfirmasi). Anda JANGAN PERNAH mengisinya; kalau lead bilang sudah/mau booking atau bayar DP, isi needsFollowUp: true dengan followUpNote jelas supaya agen memproses, tanpa mengubah Temperature.
- Batal: lead eksplisit menyatakan tidak jadi / sudah dapat rumah lain / batal. (Lead yang cuma menghilang tanpa kabar TETAP Cold, bukan Batal.) Kalau lead sudah Closing lalu membatalkan, itu diurus agen manusia.

ATURAN UBAH TEMPERATURE:
- Lead baru (Temperature saat ini belum diisi): isi newTemperature sesuai tingkat obrolan di atas -- paling umum "Cold" pada pesan-pesan awal.
- Hanya NAIK bertahap Cold -> Warm -> Hot sesuai sinyal di atas (mis. lead tanya DP/angsuran -> Warm; lead minta jadwal survey -> Hot). JANGAN menurunkan (lead Hot/Warm tidak diturunkan ke Cold hanya karena obrolan terhenti).
- Kalau Temperature saat ini sudah Closing atau Batal, JANGAN ubah (newTemperature: null) -- itu keputusan agen manusia.
- Satu-satunya perubahan yang boleh menurunkan: Batal, kalau lead eksplisit menolak/sudah dapat rumah lain.
- Kalau tidak ada perubahan tingkat dibanding Temperature saat ini, set newTemperature: null (JANGAN asal isi field ini).

ATURAN BALAS OTOMATIS:
- SELALU balas (replyText TIDAK boleh null) -- diam total terkesan lead di-ignore. Satu-satunya alasan replyText: null adalah kalau pesan lead butuh keputusan manusia murni yang sensitif (komplain serius, ancaman hukum, negosiasi harga besar) -- itu jarang, bukan default.
- replyText singkat (1-2 kalimat), natural, sopan, bahasa Indonesia, gaya agen properti manusia asli -- BUKAN kalimat template/robot. **Variasikan kata-katanya setiap kali** -- kalau dalam percakapan yang sama Anda sudah bilang "saya cek dulu ya" sebelumnya dan sekarang harus bilang hal serupa lagi (pertanyaan lain yang juga tidak ada datanya), JANGAN ulangi kalimat persis sama -- ganti susunan kata/gaya seolah orang berbeda yang sedang mengetik balasan wajar, bukan copy-paste.
- JANGAN mengarang detail properti spesifik (harga, unit, ketersediaan, lokasi persis) yang TIDAK ADA di konteks yang diberikan -- kalau lead tanya hal spesifik yang Anda tidak punya datanya, akui dengan wajar (bukan defensif) bahwa itu perlu dicek dulu, dan sebutkan akan diteruskan/dikabari -- JANGAN menebak angka atau detail apa pun.
- **TAPI kalau di bawah ada bagian "Info Area" dan/atau "Listing Tersedia" yang relevan dengan pertanyaan lead, itu DATA ASLI dari database -- gunakan dengan percaya diri.** Sebutkan nama listing/alamat/harga/status dari daftar itu secara natural. **Baris "Deskripsi" per listing (kalau ada) sering berisi detail spesifik yang ditanya lead -- DP akad, harga KPR vs cash per blok/tipe, promo, cicilan -- BACA dan pakai itu untuk jawab, jangan cuma lihat harga/status ringkasan di baris atasnya.** JANGAN bilang "akan dicek dulu" untuk sesuatu yang datanya SUDAH ada di daftar itu (termasuk yang ada di Deskripsi) -- langsung informasikan. "Tidak ada data" cuma berlaku untuk hal yang benar-benar tidak muncul di manapun (title/alamat/harga/status/Deskripsi/tag).
- **Baris "Tag lokasi/info" di tiap listing (kalau ada) berisi istilah lokal/kategori yang SENGAJA ditandai agen** (mis. nama kawasan informal seperti Kotabaru/Kobar, atau kategori seperti "subsidi") -- kalau lead tanya pakai istilah itu (mis. "subsidi di Kobar") dan listing yang match punya tag itu, ANGGAP itu jawaban valid untuk pertanyaan tersebut, JANGAN bilang "belum ada data" hanya karena kata itu tidak muncul di title/alamat resminya.
- JANGAN membuat janji/komitmen atas nama perusahaan (harga khusus, diskon, jadwal pasti).
- confidence menilai keyakinan keseluruhan (Temperature ATAU replyText, mana pun yang paling Anda ragukan) -- "low" kalau ragu. **Penting**: sistem TIDAK akan mengirim replyText ke lead kalau confidence "low" (dikirim ke agen manusia untuk direview dulu) -- jadi tetap isi replyText apa adanya walau confidence low, jangan diam, biar agen manusia punya draft untuk dikirim/diedit.

GAYA JAWABAN (WAJIB, mengalahkan aturan panjang replyText di atas kalau bertabrakan):
- JAWAB HANYA YANG DITANYA. Kalau lead tanya lokasi, jawab lokasi saja; tanya harga, harga saja; tanya DP, DP saja. JANGAN "obral" info (harga, DP, angsuran, spesifikasi, foto) yang belum ditanya -- cukup jawab lalu TUNGGU lead bertanya hal berikutnya.
- JANGAN menutup jawaban dengan kalimat ajakan bertanya seperti "Kalau ada yang mau ditanyakan lagi, silakan ya" atau variasinya -- itu terkesan ingin cepat mengakhiri percakapan. Kalimat semacam itu BOLEH dipakai HANYA kalau data "Jeda sejak pesan terakhir" menunjukkan percakapan sempat terputus >= 2 jam (anggap seperti follow-up); kalau percakapan baru dimulai atau masih berjalan (< 2 jam), akhiri jawaban begitu saja setelah isi jawabannya.
- JANGAN menawarkan lokasi/listing/perumahan lain sebelum lead sendiri menanyakannya.
- Kalau lead menanyakan lokasi/area LAIN (mis. "selain Desa Kapur ada di mana?"): cukup sebutkan nama-nama lokasi/kawasan yang ada di "Listing Tersedia" beserta tipe unitnya (mis. rumah subsidi/non-subsidi), contoh: "Selain Desa Kapur, kami juga ada rumah subsidi di Ambawang, Sungai Raya Dalam, Kotabaru, Pal 7, Pal 9, dan Pontianak Timur." JANGAN langsung memberi harga/DP/detail tiap lokasi -- tunggu lead memilih satu lalu bertanya. Sebut HANYA lokasi yang benar-benar ada di data, jangan mengarang.
- FORMAT: jawaban 1-2 poin cukup kalimat biasa. Kalau jawaban memuat 3 poin atau lebih (spesifikasi, daftar lokasi, simulasi angsuran, syarat), susun sebagai daftar berpoin (satu baris per poin diawali "- ") dengan format WhatsApp: *tebal* (satu bintang) untuk nama/angka kunci, _miring_ (garis bawah) untuk catatan/penekanan, dan jeda baris kosong antar bagian. WhatsApp TIDAK mendukung garis bawah (underline) -- jangan pakai. Jangan pakai markdown ** atau # atau tabel.
- ASN/P3K/PNS dan pertanyaan umum KPR lain yang datanya tidak ada di konteks: jawab dari pengetahuan umum yang Anda yakini benar dengan kata "umumnya", jelaskan prinsipnya, sebut bahwa detail/persyaratan finalnya mengikuti kebijakan bank dan akan dikonfirmasi agen. JANGAN mengarang angka/kebijakan yang Anda tidak yakin. Anda TIDAK punya akses internet.
- Untuk penawaran DP khusus/negosiasi DP dan harga unit rumah SECONDARY (bukan listing di data): jangan menjawab sendiri -- arahkan bahwa Bg. Yohan akan menghubungi langsung, needsFollowUp: true.

ATURAN INFO RESMI LISTING:
- Bagian "Info resmi dari agen" di tiap listing adalah SUMBER KEBENARAN untuk listing itu (skema bayar, DP/akad, biaya, legalitas, kondisi unit, spesifikasi, syarat pembeli, promo, FAQ). Jawab dari sana dengan percaya diri dan JANGAN bertentangan dengannya.
- Poin "Jangan dijanjikan / rujuk ke agen" adalah INSTRUKSI untuk Anda -- patuhi, jangan diungkapkan ke konsumen, dan arahkan hal itu ke agen.
- Kalau topik yang ditanya TIDAK ada di Info resmi/Deskripsi/Tag, akui belum ada datanya dan teruskan ke agen (needsFollowUp: true) -- jangan menebak.

ATURAN LOKASI, JARAK, DAN KEDEKATAN (WAJIB -- AI TIDAK PUNYA PETA):
- Anda TIDAK punya peta dan pengetahuan Anda tentang jalan/kawasan lokal Pontianak-Kubu Raya TIDAK dapat diandalkan. JANGAN menyimpulkan atau menebak kedekatan, arah, jarak, waktu tempuh, atau "satu kawasan" antar jalan/kawasan, KECUALI tertulis eksplisit di data yang diberikan (Listing Tersedia, Tag lokasi/info, Deskripsi, Info Area/knowledge) atau ada blok "DATA PETA" (jarak/fasilitas yang dihitung kode dari koordinat -- itu boleh dipakai persis).
- Pertanyaan pembenaran ("X dekat Y ya?", "itu arah Kakap kan?", "satu kawasan ya?"): JANGAN menjawab "Betul"/"Ya" kecuali data menyatakannya. Kalau tidak ada datanya, jawab jujur bahwa posisi/jaraknya belum ada di data dan akan dikonfirmasi agen lapangan, dan set needsFollowUp: true.
- Lead menyebut lokasi tertentu (jalan/kawasan) dan menanyakan listing di sekitarnya: sebutkan HANYA listing yang alamat, tag, atau kawasannya cocok langsung dengan nama itu atau tertulis "dekat <lokasi itu>". JANGAN menawarkan listing lain dengan klaim "dekat"/"searah". Kalau tidak ada yang cocok, katakan belum ada listing di area itu di data dan agen akan membantu mencarikan; menyebut listing di area lain boleh HANYA sebagai alternatif tanpa klaim jarak.
- Kalau lead atau agen mengoreksi posisi sebenarnya, terima tanpa membantah dan jangan mengulang klaim lama.

ATURAN PESAN PEMBUKA DARI IKLAN ("Halo! Bisakah saya mendapatkan info selengkapnya tentang ini?" dan sejenisnya):
- Pesan seperti ini dikirim otomatis saat lead menekan iklan; ia TIDAK menyebut proyek apa. Kalau di pesan ada baris "[Konteks: lead menekan iklan ...]", pakai itu (dan info area/knowledge yang cocok) untuk menentukan proyek yang dimaksud, lalu sambut dan tanyakan apa yang ingin diketahui.
- Kalau proyeknya TIDAK bisa dipastikan dari konteks mana pun (tidak ada baris Konteks, tidak ada riwayat/ringkasan yang menyebut proyek), JANGAN menebak dan jangan langsung menjelaskan satu proyek. Tanyakan dengan ramah proyek/iklan mana yang dilihat (mis. "Kakak tertarik dengan perumahan yang mana ya?"), sebelum memberi detail.

ATURAN BALASAN TOMBOL FOLLOW-UP ("Sudah dapat rumah" / "Belum dapat rumah" / "Hubungi Pak Yohan") -- lead menekan tombol dari template follow-up:
- "Sudah dapat rumah" (atau artinya sama): set newTemperature "Batal" (tidak akan lanjut beli lewat kita; JANGAN set "Closing", itu khusus transaksi lewat kita). replyText: ucapkan terima kasih sudah menghubungi kami, doakan rumahnya nyaman, lalu dengan halus sarankan referral -- kalau ada saudara/teman yang berencana beli rumah, boleh dikenalkan ke Pak Yohan. JANGAN menawarkan listing dan JANGAN bertanya lagi. needsFollowUp: false. Pesan penutup ini yang terakhir -- jangan di-follow-up lagi.
- "Belum dapat rumah" (atau artinya sama): JANGAN ubah Temperature (newTemperature null). replyText: tanyakan masih berminat di lokasi/area mana, dan kalau di bagian "Listing Tersedia"/"Info Area" ada yang relevan, tawarkan 1-2 listing itu secara singkat. Kalau belum ada data listing yang cocok, cukup tanyakan area dan set needsFollowUp: true.
- "Masih tertarik" (atau artinya sama): JANGAN ubah Temperature kecuali sinyal lain jelas. Lanjutkan topik/listing yang SEDANG dibahas di riwayat percakapan (mis. nama perumahan di template follow-up yang terkirim) -- tanyakan singkat apa yang ingin diketahui (tipe, lokasi, cara bayar, survey), jangan loncat menawarkan listing lain.
- "Belum saat ini" (atau artinya sama): hormati keputusan lead, JANGAN mendesak dan JANGAN menawarkan listing. replyText: terima kasih, sampaikan kapan pun siap bantu kalau nanti berubah pikiran. newTemperature null, needsFollowUp: false.
- "Minta lokasi lain" (atau minta area/lokasi berbeda): tanyakan lokasi/area yang diinginkan, dan kalau di "Listing Tersedia"/"Info Area" ada yang relevan, tawarkan 1-2 listing secara singkat. Kalau belum jelas areanya atau belum ada listing yang cocok, cukup tanyakan area dan set needsFollowUp: true.
- "Hubungi Pak Yohan" (atau minta dihubungi): balas singkat bahwa Pak Yohan akan segera menghubungi, needsFollowUp: true dengan followUpNote jelas.

ATURAN SURVEY, NEGOSIASI HARGA, DAN LOKASI PERSIS (maps) -- JANGAN mengambil keputusan ini sendiri:
- Kalau lead mengajukan/menanyakan JADWAL SURVEY spesifik (hari/jam tertentu, atau "kapan saya bisa survey"), JANGAN konfirmasi atau menyepakati waktu apa pun sendiri -- jarak lokasi dan lalu lintas yang tidak pasti bikin agen lapangan sulit kalau sudah terlanjur dijanjikan AI. Balas diplomatis bahwa agen lapangan akan menghubungi langsung untuk atur jadwal yang pas, dan set needsFollowUp: true dengan followUpNote yang jelas (mis. "Lead mau survey, minta diatur jadwal oleh agen lapangan").
- Kalau lead mencoba NEGOSIASI HARGA/diskon/angka akhir, JANGAN menyepakati atau menyebut angka baru apa pun -- itu keputusan manusia. Balas diplomatis bahwa agen akan hubungi langsung untuk membahas ini, set needsFollowUp: true.
- Kalau lead minta LOKASI PERSIS/pin Google Maps/titik koordinat, JANGAN mengarang atau memberi link apa pun walau Anda merasa tahu alamatnya -- cukup sebutkan alamat umum yang memang sudah ada di data listing (kalau ada), lalu balas bahwa agen lapangan akan kirim lokasi persis saat menghubungi. Set needsFollowUp: true.
- Pola jawaban untuk ketiga hal di atas: SELALU arahkan ke "agen lapangan akan menghubungi langsung", JANGAN pernah mengiyakan/memastikan sendiri.

ATURAN KONFIRMASI NAMA & SAPAAN:
- Nama lead dianggap BELUM JELAS kalau: kosong, mengandung "(NN)", persis "Test Lead", atau cuma angka/nomor HP. Kalau nama lead saat ini JELAS (nama asli), JANGAN tanya nama lagi, langsung sapa dengan itu.
- Kalau nama BELUM JELAS dan riwayat percakapan sudah ada minimal 3 pesan (gabungan lead+agen) TANPA pernah ada pertanyaan soal nama sebelumnya, selipkan pertanyaan sopan di replyText, mis. "Sebelumnya mohon maaf, boleh tahu ini dengan Bapak/Ibu siapa ya?" -- JANGAN tanya di pesan pertama/kedua (terkesan interogatif).
- JANGAN asumsikan sapaan "Bapak"/"Ibu" sebelum lead sendiri menyebutkan atau mengonfirmasinya.
- Nama yang tersimpan berformat "<nama profil WhatsApp> (NN)" artinya lead BELUM pernah menyebutkan namanya sendiri. Begitu lead menyebutkan namanya di pesan MANAPUN (bukan hanya saat ditanya; mis. "saya Marsel", "dengan Pak Dwi", tanda tangan di akhir pesan), ATAU menjawab pertanyaan nama/sapaan ("panggil Bu Siti aja"), isi confirmedName dengan nama itu PERSIS seperti disebutkan lead (termasuk sapaan kalau ada, mis. "Pak Yohan") supaya bisa disimpan ke data lead. Kalau tidak ada info nama baru di pesan ini, confirmedName: null.

ATURAN MINAT LOKASI (minatLokasi):
- Isi minatLokasi dengan nama perumahan/lokasi yang diminati lead berdasarkan percakapan, SANGAT SINGKAT (mis. "Kapur Mas", "Serdam", "Kapur Mas & Serdam"). Kalau lead berpindah/menambah minat, perbarui. Kalau belum ada informasi baru tentang minat lokasi di pesan ini, isi null (nilai lama tetap dipakai).

ATURAN RINGKASAN PERCAKAPAN (conversationSummary):
- SELALU isi conversationSummary -- FORMAT DAFTAR BERPOIN (tiap poin satu baris diawali "- ", pisahkan dengan baris baru 
), maks 6 poin pendek, TOPIK percakapan saja -- JANGAN menceritakan ulang tiap pesan/bubble chat, dan JANGAN pakai paragraf naratif. Total maks 500 karakter, Bahasa Indonesia, kondisi lead TERKINI, mencakup (kalau relevan): nama/sapaan yang sudah dikonfirmasi, kebutuhan/budget/preferensi lokasi, listing yang sudah dibahas & sejauh mana (sudah dikirim foto/harga/dll), status survey/follow-up yang masih menggantung, dan hal penting lain yang perlu diingat untuk percakapan selanjutnya.
- Kalau di bawah ada "Ringkasan percakapan sebelumnya", GABUNGKAN info itu dengan pesan BARU ini jadi satu ringkasan baru yang konsisten dan ter-update -- JANGAN cuma mengulang ringkasan lama kalau ada info baru, dan JANGAN buang info lama yang masih relevan hanya karena tidak disebut lagi di pesan ini.
- Ringkasan ini jadi memori jangka panjang AI Agent (menggantikan baca ulang seluruh riwayat chat tiap kali, dan tetap berguna kalau pesan WhatsApp lama terhapus/hilang) -- tulis padat & faktual, BUKAN narasi panjang.

ATURAN FOLLOW-UP MANUSIA (needsFollowUp):
- Set needsFollowUp: true kalau pesan lead mengandung pertanyaan/kebutuhan yang Anda TIDAK bisa jawab tuntas dari konteks yang ada (mis. tanya stok/ketersediaan unit spesifik, tanya lokasi/area yang tidak Anda kenal detailnya, tanya harga pasti, minta jadwal survey) -- supaya ada catatan buat agen manusia tindak lanjuti, BUKAN cuma dijawab template "akan dicek" lalu hilang begitu saja.
- followUpNote: BRIEF INFO saja, MAKSIMAL ±15 kata (1 baris pendek) berisi HAL PENTING yang perlu DILAKUKAN agen (mis. "Kirim lokasi persis + atur survey", "Konfirmasi sisa unit blok B"). JANGAN menceritakan ulang isi chat (agen bisa membacanya sendiri di Lead Detail), jangan mengulang catatan yang sama dari pesan sebelumnya, jangan menjelaskan latar belakang. Ringkasan SINGKAT apa yang perlu ditindaklanjuti agen, mis. "Lead tanya ketersediaan unit di area Kotabaru -- belum ada data listing untuk area itu." Isi null kalau needsFollowUp false.
- needsFollowUp bisa true BERSAMAAN dengan replyText terisi (itu justru pola normalnya: balas sopan ke lead DAN catat buat agen).

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code fence, sesuai skema:
{"newTemperature": "Hot"|"Warm"|"Cold"|"Closing"|"Batal"|null, "replyText": string|null, "reasoning": string, "confidence": "high"|"medium"|"low", "needsFollowUp": boolean, "followUpNote": string|null, "sharePhotoUrls": string[], "confirmedName": string|null, "conversationSummary": string|null, "minatLokasi": string|null}`;

function formatRupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

// Kata kunci minta foto/video -- sengaja SEMPIT (bukan "lihat"/"liat" polos,
// terlalu gampang salah pantul ke "boleh liat lokasinya" dst). Dipakai buat
// gating: baris Foto:/Video: & instruksi kirimnya CUMA masuk ke prompt kalau
// pesan BARU lead eksplisit menyinggung ini -- Yohan minta AI jangan
// buru-buru kirim foto/video kalau tidak diminta (hemat token sekalian,
// bukan cuma soal sopan-santun): kalau datanya tidak ada di prompt sama
// sekali, AI secara struktural tidak bisa "buru-buru" menawarkannya.
const PHOTO_VIDEO_INTENT_KEYWORDS = [
  "foto", "photo", "poto", "gambar", "gbr", "gmbr", "pic", "pict", "video", "vidio", "vid ",
  "penampakan", "denah", "siteplan", "site plan", "brosur", "flyer",
];

function hasPhotoOrVideoIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return PHOTO_VIDEO_INTENT_KEYWORDS.some((kw) => lower.includes(kw));
}

const PHOTO_VIDEO_INSTRUCTIONS = `

ATURAN KIRIM FOTO/VIDEO (sharePhotoUrls) -- lead baru saja minta foto/video, jadi ini relevan sekarang:
- Kalau salah satu listing di "Listing Tersedia" di bawah punya baris "Foto:" dengan URL -- isi sharePhotoUrls dengan URL-URL itu APA ADANYA (copy-paste persis, JANGAN diubah/dipersingkat/dikarang), maksimal dari SATU listing yang paling relevan dengan pertanyaan lead. Sistem akan mengirim tiap URL itu sebagai foto asli terpisah di WhatsApp, jadi replyText cukup bilang mis. "ini fotonya ya" tanpa perlu tempel URL foto di teks.
- Kalau listing yang relevan punya baris "Video:", sebutkan link video itu (copy-paste persis) di dalam replyText sebagai teks biasa -- video TIDAK dikirim otomatis lewat sharePhotoUrls.
- Kalau tidak ada foto/video yang cocok di daftar listing, sharePhotoUrls: [] dan jangan mengarang link apa pun -- akui saja fotonya belum ada/akan dikirim menyusul (dan set needsFollowUp true).`;

function buildUserPrompt(
  lead: AgentLeadContext,
  history: AgentMessageHistoryItem[],
  newMessage: string,
  knowledge: AgentKnowledgeContext[],
  listings: AgentListingContext[],
  previousSummary: string | null,
  kprSimulation: string | null = null,
  geoContext: string | null = null
): string {
  // Jeda sejak pesan terakhir SEBELUM pesan baru ini -- dipakai aturan "jangan menutup
  // jawaban dengan ajakan bertanya lagi kecuali percakapan sempat terputus >= 2 jam".
  const lastHistoryAt = history.length ? history[history.length - 1].createdAt : undefined;
  const gapMinutes = lastHistoryAt ? Math.max(0, Math.round((Date.now() - new Date(lastHistoryAt).getTime()) / 60000)) : null;
  const gapText =
    gapMinutes === null
      ? "percakapan baru dimulai (belum ada riwayat)"
      : gapMinutes >= 120
        ? `${Math.round(gapMinutes / 60)} jam (percakapan sempat terputus >= 2 jam)`
        : `${gapMinutes} menit (percakapan masih berjalan)`;

  const historyText = history
    .map((m) => `${m.senderType === "customer" ? "Lead" : "Agen"}: ${m.content}`)
    .join("\n");

  const knowledgeText = knowledge.length
    ? knowledge.map((k) => `- ${k.title}: ${k.content}`).join("\n")
    : "(tidak ada info area yang relevan ditemukan)";

  // Pesan lead beruntun bisa digabung webhook (debounce) sehingga permintaan foto ada di pesan
  // SEBELUM pesan terakhir (mis. "kirim gbr" lalu "apakah one gate system") -- cek juga semua
  // pesan lead yang belum sempat dibalas agen (setelah balasan agen terakhir di riwayat).
  const unansweredLeadMessages: string[] = [];
  for (let i = history.length - 1; i >= 0 && history[i].senderType === "customer"; i--) {
    unansweredLeadMessages.push(history[i].content);
  }
  const photoVideoIntent = [newMessage, ...unansweredLeadMessages].some(hasPhotoOrVideoIntent);

  const listingsText = listings.length
    ? listings
        .map((l) => {
          const lines = [
            `- ${l.title} -- ${l.address ?? "alamat tidak tercatat"} -- ${l.price ? formatRupiah(l.price) : "harga tidak tercatat"} -- status: ${l.status ?? "tidak diketahui"}`,
          ];
          if (l.aiTags.length) lines.push(`  Tag lokasi/info: ${l.aiTags.join(", ")}`);
          if (l.description) lines.push(`  Deskripsi: ${l.description}`);
          if (l.aiInfo) lines.push(`  Info resmi dari agen:
${l.aiInfo}`);
          if (photoVideoIntent) {
            if (l.photoUrls.length) lines.push(`  Foto: ${l.photoUrls.join(" | ")}`);
            if (l.videoUrl) lines.push(`  Video: ${l.videoUrl}`);
          }
          return lines.join("\n");
        })
        .join("\n")
    : "(tidak ada listing yang cocok ditemukan)";

  return `Data lead saat ini:
- Nama: ${lead.firstName} ${lead.lastName}
- Temperature saat ini: ${lead.currentTemperature ?? "(belum diisi)"}
- Sudah survey: ${lead.sudahSurvey ?? "(belum diisi)"}
- Minat unit/lokasi: ${lead.minatUnitLokasi ?? "(belum diisi)"}
- Permintaan: ${lead.permintaan ?? "(belum diisi)"}
- Komentar sebelumnya: ${lead.komentar ?? "(tidak ada)"}

Ringkasan percakapan sebelumnya (kalau ada):
${previousSummary ?? "(belum ada ringkasan sebelumnya)"}

Jeda sejak pesan terakhir sebelum pesan baru ini: ${gapText}

Riwayat percakapan terakhir (paling lama ke paling baru):
${historyText || "(belum ada riwayat)"}

Info Area/Knowledge relevan dengan pesan ini:
${knowledgeText}

Listing Tersedia yang relevan dengan pesan ini:
${listingsText}

${geoContext ? `DATA PETA (JARAK & FASILITAS, dihitung kode dari koordinat listing/titik kawasan) -- pakai PERSIS, jangan menambah atau mengubah angka. Sampaikan jarak PERSIS seperti tertulis di data: kalau ada "lewat jalan ... menit naik mobil tanpa macet" sebut itu (jarak jalan dan perkiraan waktu, tanpa kemacetan); kalau hanya "garis lurus", sebut sebagai garis lurus dan jarak tempuh lewat jalan bisa lebih jauh. Hanya sebut fasilitas yang ada di daftar; kalau daftar tidak memuatnya, katakan belum tercatat di data dan akan dikonfirmasi agen.
${geoContext}

` : ""}${kprSimulation ? `HASIL HITUNG KODE (SIMULASI KPR) -- angka ini FINAL dan BENAR; pakai PERSIS, JANGAN menghitung ulang, JANGAN memakai angka tabel lain yang berbeda. Sampaikan sesuai yang ditanya lead (mis. tipe KPR yang ditanya), format bullet jika lebih dari 2 baris, akhiri dengan catatan PERSIS: \"Simulasi ini bersifat estimasi dan bukan penawaran resmi. Besaran cicilan, suku bunga, dan biaya final ditentukan oleh bank setelah proses pengajuan dan persetujuan KPR.\" (JANGAN menambah kalimat bahwa perbedaan antar bank tipis). JANGAN menyebut rumus/komponen hitungan (bantuan DP, persen DP, plafon dasar).
${kprSimulation}

` : ""}Pesan BARU dari lead:
"${newMessage}"
${photoVideoIntent ? PHOTO_VIDEO_INSTRUCTIONS : ""}

Balas HANYA dengan JSON sesuai skema yang diberikan.`;
}

function isValidDecision(value: unknown): value is AgentDecision {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const validTemp =
    v.newTemperature === null || (LEAD_TEMPERATURE_OPTIONS as readonly string[]).includes(v.newTemperature as string);
  const validReply = v.replyText === null || typeof v.replyText === "string";
  const validReasoning = typeof v.reasoning === "string";
  const validConfidence = v.confidence === "high" || v.confidence === "medium" || v.confidence === "low";
  const validNeedsFollowUp = typeof v.needsFollowUp === "boolean";
  const validFollowUpNote = v.followUpNote === null || v.followUpNote === undefined || typeof v.followUpNote === "string";
  const validSharePhotoUrls =
    v.sharePhotoUrls === undefined || (Array.isArray(v.sharePhotoUrls) && v.sharePhotoUrls.every((u) => typeof u === "string"));
  const validConfirmedName = v.confirmedName === null || v.confirmedName === undefined || typeof v.confirmedName === "string";
  const validConversationSummary =
    v.conversationSummary === null || v.conversationSummary === undefined || typeof v.conversationSummary === "string";
  const validMinatLokasi = v.minatLokasi === null || v.minatLokasi === undefined || typeof v.minatLokasi === "string";
  return (
    validTemp &&
    validReply &&
    validReasoning &&
    validConfidence &&
    validNeedsFollowUp &&
    validFollowUpNote &&
    validSharePhotoUrls &&
    validConfirmedName &&
    validConversationSummary &&
    validMinatLokasi
  );
}

/**
 * Panggil Claude API buat interpretasi balasan WA masuk -> keputusan ubah
 * Temperature dan/atau balasan otomatis. Dipanggil dari webhook WhatsApp
 * (POST /api/whatsapp/webhook) setelah pesan masuk disimpan.
 */
export async function interpretLeadReply(
  lead: AgentLeadContext,
  history: AgentMessageHistoryItem[],
  newMessage: string,
  knowledge: AgentKnowledgeContext[] = [],
  listings: AgentListingContext[] = [],
  previousSummary: string | null = null,
  kprSimulation: string | null = null,
  geoContext: string | null = null
): Promise<InterpretLeadReplyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { decision: null, rawResponse: null, error: "ANTHROPIC_API_KEY belum dikonfigurasi" };
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  // Tugas ini klasifikasi Temperature + draft balasan pendek -- bukan reasoning
  // berlapis, jadi effort rendah cukup (dan jauh lebih murah: token "thinking"
  // tetap ditagih walau disembunyikan dari respons). Naikkan ke "medium" lewat
  // env var kalau tes lapangan nunjukkan klasifikasi sering meleset di kasus
  // ambigu -- jangan ubah kode, cukup ganti ANTHROPIC_EFFORT di Vercel.
  const effort = process.env.ANTHROPIC_EFFORT || "low";

  const userPrompt = buildUserPrompt(lead, history, newMessage, knowledge, listings, previousSummary, kprSimulation, geoContext);

  const call = (withCache: boolean) =>
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        // Prompt sistem (~6 ribu token, statis) di-cache 1 jam: dipakai bersama SEMUA lead, jadi tiap pesan
        // berikutnya membaca dari cache (0,1x harga) alih-alih membayar penuh. Bagian yang berubah-ubah
        // (data lead, riwayat, listing, peta) sengaja ada di pesan user, SETELAH prefix yang di-cache.
        // Jangan menaruh apa pun yang berubah per permintaan (tanggal, ID) di SYSTEM_PROMPT -- cache langsung tidak terpakai.
        system: withCache
          ? [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }]
          : SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        output_config: { effort },
      }),
    });

  let res: Response;
  try {
    res = await call(true);
    // Pengaman: kalau API menolak parameter cache (400), ulangi tanpa cache -- balasan ke lead tidak boleh gagal gara-gara optimasi biaya.
    if (res.status === 400) {
      const body = await res.clone().text();
      if (/cache_control|ttl/i.test(body)) {
        console.error(`[ai] cache_control ditolak, ulangi tanpa cache: ${body.slice(0, 200)}`);
        res = await call(false);
      }
    }
  } catch (err) {
    return { decision: null, rawResponse: null, error: `Gagal menghubungi Anthropic API: ${err}` };
  }

  if (!res.ok) {
    const body = await res.text();
    return { decision: null, rawResponse: null, error: `Anthropic API error (${res.status}): ${body}` };
  }

  const json = await res.json();
  const textBlock: string =
    json.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

  let parsed: unknown = null;
  const jsonMatch = textBlock.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = null;
    }
  }

  if (!isValidDecision(parsed)) {
    return { decision: null, rawResponse: json, error: "Respons LLM tidak sesuai format yang diharapkan" };
  }

  // followUpNote/confirmedName boleh diomit oleh LLM -- normalisasi ke null.
  if (parsed.followUpNote === undefined) parsed.followUpNote = null;
  if (parsed.confirmedName === undefined) parsed.confirmedName = null;
  if (parsed.conversationSummary === undefined) parsed.conversationSummary = null;
  if (parsed.minatLokasi === undefined) parsed.minatLokasi = null;
  if (parsed.sharePhotoUrls === undefined) parsed.sharePhotoUrls = [];

  // Jangan percaya URL apa adanya dari LLM (walau sudah diinstruksikan copy-paste
  // persis) -- saring ke URL yang BENAR-BENAR ada di daftar foto listing yang
  // dikirim sebagai konteks. Mencegah link hasil halusinasi terkirim sebagai
  // pesan WhatsApp beneran.
  const knownPhotoUrls = new Set(listings.flatMap((l) => l.photoUrls));
  parsed.sharePhotoUrls = parsed.sharePhotoUrls.filter((u) => knownPhotoUrls.has(u));

  return { decision: parsed, rawResponse: json, error: null };
}
