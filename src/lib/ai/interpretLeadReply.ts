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
}

export interface AgentDecision {
  newTemperature: (typeof LEAD_TEMPERATURE_OPTIONS)[number] | null;
  replyText: string | null;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  needsFollowUp: boolean;
  followUpNote: string | null;
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
- **TAPI kalau di bawah ada bagian "Info Area" dan/atau "Listing Tersedia" yang relevan dengan pertanyaan lead, itu DATA ASLI dari database -- gunakan dengan percaya diri.** Sebutkan nama listing/alamat/harga/status dari daftar itu secara natural. JANGAN bilang "akan dicek dulu" untuk sesuatu yang datanya SUDAH ada di daftar itu -- langsung informasikan. "Tidak ada data" cuma berlaku untuk hal yang benar-benar tidak muncul di kedua daftar itu.
- JANGAN membuat janji/komitmen atas nama perusahaan (harga khusus, diskon, jadwal pasti).
- confidence menilai keyakinan keseluruhan (Temperature ATAU replyText, mana pun yang paling Anda ragukan) -- "low" kalau ragu. **Penting**: sistem TIDAK akan mengirim replyText ke lead kalau confidence "low" (dikirim ke agen manusia untuk direview dulu) -- jadi tetap isi replyText apa adanya walau confidence low, jangan diam, biar agen manusia punya draft untuk dikirim/diedit.

ATURAN FOLLOW-UP MANUSIA (needsFollowUp):
- Set needsFollowUp: true kalau pesan lead mengandung pertanyaan/kebutuhan yang Anda TIDAK bisa jawab tuntas dari konteks yang ada (mis. tanya stok/ketersediaan unit spesifik, tanya lokasi/area yang tidak Anda kenal detailnya, tanya harga pasti, minta jadwal survey) -- supaya ada catatan buat agen manusia tindak lanjuti, BUKAN cuma dijawab template "akan dicek" lalu hilang begitu saja.
- followUpNote: ringkasan SINGKAT (1 kalimat) apa yang perlu ditindaklanjuti agen, mis. "Lead tanya ketersediaan unit di area Kotabaru -- belum ada data listing untuk area itu." Isi null kalau needsFollowUp false.
- needsFollowUp bisa true BERSAMAAN dengan replyText terisi (itu justru pola normalnya: balas sopan ke lead DAN catat buat agen).

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code fence, sesuai skema:
{"newTemperature": "Hot"|"Warm"|"Cold"|"Closing"|"Batal"|null, "replyText": string|null, "reasoning": string, "confidence": "high"|"medium"|"low", "needsFollowUp": boolean, "followUpNote": string|null}`;

function formatRupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function buildUserPrompt(
  lead: AgentLeadContext,
  history: AgentMessageHistoryItem[],
  newMessage: string,
  knowledge: AgentKnowledgeContext[],
  listings: AgentListingContext[]
): string {
  const historyText = history
    .map((m) => `${m.senderType === "customer" ? "Lead" : "Agen"}: ${m.content}`)
    .join("\n");

  const knowledgeText = knowledge.length
    ? knowledge.map((k) => `- ${k.title}: ${k.content}`).join("\n")
    : "(tidak ada info area yang relevan ditemukan)";

  const listingsText = listings.length
    ? listings
        .map(
          (l) =>
            `- ${l.title} -- ${l.address ?? "alamat tidak tercatat"} -- ${l.price ? formatRupiah(l.price) : "harga tidak tercatat"} -- status: ${l.status ?? "tidak diketahui"}`
        )
        .join("\n")
    : "(tidak ada listing yang cocok ditemukan)";

  return `Data lead saat ini:
- Nama: ${lead.firstName} ${lead.lastName}
- Temperature saat ini: ${lead.currentTemperature ?? "(belum diisi)"}
- Sudah survey: ${lead.sudahSurvey ?? "(belum diisi)"}
- Minat unit/lokasi: ${lead.minatUnitLokasi ?? "(belum diisi)"}
- Permintaan: ${lead.permintaan ?? "(belum diisi)"}
- Komentar sebelumnya: ${lead.komentar ?? "(tidak ada)"}

Riwayat percakapan terakhir (paling lama ke paling baru):
${historyText || "(belum ada riwayat)"}

Info Area/Knowledge relevan dengan pesan ini:
${knowledgeText}

Listing Tersedia yang relevan dengan pesan ini:
${listingsText}

Pesan BARU dari lead:
"${newMessage}"

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
  return validTemp && validReply && validReasoning && validConfidence && validNeedsFollowUp && validFollowUpNote;
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
  listings: AgentListingContext[] = []
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
        messages: [{ role: "user", content: buildUserPrompt(lead, history, newMessage, knowledge, listings) }],
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

  // followUpNote boleh diomit oleh LLM saat needsFollowUp false -- normalisasi ke null.
  if (parsed.followUpNote === undefined) parsed.followUpNote = null;

  return { decision: parsed, rawResponse: json, error: null };
}
