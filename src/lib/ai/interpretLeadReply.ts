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

ARTI "Temperature" (WAJIB dipahami persis, jangan tebak dari namanya):
- Hot: sangat berminat, aktif merespons, kemungkinan besar akan survey/closing dalam waktu dekat.
- Warm: berminat tapi belum urgent, masih perlu di-nurture.
- Cold: dulu pernah kontak tapi sudah lama tidak aktif/tidak merespons, berpotensi diaktifkan lagi.
- Closing: SUDAH closing/booking/akad -- transaksi SELESAI, bukan "menuju closing" atau "berisiko batal". JANGAN PERNAH set status ini kecuali lead eksplisit bilang sudah booking/DP/akad/tanda tangan.
- Batal: lead sudah eksplisit menyatakan tidak jadi/batal, transaksi tidak akan lanjut.

ATURAN UBAH TEMPERATURE:
- Set newTemperature HANYA kalau ada sinyal jelas dari pesan lead (mis. "saya sudah booking" -> Closing; "gak jadi ya, budget gak cukup" -> Batal; lead yang lama tidak aktif tiba-tiba merespons dengan antusias -> Hot).
- Kalau tidak ada sinyal jelas untuk berubah, set newTemperature: null (JANGAN asal isi field ini).

ATURAN BALAS OTOMATIS:
- SELALU balas (replyText TIDAK boleh null) -- diam total terkesan lead di-ignore. Satu-satunya alasan replyText: null adalah kalau pesan lead butuh keputusan manusia murni yang sensitif (komplain serius, ancaman hukum, negosiasi harga besar) -- itu jarang, bukan default.
- replyText singkat (1-2 kalimat), natural, sopan, bahasa Indonesia, gaya agen properti manusia asli -- BUKAN kalimat template/robot. **Variasikan kata-katanya setiap kali** -- kalau dalam percakapan yang sama Anda sudah bilang "saya cek dulu ya" sebelumnya dan sekarang harus bilang hal serupa lagi (pertanyaan lain yang juga tidak ada datanya), JANGAN ulangi kalimat persis sama -- ganti susunan kata/gaya seolah orang berbeda yang sedang mengetik balasan wajar, bukan copy-paste.
- JANGAN mengarang detail properti spesifik (harga, unit, ketersediaan, lokasi persis) yang TIDAK ADA di konteks yang diberikan -- kalau lead tanya hal spesifik yang Anda tidak punya datanya, akui dengan wajar (bukan defensif) bahwa itu perlu dicek dulu, dan sebutkan akan diteruskan/dikabari -- JANGAN menebak angka atau detail apa pun.
- **TAPI kalau di bawah ada bagian "Info Area" dan/atau "Listing Tersedia" yang relevan dengan pertanyaan lead, itu DATA ASLI dari database -- gunakan dengan percaya diri.** Sebutkan nama listing/alamat/harga/status dari daftar itu secara natural. **Baris "Deskripsi" per listing (kalau ada) sering berisi detail spesifik yang ditanya lead -- DP akad, harga KPR vs cash per blok/tipe, promo, cicilan -- BACA dan pakai itu untuk jawab, jangan cuma lihat harga/status ringkasan di baris atasnya.** JANGAN bilang "akan dicek dulu" untuk sesuatu yang datanya SUDAH ada di daftar itu (termasuk yang ada di Deskripsi) -- langsung informasikan. "Tidak ada data" cuma berlaku untuk hal yang benar-benar tidak muncul di manapun (title/alamat/harga/status/Deskripsi/tag).
- **Baris "Tag lokasi/info" di tiap listing (kalau ada) berisi istilah lokal/kategori yang SENGAJA ditandai agen** (mis. nama kawasan informal seperti Kotabaru/Kobar, atau kategori seperti "subsidi") -- kalau lead tanya pakai istilah itu (mis. "subsidi di Kobar") dan listing yang match punya tag itu, ANGGAP itu jawaban valid untuk pertanyaan tersebut, JANGAN bilang "belum ada data" hanya karena kata itu tidak muncul di title/alamat resminya.
- JANGAN membuat janji/komitmen atas nama perusahaan (harga khusus, diskon, jadwal pasti).
- confidence menilai keyakinan keseluruhan (Temperature ATAU replyText, mana pun yang paling Anda ragukan) -- "low" kalau ragu. **Penting**: sistem TIDAK akan mengirim replyText ke lead kalau confidence "low" (dikirim ke agen manusia untuk direview dulu) -- jadi tetap isi replyText apa adanya walau confidence low, jangan diam, biar agen manusia punya draft untuk dikirim/diedit.

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
- Kalau pesan BARU dari lead berisi jawaban atas pertanyaan nama (nama atau sapaan yang diinginkan, mis. "saya Pak Yohan" / "panggil Bu Siti aja"), isi confirmedName dengan nama itu PERSIS seperti disebutkan lead (termasuk sapaan kalau ada, mis. "Pak Yohan") supaya bisa disimpan ke data lead. Kalau tidak ada info nama baru di pesan ini, confirmedName: null.

ATURAN RINGKASAN PERCAKAPAN (conversationSummary):
- SELALU isi conversationSummary -- ringkasan singkat (maks 500 karakter) kondisi lead TERKINI, Bahasa Indonesia, mencakup (kalau relevan): nama/sapaan yang sudah dikonfirmasi, kebutuhan/budget/preferensi lokasi, listing yang sudah dibahas & sejauh mana (sudah dikirim foto/harga/dll), status survey/follow-up yang masih menggantung, dan hal penting lain yang perlu diingat untuk percakapan selanjutnya.
- Kalau di bawah ada "Ringkasan percakapan sebelumnya", GABUNGKAN info itu dengan pesan BARU ini jadi satu ringkasan baru yang konsisten dan ter-update -- JANGAN cuma mengulang ringkasan lama kalau ada info baru, dan JANGAN buang info lama yang masih relevan hanya karena tidak disebut lagi di pesan ini.
- Ringkasan ini jadi memori jangka panjang AI Agent (menggantikan baca ulang seluruh riwayat chat tiap kali, dan tetap berguna kalau pesan WhatsApp lama terhapus/hilang) -- tulis padat & faktual, BUKAN narasi panjang.

ATURAN FOLLOW-UP MANUSIA (needsFollowUp):
- Set needsFollowUp: true kalau pesan lead mengandung pertanyaan/kebutuhan yang Anda TIDAK bisa jawab tuntas dari konteks yang ada (mis. tanya stok/ketersediaan unit spesifik, tanya lokasi/area yang tidak Anda kenal detailnya, tanya harga pasti, minta jadwal survey) -- supaya ada catatan buat agen manusia tindak lanjuti, BUKAN cuma dijawab template "akan dicek" lalu hilang begitu saja.
- followUpNote: ringkasan SINGKAT (1 kalimat) apa yang perlu ditindaklanjuti agen, mis. "Lead tanya ketersediaan unit di area Kotabaru -- belum ada data listing untuk area itu." Isi null kalau needsFollowUp false.
- needsFollowUp bisa true BERSAMAAN dengan replyText terisi (itu justru pola normalnya: balas sopan ke lead DAN catat buat agen).

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code fence, sesuai skema:
{"newTemperature": "Hot"|"Warm"|"Cold"|"Closing"|"Batal"|null, "replyText": string|null, "reasoning": string, "confidence": "high"|"medium"|"low", "needsFollowUp": boolean, "followUpNote": string|null, "sharePhotoUrls": string[], "confirmedName": string|null, "conversationSummary": string|null}`;

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
const PHOTO_VIDEO_INTENT_KEYWORDS = ["foto", "photo", "poto", "gambar", "pic", "video", "penampakan", "denah"];

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
  previousSummary: string | null
): string {
  const historyText = history
    .map((m) => `${m.senderType === "customer" ? "Lead" : "Agen"}: ${m.content}`)
    .join("\n");

  const knowledgeText = knowledge.length
    ? knowledge.map((k) => `- ${k.title}: ${k.content}`).join("\n")
    : "(tidak ada info area yang relevan ditemukan)";

  const photoVideoIntent = hasPhotoOrVideoIntent(newMessage);

  const listingsText = listings.length
    ? listings
        .map((l) => {
          const lines = [
            `- ${l.title} -- ${l.address ?? "alamat tidak tercatat"} -- ${l.price ? formatRupiah(l.price) : "harga tidak tercatat"} -- status: ${l.status ?? "tidak diketahui"}`,
          ];
          if (l.aiTags.length) lines.push(`  Tag lokasi/info: ${l.aiTags.join(", ")}`);
          if (l.description) lines.push(`  Deskripsi: ${l.description}`);
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

Riwayat percakapan terakhir (paling lama ke paling baru):
${historyText || "(belum ada riwayat)"}

Info Area/Knowledge relevan dengan pesan ini:
${knowledgeText}

Listing Tersedia yang relevan dengan pesan ini:
${listingsText}

Pesan BARU dari lead:
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
  return (
    validTemp &&
    validReply &&
    validReasoning &&
    validConfidence &&
    validNeedsFollowUp &&
    validFollowUpNote &&
    validSharePhotoUrls &&
    validConfirmedName &&
    validConversationSummary
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
  previousSummary: string | null = null
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

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(lead, history, newMessage, knowledge, listings, previousSummary) }],
        output_config: { effort },
      }),
    });
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
  if (parsed.sharePhotoUrls === undefined) parsed.sharePhotoUrls = [];

  // Jangan percaya URL apa adanya dari LLM (walau sudah diinstruksikan copy-paste
  // persis) -- saring ke URL yang BENAR-BENAR ada di daftar foto listing yang
  // dikirim sebagai konteks. Mencegah link hasil halusinasi terkirim sebagai
  // pesan WhatsApp beneran.
  const knownPhotoUrls = new Set(listings.flatMap((l) => l.photoUrls));
  parsed.sharePhotoUrls = parsed.sharePhotoUrls.filter((u) => knownPhotoUrls.has(u));

  return { decision: parsed, rawResponse: json, error: null };
}
