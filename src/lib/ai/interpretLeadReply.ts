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

export interface AgentDecision {
  newTemperature: (typeof LEAD_TEMPERATURE_OPTIONS)[number] | null;
  replyText: string | null;
  reasoning: string;
  confidence: "high" | "medium" | "low";
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
- replyText singkat, natural, sopan, bahasa Indonesia, gaya agen properti manusia (bukan robot).
- JANGAN mengarang detail properti spesifik (harga, unit, ketersediaan) yang tidak ada di konteks yang diberikan -- kalau lead tanya hal spesifik yang Anda tidak punya datanya, balas dengan mengakui akan dicek/diteruskan ke agen, JANGAN menebak angka.
- JANGAN membuat janji/komitmen atas nama perusahaan (harga khusus, diskon, jadwal pasti).
- Kalau pesan lead memerlukan respons manusia (komplain, negosiasi harga, pertanyaan sangat spesifik di luar konteks) -- set replyText: null, biar agen manusia yang balas manual.
- confidence "low" kalau ragu -- replyText sebaiknya null kalau confidence low.

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code fence, sesuai skema:
{"newTemperature": "Hot"|"Warm"|"Cold"|"Closing"|"Batal"|null, "replyText": string|null, "reasoning": string, "confidence": "high"|"medium"|"low"}`;

function buildUserPrompt(
  lead: AgentLeadContext,
  history: AgentMessageHistoryItem[],
  newMessage: string
): string {
  const historyText = history
    .map((m) => `${m.senderType === "customer" ? "Lead" : "Agen"}: ${m.content}`)
    .join("\n");

  return `Data lead saat ini:
- Nama: ${lead.firstName} ${lead.lastName}
- Temperature saat ini: ${lead.currentTemperature ?? "(belum diisi)"}
- Sudah survey: ${lead.sudahSurvey ?? "(belum diisi)"}
- Minat unit/lokasi: ${lead.minatUnitLokasi ?? "(belum diisi)"}
- Permintaan: ${lead.permintaan ?? "(belum diisi)"}
- Komentar sebelumnya: ${lead.komentar ?? "(tidak ada)"}

Riwayat percakapan terakhir (paling lama ke paling baru):
${historyText || "(belum ada riwayat)"}

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
  return validTemp && validReply && validReasoning && validConfidence;
}

/**
 * Panggil Claude API buat interpretasi balasan WA masuk -> keputusan ubah
 * Temperature dan/atau balasan otomatis. Dipanggil dari webhook WhatsApp
 * (POST /api/whatsapp/webhook) setelah pesan masuk disimpan.
 */
export async function interpretLeadReply(
  lead: AgentLeadContext,
  history: AgentMessageHistoryItem[],
  newMessage: string
): Promise<InterpretLeadReplyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { decision: null, rawResponse: null, error: "ANTHROPIC_API_KEY belum dikonfigurasi" };
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

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
        messages: [{ role: "user", content: buildUserPrompt(lead, history, newMessage) }],
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

  return { decision: parsed, rawResponse: json, error: null };
}
